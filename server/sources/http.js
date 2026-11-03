const UA = 'Mozilla/5.0 (compatible; NextTraffic/1.0; +http://localhost)'

// data.go.th in particular answers 502 intermittently, so 5xx and timeouts are retried
export async function fetchJson(url, { headers = {}, attempts = 3, timeoutMs = 30_000 } = {}) {
  let lastError
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json', ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`)
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`)
        err.permanent = true
        throw err
      }
      return await res.json()
    } catch (err) {
      lastError = err
      if (err.permanent) break
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)))
    }
  }
  throw lastError
}

// Serves the last good value while refreshing, and keeps serving it (marked stale) if a refresh fails
export function cached(ttlMs, load) {
  let value = null
  let fetchedAt = 0
  let inflight = null

  async function get() {
    const fresh = value && Date.now() - fetchedAt < ttlMs
    if (fresh) return { ...value, stale: false }
    inflight ??= load()
      .then((v) => {
        value = v
        fetchedAt = Date.now()
        return v
      })
      .finally(() => {
        inflight = null
      })
    try {
      return { ...(await inflight), stale: false }
    } catch (err) {
      if (value) return { ...value, stale: true }
      throw err
    }
  }

  // Whatever is cached right now, without waiting on a fetch
  get.peek = () => value
  return get
}
