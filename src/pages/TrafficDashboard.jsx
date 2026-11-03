import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  RefreshCw,
  ArrowUpRight,
  ArrowRight,
  Car,
  CloudRain,
  Droplets,
  Home,
  Wind,
  AlertTriangle,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import CityConstellation from '../components/CityConstellation'
import { useTheme } from '../lib/theme'
import {
  TRAFFIC_SCORE,
  DASHBOARD_STATS,
  TRAFFIC_HOURLY,
  ONLINE_USERS,
  CCTV_CAMERAS,
  RAIL_STATIONS,
  FLOOD_POINTS,
  ROAD_DATA,
} from '../data/mockData'
import './TrafficDashboard.css'

const TABS = [
  { key: 'overview', label: 'ภาพรวมจราจร' },
  { key: 'by-road', label: 'วิเคราะห์รายถนน' },
  { key: 'incidents', label: 'เหตุการณ์สด', count: 4 },
  { key: 'reports', label: 'รายงานสดจากศูนย์' },
]

const STAT_ICONS = {
  traffic: Car,
  weather: CloudRain,
  water: Droplets,
  'flood-reports': Home,
  pm25: Wind,
  accidents: AlertTriangle,
}

const LEVEL_RGB = {
  heavy: '255,157,140',
  moderate: '255,201,143',
  light: '159,230,184',
}

// Recharts takes colours as SVG attributes, so they can't follow CSS variables
const CHART_COLORS = {
  dark: { line: '#b9d7ff', grid: 'rgba(255,255,255,0.05)', tick: '#7a7a73', cursor: 'rgba(255,255,255,0.15)', dot: '#f8f8f5', dotRing: '#141413' },
  light: { line: '#2f6fdc', grid: 'rgba(20,20,19,0.06)', tick: '#85857d', cursor: 'rgba(20,20,19,0.15)', dot: '#1a1a19', dotRing: '#ffffff' },
}

const LEVEL_TEXT = { heavy: 'ติดขัด', moderate: 'ปานกลาง', light: 'คล่องตัว' }

const HERO_POINTS = [
  ...CCTV_CAMERAS.map((c) => ({
    lat: c.lat,
    lng: c.lng,
    color: LEVEL_RGB[c.trafficLevel],
    size: 3,
    label: `${c.name} · ${LEVEL_TEXT[c.trafficLevel]}`,
  })),
  ...RAIL_STATIONS.map((s) => ({ lat: s.lat, lng: s.lng, color: '185,215,255', size: 2.2, label: `${s.line} ${s.name}` })),
  ...FLOOD_POINTS.map((f) => ({ lat: f.lat, lng: f.lng, color: '169,255,245', size: 2, label: `${f.name} · ${f.level}` })),
]

const INCIDENTS = [
  {
    type: 'อุบัติเหตุ',
    location: 'ถ.สุขุมวิท ซ.33 ขาเข้า',
    time: '5 นาทีก่อน',
    severity: 'danger',
    desc: 'รถชน 2 คัน กีดขวาง 1 ช่องจราจร ตำรวจกำลังจัดการ',
  },
  {
    type: 'รถเสีย',
    location: 'ทางด่วนศรีรัช ขาออก กม.12',
    time: '15 นาทีก่อน',
    severity: 'warning',
    desc: 'รถบรรทุกจอดเสียไหล่ทาง กระทบ 1 ช่องจราจร',
  },
  {
    type: 'น้ำท่วม',
    location: 'ถ.พหลโยธิน แยกเกษตร',
    time: '30 นาทีก่อน',
    severity: 'danger',
    desc: 'น้ำท่วมขังสูง 20 ซม. หลังฝนตกหนัก รถผ่านได้ช้า',
  },
  {
    type: 'ก่อสร้าง',
    location: 'ถ.เพชรบุรีตัดใหม่',
    time: '2 ชม.ก่อน',
    severity: 'info',
    desc: 'ปิดช่องจราจร 2 ช่อง สำหรับงานก่อสร้างรถไฟฟ้า',
  },
]

const REPORTS = [
  { time: '00:15', text: 'สภาพจราจรทั่วกรุงเทพฯ คล่องตัวดี ยกเว้นถนนสุขุมวิทขาเข้ามีอุบัติเหตุเล็กน้อย' },
  { time: '23:45', text: 'ฝนตกหนักบริเวณเขตจตุจักร-บางซื่อ น้ำท่วมขังบางจุด ระวังเส้นทาง' },
  { time: '23:00', text: 'ทางด่วนศรีรัชขาออก มีรถบรรทุกจอดเสียไหล่ทาง ไม่กีดขวาง' },
  { time: '22:30', text: 'ปิดการจราจรชั่วคราว ถ.ราชดำเนิน สำหรับกิจกรรมพิเศษ เปิดใช้ปกติ 05:00 น.' },
]

function getTrafficColor(score) {
  if (score >= 70) return 'var(--accent-green)'
  if (score >= 40) return 'var(--accent-orange)'
  return 'var(--accent-red)'
}

function getStatusColor(status) {
  switch (status) {
    case 'ok': return 'var(--accent-green)'
    case 'warning': return 'var(--accent-orange)'
    case 'danger': return 'var(--accent-red)'
    default: return 'var(--text-muted)'
  }
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        <p className="chart-tooltip-value">
          ดัชนี <strong style={{ color: getTrafficColor(payload[0].value) }}>
            {payload[0].value}
          </strong>/100
        </p>
      </div>
    )
  }
  return null
}

export default function TrafficDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  const now = new Date().toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }

  const chartData = useMemo(() => TRAFFIC_HOURLY, [])
  const { theme } = useTheme()
  const chart = CHART_COLORS[theme]

  return (
    <>
      <section className="dash-hero theme-dark">
        <CityConstellation points={HERO_POINTS} />
        <div className="dash-hero-content">
          <div className="dash-hero-meta animate-fadeIn">
            <span className="badge badge-live">สด · {now}</span>
            <span className="text-sm text-muted">ผู้ใช้ออนไลน์ {ONLINE_USERS} คน</span>
          </div>
          <h1 className="dash-hero-title animate-fadeInUp">
            กรุงเทพฯ ตอนนี้
            <br />
            การจราจร<span className="text-gradient">{TRAFFIC_SCORE.label}</span>
          </h1>
          <p className="dash-hero-desc animate-fadeInUp" style={{ animationDelay: '120ms' }}>
            {TRAFFIC_SCORE.description} ดัชนีการระบายรถทั้งเมือง{' '}
            <strong>{TRAFFIC_SCORE.score}</strong>/{TRAFFIC_SCORE.max} ถนนสีแดง {TRAFFIC_SCORE.redPercent}%
          </p>
          <div className="dash-hero-actions animate-fadeInUp" style={{ animationDelay: '220ms' }}>
            <Link to="/map" className="btn btn-primary">
              เปิดแผนที่จราจร
              <ArrowRight size={16} />
            </Link>
            <Link to="/camera-ai" className="btn btn-outline">
              ดูกล้องสด
            </Link>
            <button className="btn btn-ghost" onClick={handleRefresh}>
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              รีเฟรช
            </button>
          </div>
        </div>
        <div className="dash-hero-legend">
          <span><i style={{ background: 'var(--accent-red)' }} />ติดขัด</span>
          <span><i style={{ background: 'var(--accent-orange)' }} />ปานกลาง</span>
          <span><i style={{ background: 'var(--accent-green)' }} />คล่องตัว</span>
          <span><i style={{ background: 'var(--accent-blue)' }} />สถานีรถไฟฟ้า</span>
        </div>
      </section>

      <div className="page-body p-xl">
        <div className="section-eyebrow">ภาพรวมเมือง</div>
        <div className="dashboard-stats-grid">
          {DASHBOARD_STATS.map((stat, idx) => {
            const Icon = STAT_ICONS[stat.id] || Car
            const content = (
              <>
                <div className="stat-header">
                  <div className="stat-icon">
                    <Icon size={16} strokeWidth={1.6} />
                  </div>
                  <div className="stat-status" style={{ color: getStatusColor(stat.status) }} />
                  {stat.detailPath && (
                    <span className="stat-detail-link">
                      <ArrowUpRight size={16} />
                    </span>
                  )}
                </div>
                <span className="stat-title">{stat.title}</span>
                <span className="stat-value">{stat.value}</span>
              </>
            )
            return stat.detailPath ? (
              <Link
                key={stat.id}
                to={stat.detailPath}
                className="card-stat stat-link animate-fadeInUp"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {content}
              </Link>
            ) : (
              <div
                key={stat.id}
                className="card-stat animate-fadeInUp"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {content}
              </div>
            )
          })}
        </div>

        <div className="dash-tabs-row">
          <div className="tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.count != null && <span className="tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="animate-fadeIn dash-overview">
            <div className="card">
              <div className="flex items-center justify-between gap-md flex-wrap">
                <h3>ภาพรวมการจราจรจากกล้อง CCTV กทม.</h3>
                <span className="text-xs text-muted">อัปเดต {now}</span>
              </div>

              <div className="traffic-gauge">
                <div className="gauge-score">
                  <span className="score-value">{TRAFFIC_SCORE.score}</span>
                  <span className="score-max">/ {TRAFFIC_SCORE.max}</span>
                </div>

                <div className="gauge-bar-container">
                  <div className="text-xs text-secondary">ดัชนีการระบายรถ</div>
                  <div className="gauge-bar">
                    <div className="gauge-indicator" style={{ left: `${TRAFFIC_SCORE.score}%` }} />
                  </div>
                  <div className="gauge-labels">
                    <span>หนาแน่น</span>
                    <span>ปานกลาง</span>
                    <span>คล่องตัว</span>
                  </div>
                </div>

                <div className="gauge-result">
                  <div className="result-label" style={{ color: getTrafficColor(TRAFFIC_SCORE.score) }}>
                    {TRAFFIC_SCORE.label}
                  </div>
                  <div className="result-desc">{TRAFFIC_SCORE.description}</div>
                  <div
                    className="result-change"
                    style={{
                      color: TRAFFIC_SCORE.changeDirection === 'up'
                        ? 'var(--accent-green)'
                        : 'var(--accent-red)',
                    }}
                  >
                    {TRAFFIC_SCORE.changeDirection === 'up' ? '↑' : '↓'} ดีขึ้น {TRAFFIC_SCORE.changeFromLastHour}
                  </div>
                </div>
              </div>

              <p className="traffic-note">
                ไม่มีข้อมูลความเร็วจริง จัดระดับจากสีเส้นจราจร Longdo (แดง/เหลือง/เขียว) แทนช่วงความเร็ว
              </p>
            </div>

            <div className="card">
              <h3 className="mb-md">ดัชนีการระบายรถรายชั่วโมง</h3>
              <p className="text-sm text-muted mb-md">ย้อนหลัง 24 ชั่วโมง · ยิ่งสูงยิ่งคล่องตัว</p>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chart.line} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={chart.line} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={chart.grid} vertical={false} />
                    <XAxis
                      dataKey="hour"
                      tick={{ fill: chart.tick, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: chart.tick, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: chart.cursor }} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke={chart.line}
                      strokeWidth={1.75}
                      fill="url(#trafficGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: chart.dot, stroke: chart.dotRing, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'by-road' && (
          <div className="animate-fadeIn">
            <div className="card">
              <h3 className="mb-md">วิเคราะห์สภาพจราจรรายถนน</h3>
              <div className="road-table">
                <div className="road-table-header">
                  <span>ถนน</span>
                  <span>ดัชนี</span>
                  <span>สถานะ</span>
                  <span>ยานพาหนะ/ชม.</span>
                  <span>ระดับ</span>
                </div>
                {ROAD_DATA.map((road) => (
                  <div key={road.name} className="road-table-row">
                    <span className="fw-medium">{road.name}</span>
                    <span className="font-mono">{road.score}</span>
                    <span>
                      <span className={`badge ${road.score >= 60 ? 'badge-green' : road.score >= 40 ? 'badge-orange' : 'badge-red'}`}>
                        {road.status}
                      </span>
                    </span>
                    <span className="font-mono text-secondary">{road.vehicles.toLocaleString()}</span>
                    <span className="road-mini-bar">
                      <span
                        className="road-mini-bar-fill"
                        style={{ width: `${road.score}%`, background: getTrafficColor(road.score) }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="animate-fadeIn incidents-grid">
            {INCIDENTS.map((incident, i) => (
              <div
                key={i}
                className="card incident-card animate-fadeInUp"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center justify-between mb-md">
                  <span className={`badge badge-${incident.severity === 'danger' ? 'red' : incident.severity === 'warning' ? 'orange' : 'blue'}`}>
                    {incident.type}
                  </span>
                  <span className="text-xs text-muted">{incident.time}</span>
                </div>
                <p className="incident-location">{incident.location}</p>
                <p className="text-sm text-secondary">{incident.desc}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-fadeIn">
            <div className="card">
              <h3 className="mb-md">รายงานสดจากศูนย์ควบคุมจราจร กทม.</h3>
              <ol className="reports-list">
                {REPORTS.map((report, i) => (
                  <li key={i} className="report-item animate-fadeInUp" style={{ animationDelay: `${i * 60}ms` }}>
                    <span className="report-time font-mono">{report.time}</span>
                    <span className="report-text">{report.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
