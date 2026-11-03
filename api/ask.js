// POST /api/ask — streams Claude's answer as server-sent events.
// Vercel Function (Web Handler, Node.js runtime). The same logic runs locally
// through server/index.js, so dev and production answer identically.
import {
  AskError,
  MAX_BODY_BYTES,
  NO_CREDENTIAL_MESSAGE,
  hasCredential,
  parseAskBody,
  runAsk,
} from '../server/lib/ask.js'
import { checkRateLimit, clientIp, rateLimitMessage } from '../server/lib/ratelimit.js'

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export async function POST(request) {
  // Without a key, say so plainly instead of letting the SDK throw a 500
  if (!hasCredential()) return json(503, { error: NO_CREDENTIAL_MESSAGE })

  const limit = checkRateLimit(clientIp(request.headers))
  if (!limit.ok) {
    return new Response(JSON.stringify({ error: rateLimitMessage(limit.retryAfterSec) }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': String(limit.retryAfterSec),
      },
    })
  }

  let parsed
  try {
    const raw = await request.text()
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return json(413, { error: 'คำขอใหญ่เกินไป' })
    parsed = parseAskBody(JSON.parse(raw))
  } catch (err) {
    if (err instanceof AskError) return json(err.status, { error: err.message })
    return json(400, { error: 'รูปแบบข้อมูลไม่ถูกต้อง' })
  }

  // Stops the Claude request when the browser aborts (the stop button) so an
  // abandoned answer isn't billed to the end.
  const abort = new AbortController()
  request.signal?.addEventListener('abort', () => abort.abort())

  const encoder = new TextEncoder()
  const body = new ReadableStream({
    async start(controller) {
      const send = (event) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          // client already gone
        }
      }
      try {
        await runAsk(parsed, { send, signal: abort.signal })
      } finally {
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      abort.abort()
    },
  })

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
