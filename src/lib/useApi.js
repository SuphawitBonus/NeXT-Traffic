import { useCallback, useEffect, useState } from 'react'

// GET a JSON endpoint on our API server; `offline` means the server isn't running
// (Vite answers with index.html instead of JSON when the proxy target is down).
export function useApi(path) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, status: s.data ? 'refreshing' : 'loading' }))
    fetch(path)
      .then(async (res) => {
        if (!(res.headers.get('content-type') || '').includes('application/json')) {
          throw Object.assign(new Error('เซิร์ฟเวอร์ API ไม่ได้เปิดอยู่ (รัน npm run api)'), { offline: true })
        }
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
        return body
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'ok', data, error: null })
      })
      .catch((err) => {
        if (!cancelled) {
          setState((s) => ({ status: err.offline ? 'offline' : 'error', data: s.data, error: err.message }))
        }
      })
    return () => {
      cancelled = true
    }
  }, [path, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, reload }
}

export function formatThaiDate(value, withTime = false) {
  if (!value) return '–'
  const d = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: withTime ? undefined : 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}
