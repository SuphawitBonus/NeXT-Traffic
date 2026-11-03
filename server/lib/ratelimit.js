// Fixed-window per-IP limiter, kept in process memory.
//
// Serverless caveat: on Vercel this counter lives inside one function instance.
// Vercel runs several instances in parallel (and recycles them), so the real
// ceiling is roughly LIMIT x number of live instances, and a brand new instance
// starts every visitor back at zero. It is a cheap guard against one person
// holding down Enter, not a hard spend cap. For a real limit, move the counter
// to a shared store (Upstash Redis / Vercel KV @upstash/ratelimit) — see README.
const WINDOW_MS = 10 * 60_000
const LIMIT = 10

const hits = new Map() // ip -> { count, resetAt }

function loopback(ip) {
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
}

// Vercel's proxy sets x-vercel-forwarded-for / x-real-ip itself, so prefer those
// over the client-controllable end of x-forwarded-for.
export function clientIp(headers, fallback = 'unknown') {
  const get = (name) => (typeof headers?.get === 'function' ? headers.get(name) : headers?.[name])
  const forwarded = get('x-forwarded-for')
  return (
    get('x-vercel-forwarded-for') ||
    get('x-real-ip') ||
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') ||
    fallback
  )
}

// Returns { ok: true } or { ok: false, retryAfterSec }
export function checkRateLimit(ip, { limit = LIMIT, windowMs = WINDOW_MS } = {}) {
  if (!ip || loopback(ip)) return { ok: true } // local development
  const now = Date.now()

  // Opportunistic cleanup; the map only ever holds IPs seen in the last window
  if (hits.size > 5_000) {
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key)
  }

  const entry = hits.get(ip)
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) }
  }
  entry.count += 1
  return { ok: true }
}

export function rateLimitMessage(retryAfterSec) {
  const minutes = Math.ceil(retryAfterSec / 60)
  return `ถามถี่เกินไป (จำกัด ${LIMIT} คำถามต่อ ${WINDOW_MS / 60_000} นาที) ลองใหม่ในอีกประมาณ ${minutes} นาที`
}

export const RATE_LIMIT = { limit: LIMIT, windowMs: WINDOW_MS }
