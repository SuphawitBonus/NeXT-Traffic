import { fetchJson, cached } from './http.js'

// "ข้อมูลผู้เสียชีวิตจากอุบัติเหตุทางถนน (3 ฐาน)", Department of Disease Control, one CSV resource per Buddhist year
const CKAN = 'https://data.go.th/api/3/action'
const PACKAGE_ID = 'rtddi'
const KNOWN_RESOURCES = {
  2568: '98c51d89-816b-4ce3-8b7f-648d5723e093',
  2569: '580c0ba5-bc98-46fc-bb8d-961b1bde8f76',
}
const PROVINCE = 'กรุงเทพมหานคร'

async function resourceIds() {
  try {
    const pkg = await fetchJson(`${CKAN}/package_show?id=${PACKAGE_ID}`, { attempts: 2 })
    const byYear = {}
    for (const r of pkg.result.resources) {
      const year = Number(r.name?.match(/(25\d\d)\s*$/)?.[1])
      if (year && r.datastore_active) byYear[year] = r.id
    }
    if (Object.keys(byYear).length) return byYear
  } catch {
    // package_show is the flakiest endpoint; fall back to the ids known at build time
  }
  return KNOWN_RESOURCES
}

// Column names differ between yearly files (e.g. 2569 "Dead_Prov" vs 2568 "จ.ที่เสียชีวิต")
const COLUMNS = {
  province: ['Dead_Prov', 'จ.ที่เสียชีวิต'],
  district: ['Acc_District', 'acc_district_name'],
  vehicle: ['Vehicle', 'Vehicle Merge Final'],
  date: ['DeadDate_EN', 'Dead Date Final', 'Dead Date'],
  lat: ['Acc_Lat', 'Acc La'],
  lng: ['Acc_long', 'Acclong'],
  sex: ['Sex'],
  age: ['Age'],
}

function pick(row, field) {
  for (const key of COLUMNS[field]) {
    if (row[key] != null && row[key] !== '') return row[key]
  }
  return null
}

async function search(resourceId, limit) {
  let lastError
  for (const column of COLUMNS.province) {
    const filters = encodeURIComponent(JSON.stringify({ [column]: PROVINCE }))
    try {
      return await fetchJson(`${CKAN}/datastore_search?resource_id=${resourceId}&limit=${limit}&filters=${filters}`, { timeoutMs: 45_000 })
    } catch (err) {
      lastError = err
      if (!err.permanent) throw err
    }
  }
  throw lastError
}

function tally(rows, field, fallback = 'ไม่ระบุ') {
  const counts = {}
  for (const r of rows) {
    const k = String(pick(r, field) ?? '').trim() || fallback
    counts[k] = (counts[k] || 0) + 1
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

async function load() {
  const ids = await resourceIds()
  const years = Object.keys(ids).map(Number).sort((a, b) => b - a)
  const [year, prevYear] = years

  const current = await search(ids[year], 32000)
  const rows = current.result.records
  const dates = rows.map((r) => pick(r, 'date')).filter(Boolean).map(String).sort()
  const ages = rows.map((r) => Number(pick(r, 'age'))).filter((a) => Number.isFinite(a) && a > 0)
  const byMonth = {}
  for (const d of dates) byMonth[d.slice(0, 7)] = (byMonth[d.slice(0, 7)] || 0) + 1

  // The current year's file lags by months, so compare against the same stretch of last year
  let prev = null
  if (prevYear && dates.length) {
    try {
      const prevRows = (await search(ids[prevYear], 32000)).result.records
      const cutoff = dates.at(-1).slice(5, 10)
      prev = {
        total: prevRows.length,
        samePeriod: prevRows.filter((r) => String(pick(r, 'date') ?? '').slice(5, 10) <= cutoff).length,
      }
    } catch {
      prev = null
    }
  }

  return {
    source: 'data.go.th · กรมควบคุมโรค (ระบบบูรณาการข้อมูลการตายจากอุบัติเหตุทางถนน 3 ฐาน)',
    fetchedAt: new Date().toISOString(),
    province: PROVINCE,
    year,
    prevYear: prevYear ?? null,
    prevYearTotal: prev?.total ?? null,
    prevYearSamePeriod: prev?.samePeriod ?? null,
    total: current.result.total,
    dataFrom: dates[0] ?? null,
    dataThrough: dates.at(-1) ?? null,
    byDistrict: tally(rows, 'district')
      .filter((d) => d.name !== 'ไม่ระบุ')
      .map((d) => ({ ...d, name: d.name.replace(/^เขต/, '') })),
    byVehicle: tally(rows, 'vehicle'),
    bySex: tally(rows, 'sex'),
    byMonth: Object.entries(byMonth).map(([month, count]) => ({ month, count })),
    medianAge: ages.length ? ages.sort((a, b) => a - b)[Math.floor(ages.length / 2)] : null,
    points: rows
      .filter((r) => pick(r, 'lat') && pick(r, 'lng'))
      .map((r) => ({ lat: Number(pick(r, 'lat')), lng: Number(pick(r, 'lng')), vehicle: pick(r, 'vehicle'), date: pick(r, 'date') })),
  }
}

export const getAccidents = cached(6 * 60 * 60_000, load)
