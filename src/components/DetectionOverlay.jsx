import { useEffect, useRef } from 'react'
import { CLASS_STYLE } from '../lib/vehicleDetection'

// Draws boxes over a video rendered with `object-fit: cover`, so detection
// coordinates (in source pixels) are mapped through the same crop and scale.
export default function DetectionOverlay({ videoRef, detections }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    if (!video || !video.videoWidth || detections.length === 0) return

    const scale = Math.max(w / video.videoWidth, h / video.videoHeight)
    const offX = (w - video.videoWidth * scale) / 2
    const offY = (h - video.videoHeight * scale) / 2

    ctx.font = '500 11px Inter, Anuphan, sans-serif'
    ctx.textBaseline = 'middle'
    for (const d of detections) {
      const style = CLASS_STYLE[d.class]
      const [x, y, bw, bh] = d.bbox
      const rx = offX + x * scale
      const ry = offY + y * scale
      const rw = bw * scale
      const rh = bh * scale

      ctx.strokeStyle = style.color
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(rx, ry, rw, rh, 4)
      ctx.stroke()

      const text = `${style.label} ${Math.round(d.score * 100)}%`
      const tw = ctx.measureText(text).width + 10
      const ty = ry - 18 < 0 ? ry + 2 : ry - 18
      ctx.fillStyle = style.color
      ctx.beginPath()
      ctx.roundRect(rx, ty, tw, 16, 4)
      ctx.fill()
      ctx.fillStyle = '#141413'
      ctx.fillText(text, rx + 5, ty + 8.5)
    }
  }, [detections, videoRef])

  return <canvas ref={canvasRef} className="detection-overlay" aria-hidden="true" />
}
