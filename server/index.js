// Local dev API server for NextTraffic. Keeps the Anthropic credential server-side
// and streams Claude's answers to the browser as server-sent events.
//
// In production these same routes run as Vercel Functions in api/ — both sides
// import the shared logic from server/lib/, so this file is only the dev
// transport (plain node:http + the Vite proxy in vite.config.js).
import http from 'node:http'
import {
  AskError,
  MAX_BODY_BYTES,
  MODEL,
  NO_CREDENTIAL_MESSAGE,
  hasCredential,
  parseAskBody,
  runAsk,
} from './lib/ask.js'
import { checkRateLimit, clientIp, rateLimitMessage } from './lib/ratelimit.js'
import { getWater } from './sources/water.js'
import { getAccidents, getAccidentsOrSnapshot } from './sources/accidents.js'

try {
  process.loadEnvFile('.env')
} catch {
  // no .env file; credentials may come from the environment
}

const PORT = Number(process.env.API_PORT || 8787)
const HOST = '127.0.0.1'

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('คำขอใหญ่เกินไป'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(Object.assign(new Error('รูปแบบข้อมูลไม่ถูกต้อง'), { status: 400 }))
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers })
  res.end(JSON.stringify(body))
}

async function handleAsk(req, res) {
  if (!hasCredential()) return sendJson(res, 503, { error: NO_CREDENTIAL_MESSAGE })

  // Loopback requests are exempt, so this only ever fires behind a proxy
  const limit = checkRateLimit(clientIp(req.headers, req.socket.remoteAddress))
  if (!limit.ok) {
    return sendJson(res, 429, { error: rateLimitMessage(limit.retryAfterSec) }, { 'Retry-After': String(limit.retryAfterSec) })
  }

  let parsed
  try {
    parsed = parseAskBody(await readJson(req))
  } catch (err) {
    const status = err instanceof AskError ? err.status : err.status || 400
    return sendJson(res, status, { error: err.message })
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })

  const abort = new AbortController()
  res.on('close', () => abort.abort())

  try {
    await runAsk(parsed, {
      send: (event) => res.write(`data: ${JSON.stringify(event)}\n\n`),
      signal: abort.signal,
    })
  } finally {
    res.end()
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, model: MODEL, hasCredential: hasCredential() })
  }
  if (req.method === 'POST' && url.pathname === '/api/ask') {
    return handleAsk(req, res)
  }
  if (req.method === 'GET' && (url.pathname === '/api/water' || url.pathname === '/api/accidents')) {
    const get = url.pathname === '/api/water' ? getWater : getAccidentsOrSnapshot
    try {
      return sendJson(res, 200, await get())
    } catch (err) {
      console.error(`[${url.pathname}]`, err?.message)
      return sendJson(res, 502, { error: 'ดึงข้อมูลจากแหล่งข้อมูลภายนอกไม่สำเร็จ ลองใหม่อีกครั้ง' })
    }
  }
  sendJson(res, 404, { error: 'not found' })
})

server.listen(PORT, HOST, () => {
  console.log(`NextTraffic API on http://${HOST}:${PORT} (model ${MODEL}, credential ${hasCredential() ? 'found' : 'MISSING'})`)
  // Warm the caches so the first page view doesn't wait on data.go.th (often 20-30s)
  getWater().catch((err) => console.warn('[warmup] water:', err.message))
  getAccidents().catch((err) => console.warn('[warmup] accidents:', err.message))
})
