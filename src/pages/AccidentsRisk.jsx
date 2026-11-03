import { useState } from 'react'
import { RefreshCw, AlertTriangle, BarChart3 } from 'lucide-react'
import { ACCIDENT_STATS, DISTRICT_ACCIDENTS } from '../data/mockData'
import { useApi, formatThaiDate } from '../lib/useApi'
import './AccidentsRisk.css'

const ACCIDENT_TABS = [
  { key: 'overview', label: 'อุบัติเหตุและมาตรการ', icon: AlertTriangle },
  { key: 'risk-ai', label: 'จุดเสี่ยง กทม. (AI)', icon: BarChart3 },
]

const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

const SAMPLE_BLACKSPOT = {
  name: 'แขวงดินแดง เขตดินแดง กรุงเทพมหานคร',
  cases: 936,
  deaths: 11,
  injured: 1270,
  measures: [
    'ติดกล้องตรวจจับความเร็วและกำหนดช่องทางเฉพาะรถจักรยานยนต์ช่องซ้าย',
    'เพิ่มไฟส่องสว่างและเส้นจราจรสะท้อนแสงตลอดช่วงที่เกิดเหตุซ้ำ',
  ],
}

function pct(part, whole) {
  return whole ? Math.round((part / whole) * 100) : 0
}

export default function AccidentsRisk() {
  const [activeTab, setActiveTab] = useState('overview')
  const api = useApi('/api/accidents')
  const d = api.data
  const live = Boolean(d)

  const moto = d?.byVehicle.find((v) => v.name === 'รถจักรยานยนต์')?.count ?? 0
  const unknownVehicle = d?.byVehicle.find((v) => v.name === 'ไม่ระบุพาหนะ')?.count ?? 0
  const male = d?.bySex.find((s) => s.name === 'ชาย')?.count ?? 0
  const change = d?.prevYearSamePeriod ? Math.round(((d.total - d.prevYearSamePeriod) / d.prevYearSamePeriod) * 100) : null
  const topDistrict = d?.byDistrict[0]
  const districts = live ? d.byDistrict.slice(0, 10) : DISTRICT_ACCIDENTS.map((x) => ({ name: x.name, count: x.deaths }))
  const maxDistrict = Math.max(1, ...districts.map((x) => x.count))
  const maxMonth = Math.max(1, ...(d?.byMonth.map((m) => m.count) ?? [1]))
  const periodLabel = d?.dataFrom
    ? `${MONTHS_TH[new Date(d.dataFrom).getMonth()]}–${MONTHS_TH[new Date(d.dataThrough).getMonth()]} ${d.year}`
    : ''

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>อุบัติเหตุและจุดเสี่ยง</h1>
          <p>ผู้เสียชีวิตจากอุบัติเหตุทางถนนในกรุงเทพฯ จากข้อมูลเปิดภาครัฐ และจุดเสี่ยงที่ควรระวัง</p>
        </div>
      </div>

      <div className="page-body p-xl">
        <div className="tabs mb-xl">
          {ACCIDENT_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'overview' && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-md mb-base flex-wrap">
              <span className="text-sm text-secondary">
                {api.status === 'loading'
                  ? 'กำลังดึงข้อมูลจาก data.go.th (ครั้งแรกอาจใช้เวลาราว 30 วินาที)…'
                  : live
                    ? `ข้อมูลถึง ${formatThaiDate(d.dataThrough)}${d.stale ? ' (ใช้ข้อมูลเก่า ดึงใหม่ไม่สำเร็จ)' : ''}`
                    : 'ข้อมูลตัวอย่าง'}
              </span>
              <button className="btn btn-outline btn-sm" onClick={api.reload} disabled={api.status === 'loading' || api.status === 'refreshing'}>
                <RefreshCw size={12} className={api.status === 'refreshing' ? 'spin' : ''} />
                รีเฟรช
              </button>
            </div>

            {!live && api.status !== 'loading' && (
              <div className="callout mb-base">
                <span className="badge badge-yellow">ข้อมูลตัวอย่าง</span>
                <span>ดึงข้อมูลจริงไม่ได้: {api.error} ตอนนี้จึงแสดงข้อมูลตัวอย่างแทน</span>
              </div>
            )}

            <div className="accident-stats-grid">
              {live ? (
                <>
                  <div className="card-stat animate-fadeInUp">
                    <span className="stat-title">ผู้เสียชีวิต กทม. {periodLabel}</span>
                    <span className="stat-value" style={{ color: 'var(--accent-red)' }}>{d.total.toLocaleString()} ราย</span>
                    <span className="text-xs text-muted">
                      {d.prevYearTotal != null ? `ทั้งปี ${d.prevYear}: ${d.prevYearTotal.toLocaleString()} ราย` : 'ข้อมูลรายปีล่าช้าราว 6 เดือน'}
                    </span>
                  </div>
                  <div className="card-stat animate-fadeInUp" style={{ animationDelay: '80ms' }}>
                    <span className="stat-title">เทียบช่วงเดียวกันปี {d.prevYear ?? 'ก่อน'}</span>
                    <span className="stat-value" style={{ color: change > 0 ? 'var(--accent-red)' : change < 0 ? 'var(--accent-green)' : undefined }}>
                      {change == null ? '–' : `${change > 0 ? '+' : ''}${change}%`}
                    </span>
                    <span className="text-xs text-muted">
                      {d.prevYearSamePeriod != null ? `${d.prevYearSamePeriod} → ${d.total} ราย` : 'ไม่มีข้อมูลปีก่อน'}
                    </span>
                  </div>
                  <div className="card-stat animate-fadeInUp" style={{ animationDelay: '160ms' }}>
                    <span className="stat-title">ผู้ใช้รถจักรยานยนต์</span>
                    <span className="stat-value" style={{ color: 'var(--accent-orange)' }}>{pct(moto, d.total)}%</span>
                    <span className="text-xs text-muted">{moto} ราย · อีก {pct(unknownVehicle, d.total)}% ไม่ระบุพาหนะ</span>
                  </div>
                  <div className="card-stat animate-fadeInUp" style={{ animationDelay: '240ms' }}>
                    <span className="stat-title">เขตที่มีผู้เสียชีวิตมากสุด</span>
                    <span className="stat-value">{topDistrict?.name ?? '–'}</span>
                    <span className="text-xs text-muted">{topDistrict ? `${topDistrict.count} ราย` : ''}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="card-stat"><span className="stat-title">เสียชีวิตวันนี้</span><span className="stat-value">{ACCIDENT_STATS.deathsToday}</span><span className="text-xs text-muted">ตัวอย่าง</span></div>
                  <div className="card-stat"><span className="stat-title">เสียชีวิตสะสม</span><span className="stat-value">{ACCIDENT_STATS.deathsYTD}</span><span className="text-xs text-muted">ตัวอย่าง</span></div>
                  <div className="card-stat"><span className="stat-title">จุดเกิดเหตุกระจุกตัว</span><span className="stat-value">{ACCIDENT_STATS.hotspots}</span><span className="text-xs text-muted">ตัวอย่าง</span></div>
                  <div className="card-stat"><span className="stat-title">เขตเสี่ยงสูงสุด</span><span className="stat-value">{ACCIDENT_STATS.highRiskDistrict}</span><span className="text-xs text-muted">ตัวอย่าง</span></div>
                </>
              )}
            </div>

            {live && (
              <div className="accident-insight-banner mt-base animate-fadeInUp" style={{ animationDelay: '320ms' }}>
                <span className="badge badge-yellow">สรุปจากข้อมูล</span>
                <span>
                  ผู้เสียชีวิต {pct(moto, d.total)}% เป็นผู้ใช้รถจักรยานยนต์ · เป็นผู้ชาย {pct(male, d.total)}% · อายุกลาง {d.medianAge ?? '–'} ปี
                  {' '}— มาตรการที่ตรงจุดคือบังคับใช้หมวกกันน็อก ช่องทางเฉพาะจักรยานยนต์ และลดความเร็วในเขตที่เกิดเหตุซ้ำ
                </span>
              </div>
            )}

            <div className="accident-content-grid mt-base">
              <div className="flex flex-col gap-base">
                {live && d.byMonth.length > 0 && (
                  <div className="card animate-fadeInUp">
                    <h3 className="mb-sm">ผู้เสียชีวิตรายเดือน</h3>
                    <p className="text-xs text-muted mb-md">กรุงเทพฯ ปี {d.year} · นับตามวันที่เสียชีวิต</p>
                    <div className="month-bars">
                      {d.byMonth.map((m) => (
                        <div key={m.month} className="month-bar">
                          <span className="month-bar-value">{m.count}</span>
                          <span className="month-bar-fill" style={{ height: `${(m.count / maxMonth) * 100}%` }} />
                          <span className="month-bar-label">{MONTHS_TH[Number(m.month.slice(5, 7)) - 1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="card animate-fadeInUp">
                  <div className="flex items-center gap-sm flex-wrap mb-sm">
                    <h3>Black Spots และแนวทางลดอุบัติเหตุ</h3>
                    <span className="badge badge-yellow">ข้อมูลตัวอย่าง</span>
                  </div>
                  <p className="text-xs text-muted mb-md">
                    ข้อมูลเปิดของกรมควบคุมโรคมีพิกัดเพียงบางราย{live ? ` (${d.points.length} จาก ${d.total} ราย)` : ''} จึงยังจัดกลุ่มจุดเสี่ยงจริงไม่ได้
                  </p>
                  <div className="blackspot-item">
                    <div className="blackspot-rank">1</div>
                    <div className="blackspot-info">
                      <span className="fw-medium">{SAMPLE_BLACKSPOT.name}</span>
                      <div className="text-xs text-muted mt-sm">
                        {SAMPLE_BLACKSPOT.cases} เคส · เสียชีวิต {SAMPLE_BLACKSPOT.deaths} · บาดเจ็บ {SAMPLE_BLACKSPOT.injured.toLocaleString()}
                      </div>
                      <ul className="blackspot-measures">
                        {SAMPLE_BLACKSPOT.measures.map((m) => (
                          <li key={m} className="text-sm text-secondary">{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card animate-fadeInUp">
                <h3 className="mb-sm">รายเขต</h3>
                <p className="text-xs text-muted mb-md">
                  {live ? `เขตที่เกิดเหตุ · ${periodLabel}` : 'ข้อมูลตัวอย่าง'}
                </p>
                <div className="district-list">
                  {districts.map((x) => (
                    <div key={x.name} className="district-item">
                      <span className="district-name">{x.name}</span>
                      <span className="district-bar" aria-hidden="true">
                        <span style={{ width: `${(x.count / maxDistrict) * 100}%` }} />
                      </span>
                      <span className="district-count">{x.count}</span>
                    </div>
                  ))}
                </div>
                {live && <p className="text-xs text-muted mt-md">ที่มา: {d.source}</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risk-ai' && (
          <div className="animate-fadeIn">
            <div className="card empty-state">
              <BarChart3 size={40} strokeWidth={1.4} />
              <h3>จุดเสี่ยง กทม. (AI)</h3>
              <p className="text-secondary">กำลังพัฒนา เร็ว ๆ นี้</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
