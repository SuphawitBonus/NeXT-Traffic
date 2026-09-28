import { useEffect } from 'react'

export const SPOTLIGHT_SELECTOR =
  '.card, .card-stat, .camera-count, .camera-status-card, .alert-item, .map-layer-toggle, .callout, .water-alert-banner, .accident-insight-banner'

// Feeds the pointer position into --mx/--my on whichever surface is under the cursor,
// so the CSS radial "spotlight" can follow it without per-component handlers.
export default function useCursorSpotlight() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return

    function onMove(e) {
      const el = e.target.closest?.(SPOTLIGHT_SELECTOR)
      if (!el) return
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
      el.style.setProperty('--my', `${e.clientY - rect.top}px`)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])
}
