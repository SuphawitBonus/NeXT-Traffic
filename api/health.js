// GET /api/health — the "ถาม AI" page checks this before enabling the composer.
import { MODEL, hasCredential } from '../server/lib/ask.js'

export function GET() {
  return new Response(JSON.stringify({ ok: true, model: MODEL, hasCredential: hasCredential() }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
