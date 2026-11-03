// GET /api/accidents — road-death statistics (RTDDI) from data.go.th
import { getAccidentsOrSnapshot } from '../server/sources/accidents.js'

export async function GET() {
  try {
    const data = await getAccidentsOrSnapshot()
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // data.go.th answers in 20-45s (and sometimes 502s), so let the CDN serve
        // this for 6 hours — the same TTL the in-process cache uses.
        'Cache-Control': 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error('[/api/accidents]', err?.message)
    return new Response(
      JSON.stringify({ error: 'ดึงข้อมูลจากแหล่งข้อมูลภายนอกไม่สำเร็จ ลองใหม่อีกครั้ง' }),
      { status: 502, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } },
    )
  }
}
