import { fetchJson, cached } from './http.js'

const URL = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load'
const PROVINCES = new Set(['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'นครปฐม'])

function statusOf(pct) {
  if (pct >= 100) return 'overflow'
  if (pct >= 80) return 'watch'
  return 'normal'
}

async function load() {
  const data = await fetchJson(URL, { headers: { Referer: 'https://www.thaiwater.net/' } })
  const rows = data?.waterlevel_data?.data
  if (!Array.isArray(rows)) throw new Error('unexpected ThaiWater response shape')

  const stations = rows
    .filter((r) => PROVINCES.has(r.geocode?.province_name?.th) && r.storage_percent != null)
    .map((r) => {
      const pct = Number(r.storage_percent)
      const level = Number(r.waterlevel_msl)
      const prev = Number(r.waterlevel_msl_previous)
      return {
        id: r.station?.id,
        name: r.station?.tele_station_name?.th,
        river: r.river_name || null,
        district: r.geocode?.amphoe_name?.th,
        province: r.geocode?.province_name?.th,
        lat: r.station?.tele_station_lat,
        lng: r.station?.tele_station_long,
        levelMsl: Number.isFinite(level) ? level : null,
        trend: Number.isFinite(level) && Number.isFinite(prev) ? Math.round((level - prev) * 100) / 100 : null,
        bankMsl: r.station?.min_bank ?? null,
        pct: Math.round(pct * 10) / 10,
        status: statusOf(pct),
        measuredAt: r.waterlevel_datetime,
        agency: r.agency?.agency_shortname?.th,
      }
    })
    .filter((s) => s.name && Number.isFinite(s.pct))
    .sort((a, b) => b.pct - a.pct)

  const bangkok = stations.filter((s) => s.province === 'กรุงเทพมหานคร')
  return {
    source: 'ThaiWater (สสน.) · api-v3.thaiwater.net',
    fetchedAt: new Date().toISOString(),
    summary: {
      total: stations.length,
      overflow: stations.filter((s) => s.status === 'overflow').length,
      watch: stations.filter((s) => s.status === 'watch').length,
      bangkokTotal: bangkok.length,
      bangkokOverflow: bangkok.filter((s) => s.status === 'overflow').length,
      latestMeasurement: stations.map((s) => s.measuredAt).sort().at(-1) ?? null,
    },
    stations,
  }
}

export const getWater = cached(10 * 60_000, load)
