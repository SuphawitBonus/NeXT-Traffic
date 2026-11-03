// GET /api/water — live river/canal levels from ThaiWater (สสน.)
import { getWater } from '../server/sources/water.js'

export async function GET() {
  try {
    const data = await getWater()
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // The in-process cache only helps a warm instance; the CDN keeps cold
        // starts off ThaiWater's API. Matches the 10-minute source TTL.
        'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    console.error('[/api/water]', err?.message)
    return new Response(
      JSON.stringify({ error: 'ดึงข้อมูลจากแหล่งข้อมูลภายนอกไม่สำเร็จ ลองใหม่อีกครั้ง' }),
      { status: 502, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } },
    )
  }
}
