import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Droplets, MapPin, AlertTriangle, Home, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { FLOOD_POINTS } from '../data/mockData'
import { useFloodReports, levelOf, passabilityOf, timeAgo, SEVERITY_COLOR } from '../data/floodReports'
import { useApi, formatThaiDate } from '../lib/useApi'
import './WaterForecast.css'

const WATER_TABS = [
  { key: 'situation', label: 'สถานการณ์น้ำ', icon: Droplets },
  { key: 'road-flood', label: 'ถนนน้ำท่วม', icon: MapPin },
  { key: 'watch', label: 'เฝ้าระวังน้ำท่วม', icon: AlertTriangle },
  { key: 'shelter', label: 'จุดพักพิงใกล้ฉัน', icon: Home },
]

const PROVINCE_FILTERS = [
  { key: 'all', label: 'กทม. และปริมณฑล' },
  { key: 'กรุงเทพมหานคร', label: 'กรุงเทพฯ' },
]

const STATUS = {
  overflow: { label: 'ล้นตลิ่ง', badge: 'badge-red', dot: 'dot-red' },
  watch: { label: 'เฝ้าระวัง', badge: 'badge-orange', dot: 'dot-orange' },
  normal: { label: 'ปกติ', badge: 'badge-green', dot: 'dot-green' },
}

// Shown only when the API server isn't running, and labelled as sample data
const SAMPLE_STATIONS = FLOOD_POINTS.map((p) => {
  const pct = Math.round((p.waterLevel / 2) * 100)
  return {
    id: `sample-${p.id}`,
    name: p.name,
    river: null,
    district: '',
    province: 'กรุงเทพมหานคร',
    pct,
    status: pct >= 100 ? 'overflow' : pct >= 80 ? 'watch' : 'normal',
    trend: null,
    measuredAt: null,
  }
})

function Trend({ value }) {
  if (value == null) return null
  if (value > 0) return <span className="trend trend-up"><ArrowUp size={12} />{value.toFixed(2)}</span>
  if (value < 0) return <span className="trend trend-down"><ArrowDown size={12} />{Math.abs(value).toFixed(2)}</span>
  return <span className="trend"><Minus size={12} />ทรงตัว</span>
}

function StationList({ stations }) {
  if (!stations.length) {
    return <p className="text-sm text-muted p-base">ไม่มีสถานีในเงื่อนไขนี้</p>
  }
  return (
    <div className="water-stations-list">
      {stations.map((s) => (
        <div key={s.id} className="water-station-item">
          <div className={`water-station-dot ${STATUS[s.status].dot}`} />
          <div className="flex-1 station-main">
            <div className="fw-medium">{s.name}</div>
            <div className="text-xs text-muted">
              {[s.river, s.district, s.province].filter(Boolean).join(' · ')}
              {s.measuredAt && ` · วัดเมื่อ ${formatThaiDate(s.measuredAt, true)}`}
            </div>
          </div>
          <div className="station-level">
            <div className="station-bar" aria-hidden="true">
              <span style={{ width: `${Math.min(s.pct, 130) / 1.3}%` }} className={STATUS[s.status].dot} />
              <i className="station-bar-bank" />
            </div>
            <div className="station-pct">
              <strong>{s.pct}%</strong> ของตลิ่ง <Trend value={s.trend} />
            </div>
          </div>
          <span className={`badge ${STATUS[s.status].badge}`}>{STATUS[s.status].label}</span>
        </div>
      ))}
    </div>
  )
}

export default function WaterForecast() {
  const [activeTab, setActiveTab] = useState('situation')
  const [province, setProvince] = useState('all')
  const water = useApi('/api/water')
  const reports = useFloodReports()
  const { reload } = water

  useEffect(() => {
    const timer = setInterval(reload, 10 * 60_000)
    return () => clearInterval(timer)
  }, [reload])

  const live = Boolean(water.data)
  const allStations = live ? water.data.stations : SAMPLE_STATIONS
  const stations = useMemo(
    () => (province === 'all' ? allStations : allStations.filter((s) => s.province === province)),
    [allStations, province],
  )
  const overflow = stations.filter((s) => s.status === 'overflow').length
  const watch = stations.filter((s) => s.status === 'watch').length
  const worst = stations[0]

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>พยากรณ์น้ำ</h1>
          <p>
            ระดับน้ำแม่น้ำและคลอง กรุงเทพฯ และปริมณฑล
            {live
              ? ` · ข้อมูลวัดล่าสุด ${formatThaiDate(water.data.summary.latestMeasurement, true)} · รีเฟรชเองทุก 10 นาที`
              : ''}
          </p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-outline" onClick={reload} disabled={water.status === 'loading' || water.status === 'refreshing'}>
            <RefreshCw size={14} className={water.status === 'refreshing' ? 'spin' : ''} />
            รีเฟรช
          </button>
        </div>
      </div>

      <div className="page-body p-xl">
        <div className="water-tabs">
          {WATER_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                className={`water-tab-item ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={15} strokeWidth={1.6} />
                {tab.label}
                {tab.key === 'road-flood' && reports.length > 0 && <span className="tab-count">{reports.length}</span>}
              </button>
            )
          })}
        </div>

        {!live && water.status !== 'loading' && (
          <div className="callout mb-base">
            <span className="badge badge-yellow">ข้อมูลตัวอย่าง</span>
            <span>ดึงข้อมูลจริงไม่ได้: {water.error} ตอนนี้จึงแสดงข้อมูลตัวอย่างแทน</span>
          </div>
        )}

        {activeTab === 'situation' && (
          <div className="animate-fadeIn">
            {water.status === 'loading' ? (
              <div className="card empty-state"><p className="text-secondary">กำลังโหลดข้อมูลระดับน้ำจาก ThaiWater…</p></div>
            ) : (
              <>
                <div className={`water-alert-banner ${overflow ? '' : 'is-calm'}`}>
                  <span className={`badge ${overflow ? 'badge-red' : 'badge-green'}`}>{overflow ? 'เสี่ยง' : 'ปกติ'}</span>
                  <span>
                    {overflow
                      ? `สถานีวัดน้ำล้นตลิ่ง ${overflow} จาก ${stations.length} สถานี${worst ? ` สูงสุดที่ ${worst.name} (${worst.pct}% ของตลิ่ง)` : ''} ริมน้ำและพื้นที่ลุ่มควรเตรียมรับมือ`
                      : `ระดับน้ำทุกสถานีต่ำกว่าตลิ่ง${watch ? ` มี ${watch} สถานีที่ต้องเฝ้าระวัง` : ''}`}
                  </span>
                </div>

                <div className="water-stats-grid">
                  <div className="card-stat animate-fadeInUp">
                    <div className="stat-header">
                      <span className="stat-title">สถานีล้นตลิ่ง</span>
                      {overflow > 0 && <span className="badge badge-red">ล้น</span>}
                    </div>
                    <span className="stat-value" style={{ color: overflow ? 'var(--accent-red)' : undefined }}>
                      {overflow} / {stations.length}
                    </span>
                    <span className="text-xs text-muted">ใกล้ล้น (80% ขึ้นไป) อีก {watch} สถานี</span>
                  </div>

                  <div className="card-stat animate-fadeInUp" style={{ animationDelay: '80ms' }}>
                    <span className="stat-title">ระดับสูงสุดเทียบตลิ่ง</span>
                    <span className="stat-value">{worst ? `${worst.pct}%` : '–'}</span>
                    <span className="text-xs text-muted">{worst ? worst.name : 'ไม่มีข้อมูล'}</span>
                  </div>

                  <div className="card-stat animate-fadeInUp" style={{ animationDelay: '160ms' }}>
                    <div className="stat-header">
                      <span className="stat-title">รายงานน้ำท่วมจากผู้ใช้</span>
                    </div>
                    <span className="stat-value">{reports.length} จุด</span>
                    <Link to="/report-flood" className="text-xs">แจ้งจุดน้ำท่วม →</Link>
                  </div>

                  <div className="card-stat animate-fadeInUp" style={{ animationDelay: '240ms' }}>
                    <span className="stat-title">ความสดของข้อมูล</span>
                    <span className="stat-value">
                      {live ? formatThaiDate(water.data.summary.latestMeasurement, true).split(' ').slice(-1)[0] : '–'}
                    </span>
                    <span className="text-xs text-muted">
                      {live ? (water.data.stale ? 'ใช้ข้อมูลเก่า (ดึงใหม่ไม่สำเร็จ)' : 'เวลาวัดล่าสุด') : 'ข้อมูลตัวอย่าง'}
                    </span>
                  </div>
                </div>

                <div className="card mt-base">
                  <div className="flex items-center justify-between gap-md mb-md flex-wrap">
                    <div>
                      <h3>สถานีวัดระดับน้ำ</h3>
                      <p className="text-xs text-muted mt-xs">
                        เรียงจากน้ำสูงสุด · % คือระดับน้ำเทียบตลิ่ง (100% = ถึงตลิ่ง)
                        {live && ` · ที่มา: ${water.data.source}`}
                      </p>
                    </div>
                    <div className="tabs">
                      {PROVINCE_FILTERS.map((p) => (
                        <button
                          key={p.key}
                          className={`tab-item ${province === p.key ? 'active' : ''}`}
                          onClick={() => setProvince(p.key)}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <StationList stations={stations} />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'watch' && (
          <div className="animate-fadeIn card">
            <h3 className="mb-sm">สถานีที่ต้องเฝ้าระวัง</h3>
            <p className="text-xs text-muted mb-md">ระดับน้ำตั้งแต่ 80% ของตลิ่งขึ้นไป ในกรุงเทพฯ และปริมณฑล</p>
            <StationList stations={allStations.filter((s) => s.status !== 'normal')} />
          </div>
        )}

        {activeTab === 'road-flood' && (
          <div className="animate-fadeIn card">
            <div className="flex items-center justify-between gap-md mb-md flex-wrap">
              <div>
                <h3>ถนนน้ำท่วมจากรายงานผู้ใช้</h3>
                <p className="text-xs text-muted mt-xs">รายงานที่แจ้งผ่านหน้า "แจ้งน้ำท่วม" · เก็บไว้ในเบราว์เซอร์นี้</p>
              </div>
              <Link to="/report-flood" className="btn btn-outline btn-sm">แจ้งจุดน้ำท่วม</Link>
            </div>
            {reports.length === 0 ? (
              <p className="text-sm text-muted">ยังไม่มีรายงาน</p>
            ) : (
              <div className="water-stations-list">
                {reports.map((r) => {
                  const level = levelOf(r.level)
                  return (
                    <div key={r.id} className="water-station-item">
                      <div className="water-station-dot" style={{ background: SEVERITY_COLOR[level.severity] }} />
                      <div className="flex-1 station-main">
                        <div className="fw-medium">{r.place}</div>
                        <div className="text-xs text-muted">{passabilityOf(r.passable).label} · {timeAgo(r.createdAt)}</div>
                      </div>
                      <span className="badge badge-neutral">น้ำ{level.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'shelter' && (
          <div className="animate-fadeIn">
            <div className="card empty-state">
              <Home size={40} strokeWidth={1.4} />
              <h3>จุดพักพิงใกล้ฉัน</h3>
              <p className="text-secondary">ยังไม่ได้เชื่อมแหล่งข้อมูลจุดพักพิง</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
