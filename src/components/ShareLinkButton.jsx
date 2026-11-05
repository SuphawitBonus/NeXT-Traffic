import { useEffect, useRef, useState } from 'react'
import { Link2, Check } from 'lucide-react'

// Copies a link to the clipboard. Phones get the native share sheet instead,
// which is how people actually move a view from one device to another.
export default function ShareLinkButton({ getUrl, title, label = 'คัดลอกลิงก์', className = 'btn btn-outline btn-sm' }) {
  const [state, setState] = useState('idle') // idle | copied | failed
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  function flash(next) {
    setState(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2200)
  }

  async function handleClick() {
    const url = getUrl()
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    if (coarse && navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch (err) {
        if (err?.name === 'AbortError') return
        // fall through to copying
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      flash('copied')
    } catch {
      flash('failed')
    }
  }

  return (
    <button type="button" className={className} onClick={handleClick} aria-live="polite">
      {state === 'copied' ? <Check size={14} /> : <Link2 size={14} />}
      {state === 'copied' ? 'คัดลอกแล้ว' : state === 'failed' ? 'คัดลอกไม่สำเร็จ' : label}
    </button>
  )
}
