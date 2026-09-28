import { useEffect, useRef } from 'react'

function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function gaussian(rand) {
  const u = rand() || 1e-6
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const DUST_COLORS = ['255,248,236', '185,215,255', '255,217,198', '179,254,239']

function buildScene(points) {
  const rand = seeded(7)
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  const bounds = {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  }
  const center = {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2,
  }

  const dust = []
  for (const p of points) {
    for (let i = 0; i < 12; i++) {
      dust.push({
        lat: p.lat + gaussian(rand) * 0.012,
        lng: p.lng + gaussian(rand) * 0.012,
        r: 0.4 + rand() * 0.9,
        a: 0.15 + rand() * 0.45,
        c: DUST_COLORS[Math.floor(rand() * DUST_COLORS.length)],
        phase: rand() * Math.PI * 2,
      })
    }
  }
  for (let i = 0; i < 260; i++) {
    const spread = 0.035 + rand() * 0.05
    dust.push({
      lat: center.lat + gaussian(rand) * spread,
      lng: center.lng + gaussian(rand) * spread * 1.2,
      r: 0.3 + rand() * 0.8,
      a: 0.08 + rand() * 0.35,
      c: DUST_COLORS[Math.floor(rand() * DUST_COLORS.length)],
      phase: rand() * Math.PI * 2,
    })
  }

  const stars = Array.from({ length: 180 }, () => ({
    x: rand(),
    y: rand(),
    r: 0.3 + rand() * 0.7,
    a: 0.05 + rand() * 0.25,
    phase: rand() * Math.PI * 2,
  }))

  const edges = []
  points.forEach((p, i) => {
    const nearest = points
      .map((q, j) => ({ j, d: Math.hypot(p.lat - q.lat, p.lng - q.lng) }))
      .filter((n) => n.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
    for (const n of nearest) {
      const key = i < n.j ? `${i}-${n.j}` : `${n.j}-${i}`
      if (!edges.some((e) => e.key === key)) {
        edges.push({ key, a: i, b: n.j, offset: rand(), speed: 0.03 + rand() * 0.05 })
      }
    }
  })

  return { bounds, dust, stars, edges }
}

export default function CityConstellation({ points }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const scene = buildScene(points)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let frame = 0

    function project(lat, lng) {
      const { minLat, maxLat, minLng, maxLng } = scene.bounds
      const wide = width > 900
      const areaW = wide ? width * 0.55 : width * 0.9
      const areaH = height * 0.78
      const originX = wide ? width * 0.42 : width * 0.05
      const originY = height * 0.11
      const spanLng = (maxLng - minLng) * Math.cos((13.75 * Math.PI) / 180)
      const spanLat = maxLat - minLat
      const scale = Math.min(areaW / spanLng, areaH / spanLat)
      const offX = originX + (areaW - spanLng * scale) / 2
      const offY = originY + (areaH - spanLat * scale) / 2
      return [
        offX + (lng - minLng) * Math.cos((13.75 * Math.PI) / 180) * scale,
        offY + (maxLat - lat) * scale,
      ]
    }

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const mouse = { x: 0, y: 0, sx: 0, sy: 0, active: false, strength: 0 }
    const host = canvas.parentElement

    function onPointerMove(e) {
      const rect = host.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      if (!mouse.active) {
        mouse.sx = mouse.x
        mouse.sy = mouse.y
      }
      mouse.active = true
      if (reduceMotion) {
        mouse.sx = mouse.x
        mouse.sy = mouse.y
        mouse.strength = 1
        draw(0)
      }
    }

    function onPointerLeave() {
      mouse.active = false
      if (reduceMotion) {
        mouse.strength = 0
        draw(0)
      }
    }

    function drawLabel(text, x, y) {
      ctx.font = '500 12px Inter, Anuphan, sans-serif'
      const w = ctx.measureText(text).width + 20
      const h = 26
      let lx = x + 14
      const ly = y - h - 10
      if (lx + w > width - 8) lx = x - w - 14
      ctx.fillStyle = 'rgba(20,20,19,0.85)'
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(lx, ly, w, h, 13)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = 'rgba(248,248,245,0.95)'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, lx + 10, ly + h / 2 + 0.5)
    }

    function draw(time) {
      const t = time / 1000
      ctx.clearRect(0, 0, width, height)

      if (!reduceMotion) {
        mouse.sx += (mouse.x - mouse.sx) * 0.12
        mouse.sy += (mouse.y - mouse.sy) * 0.12
        mouse.strength += ((mouse.active ? 1 : 0) - mouse.strength) * 0.06
      }
      const ms = mouse.strength

      if (ms > 0.01) {
        const halo = ctx.createRadialGradient(mouse.sx, mouse.sy, 0, mouse.sx, mouse.sy, 180)
        halo.addColorStop(0, `rgba(185,215,255,${0.07 * ms})`)
        halo.addColorStop(1, 'rgba(185,215,255,0)')
        ctx.fillStyle = halo
        ctx.fillRect(mouse.sx - 180, mouse.sy - 180, 360, 360)
      }

      for (const s of scene.stars) {
        const tw = 0.6 + 0.4 * Math.sin(t * 0.8 + s.phase)
        ctx.fillStyle = `rgba(255,255,255,${s.a * tw})`
        ctx.beginPath()
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const d of scene.dust) {
        let [x, y] = project(d.lat, d.lng)
        if (ms > 0.01) {
          const dx = x - mouse.sx
          const dy = y - mouse.sy
          const dist = Math.hypot(dx, dy) || 1
          if (dist < 110) {
            const push = (1 - dist / 110) ** 2 * 22 * ms
            x += (dx / dist) * push
            y += (dy / dist) * push
          }
        }
        const tw = 0.7 + 0.3 * Math.sin(t * 1.2 + d.phase)
        ctx.fillStyle = `rgba(${d.c},${d.a * tw})`
        ctx.beginPath()
        ctx.arc(x, y, d.r, 0, Math.PI * 2)
        ctx.fill()
      }

      const projected = points.map((p) => project(p.lat, p.lng))

      ctx.lineWidth = 0.75
      for (const e of scene.edges) {
        const [x1, y1] = projected[e.a]
        const [x2, y2] = projected[e.b]
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        const k = (t * e.speed + e.offset) % 1
        const px = x1 + (x2 - x1) * k
        const py = y1 + (y2 - y1) * k
        ctx.fillStyle = 'rgba(255,248,236,0.75)'
        ctx.beginPath()
        ctx.arc(px, py, 1.1, 0, Math.PI * 2)
        ctx.fill()
      }

      let hovered = null
      let hoveredDist = 30

      points.forEach((p, i) => {
        const [x, y] = projected[i]
        const dist = Math.hypot(x - mouse.sx, y - mouse.sy)
        const near = ms > 0.01 ? Math.max(0, 1 - dist / 160) * ms : 0

        if (near > 0) {
          ctx.strokeStyle = `rgba(185,215,255,${0.35 * near})`
          ctx.lineWidth = 0.75
          ctx.beginPath()
          ctx.moveTo(mouse.sx, mouse.sy)
          ctx.lineTo(x, y)
          ctx.stroke()
        }
        if (p.label && ms > 0.5 && dist < hoveredDist) {
          hovered = { p, x, y }
          hoveredDist = dist
        }

        const pulse = 1 + 0.15 * Math.sin(t * 1.5 + i)
        const r = (p.size || 3) * pulse * (1 + near * 0.9)
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 6)
        glow.addColorStop(0, `rgba(${p.color},${0.55 + near * 0.35})`)
        glow.addColorStop(0.35, `rgba(${p.color},${0.12 + near * 0.15})`)
        glow.addColorStop(1, `rgba(${p.color},0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(x, y, r * 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.beginPath()
        ctx.arc(x, y, r * 0.55, 0, Math.PI * 2)
        ctx.fill()
      })

      if (hovered) {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(hovered.x, hovered.y, 9, 0, Math.PI * 2)
        ctx.stroke()
        drawLabel(hovered.p.label, hovered.x, hovered.y)
      }

      if (!reduceMotion) frame = requestAnimationFrame(draw)
    }

    host.addEventListener('pointermove', onPointerMove)
    host.addEventListener('pointerleave', onPointerLeave)

    resize()
    const observer = new ResizeObserver(() => {
      resize()
      if (reduceMotion) draw(0)
    })
    observer.observe(canvas.parentElement)
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [points])

  return <canvas ref={canvasRef} className="city-constellation" aria-hidden="true" />
}
