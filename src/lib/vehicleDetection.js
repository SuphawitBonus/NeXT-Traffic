import { useEffect, useRef, useState } from 'react'

// COCO-SSD classes we count, mapped onto the three counters shown in the UI
export const VEHICLE_GROUP = { car: 'cars', motorcycle: 'bikes', truck: 'trucks', bus: 'trucks' }

export const CLASS_STYLE = {
  car: { label: 'รถยนต์', color: '#a9d4ff' },
  motorcycle: { label: 'มอเตอร์ไซค์', color: '#ffe9a8' },
  truck: { label: 'รถบรรทุก', color: '#ffc98f' },
  bus: { label: 'รถบัส', color: '#ffc98f' },
}

const INTERVAL_MS = 1000
const MIN_SCORE = 0.35
const MAX_BOX_FRACTION = 0.35
const EMPTY_COUNTS = { cars: 0, bikes: 0, trucks: 0 }

let modelPromise = null
let tileCanvas = null

function overlapRatio(a, b) {
  const x1 = Math.max(a[0], b[0])
  const y1 = Math.max(a[1], b[1])
  const x2 = Math.min(a[0] + a[2], b[0] + b[2])
  const y2 = Math.min(a[1] + a[3], b[1] + b[3])
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  return inter / Math.min(a[2] * a[3], b[2] * b[3])
}

// Merge boxes found by overlapping passes; a box mostly inside a stronger one is the same vehicle
function dedupe(dets) {
  const kept = []
  for (const d of [...dets].sort((a, b) => b.score - a.score)) {
    if (!kept.some((k) => overlapRatio(k.bbox, d.bbox) > 0.6)) kept.push(d)
  }
  return kept
}

async function detectPass(model, source, offX, offY, sourceArea) {
  const found = await model.detect(source, 40, MIN_SCORE)
  // Boxes spanning most of the input are a known COCO-SSD false positive on wide road shots
  return found
    .filter((d) => VEHICLE_GROUP[d.class] && d.bbox[2] * d.bbox[3] < sourceArea * MAX_BOX_FRACTION)
    .map((d) => ({ ...d, bbox: [d.bbox[0] + offX, d.bbox[1] + offY, d.bbox[2], d.bbox[3]] }))
}

// The model sees a 300x300 input, so distant cars vanish on a full frame.
// One full-frame pass (near, large vehicles) + 2x2 overlapping tiles (far, small ones).
async function detectVehicles(model, video) {
  const vw = video.videoWidth
  const vh = video.videoHeight
  const results = await detectPass(model, video, 0, 0, vw * vh)

  const tw = Math.round((vw / 2) * 1.15)
  const th = Math.round((vh / 2) * 1.15)
  tileCanvas ??= document.createElement('canvas')
  tileCanvas.width = tw
  tileCanvas.height = th
  const ctx = tileCanvas.getContext('2d')
  for (const sy of [0, vh - th]) {
    for (const sx of [0, vw - tw]) {
      ctx.drawImage(video, sx, sy, tw, th, 0, 0, tw, th)
      results.push(...(await detectPass(model, tileCanvas, sx, sy, tw * th)))
    }
  }
  return dedupe(results)
}

// TensorFlow.js is large, so it's only fetched the first time detection is switched on
export function loadDetector() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import('@tensorflow/tfjs-core')
      await import('@tensorflow/tfjs-backend-webgl')
      // COCO-SSD switches to the CPU backend for its non-max-suppression step
      await import('@tensorflow/tfjs-backend-cpu')
      await tf.setBackend('webgl')
      await tf.ready()
      const cocoSsd = await import('@tensorflow-models/coco-ssd')
      return cocoSsd.load({ base: 'lite_mobilenet_v2' })
    })().catch((err) => {
      modelPromise = null
      throw err
    })
  }
  return modelPromise
}

export function useVehicleDetection(videoRef, enabled, resetKey) {
  const [status, setStatus] = useState('off')
  const [counts, setCounts] = useState(EMPTY_COUNTS)
  const [detections, setDetections] = useState([])
  const busy = useRef(false)

  useEffect(() => {
    setCounts(EMPTY_COUNTS)
    setDetections([])
  }, [resetKey])

  useEffect(() => {
    if (!enabled) {
      setStatus('off')
      setDetections([])
      return
    }
    let cancelled = false
    let timer = null
    setStatus('loading')

    loadDetector()
      .then((model) => {
        if (cancelled) return
        setStatus('running')
        timer = setInterval(async () => {
          const video = videoRef.current
          if (busy.current || !video || video.readyState < 2 || video.paused || document.hidden) return
          busy.current = true
          try {
            const vehicles = await detectVehicles(model, video)
            if (cancelled) return
            const next = { ...EMPTY_COUNTS }
            for (const v of vehicles) next[VEHICLE_GROUP[v.class]] += 1
            setCounts(next)
            setDetections(vehicles)
          } catch (err) {
            // e.g. a frame that can't be read yet while the stream switches
            console.warn('vehicle detection skipped a frame:', err?.message)
          } finally {
            busy.current = false
          }
        }, INTERVAL_MS)
      })
      .catch((err) => {
        console.error('Failed to load detector', err)
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [enabled, videoRef])

  return { status, counts, detections }
}
