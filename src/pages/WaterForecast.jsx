import { useState } from 'react'
import { RefreshCw, Droplets, MapPin, AlertTriangle, Home, BarChart3, MessageSquare, Circle } from 'lucide-react'
import { WATER_STATIONS, FLOOD_POINTS } from '../data/mockData'
import './WaterForecast.css'

const WATER_TABS = [
  { key: 'situation', label: 'สถานการณ์น้ำ', icon: Droplets },
  { key: 'road-flood', label: 'ถนนน้ำท่วม', icon: MapPin },
  { key: 'watch', label: 'เฝ้าระวังน้ำท่วม', icon: AlertTriangle },
  { key: 'shelter', label: 'จุดพักพิงใกล้ฉัน', icon: Home },
]

const DETAIL_TABS = [
  { key: 'water-level', label: 'ระดับน้ำ' },
  { key: 'road-flood', label: 'น้ำท่วมถนน' },
  { key: 'rain-24h', label: 'ฝน 24 ชม.' },
  { key: 'dam', label: 'เขื่อนและน้ำหนือ' },
]

export default function WaterForecast() {
  const [activeTab, setActiveTab] = useState('situation')
  const [activeDetail, setActiveDetail] = useState('water-level')

  const now = new Date().toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>พยากรณ์น้ำ</h1>
          <p>
            คาดการณ์ระดับน้ำ กรุงเทพฯ และปริมณฑล · อัปเดต {now} · รีเฟรชเองทุก 1 นาที
          </p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-outline">
            <RefreshCw size={14} />
            รีเฟรช
          </button>
        </div>
      </div>

      <div className="page-body p-xl">
        {/* Main Tabs */}
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
              </button>
            )
          })}
        </div>

        {/* Sub tabs for situation */}
        {activeTab === 'situation' && (
          <div className="animate-fadeIn">
            {/* Alert Banner */}
            <div className="water-alert-banner">
              <span className="badge badge-red">เสี่ยงสูง</span>
              <span>
                แม่น้ำ-คลองหลักล้นตลิ่ง {WATER_STATIONS.overflowing} สถานี
                และมีถนนน้ำท่วมขัง {WATER_STATIONS.floodedRoads} จุด
                ริมน้ำและพื้นที่ลุ่มควรเตรียมรับมือ
              </span>
            </div>

            {/* Stat Cards */}
            <div className="water-stats-grid">
              <div className="card-stat animate-fadeInUp">
                <div className="stat-header">
                  <span className="stat-title">สถานีแม่น้ำ-คลองหลักล้นตลิ่ง</span>
                  <span className="badge badge-red">ล้น</span>
                </div>
                <span className="stat-value" style={{ color: 'var(--accent-red)' }}>
                  {WATER_STATIONS.overflowing} / {WATER_STATIONS.total}
                </span>
                <span className="text-xs text-muted">
                  ใกล้ล้นอีก {WATER_STATIONS.nearOverflow} สถานี
                </span>
              </div>

              <div className="card-stat animate-fadeInUp" style={{ animationDelay: '80ms' }}>
                <span className="stat-title">น้ำทะเลหนุนสูงสุดวันนี้</span>
                <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>
                  {WATER_STATIONS.tideLevel}
                </span>
                <span className="text-xs text-muted">
                  {WATER_STATIONS.tideLocation} เวลา {WATER_STATIONS.tideTime}
                </span>
              </div>

              <div className="card-stat animate-fadeInUp" style={{ animationDelay: '160ms' }}>
                <div className="stat-header">
                  <span className="stat-title">ถนน กทม. มีน้ำท่วมขัง</span>
                  <span className="badge badge-red">ท่วม</span>
                </div>
                <span className="stat-value" style={{ color: 'var(--accent-red)' }}>
                  {WATER_STATIONS.floodedRoads} จุด
                </span>
                <span className="text-xs text-muted">
                  จากเซ็นเซอร์ {WATER_STATIONS.totalSensors} จุด
                </span>
              </div>

              <div className="card-stat animate-fadeInUp" style={{ animationDelay: '240ms' }}>
                <div className="stat-header">
                  <span className="stat-title">คลอง กทม. น้ำสูงผิดปกติ</span>
                  <span className="badge badge-red">ล้น</span>
                </div>
                <span className="stat-value" style={{ color: 'var(--accent-orange)' }}>
                  {WATER_STATIONS.canalHigh.count} / {WATER_STATIONS.canalHigh.total}
                </span>
                <span className="text-xs text-muted">
                  ล้น {Math.floor(WATER_STATIONS.canalHigh.count * 0.8)} ใกล้ล้น {Math.floor(WATER_STATIONS.canalHigh.count * 0.5)}
                </span>
              </div>
            </div>

            {/* Detail Tabs and Map */}
            <div className="card mt-base">
              <div className="flex items-center justify-between mb-md">
                <div>
                  <h3>แผนที่จุดวัดและเฝ้าระวัง</h3>
                  <p className="text-xs text-muted mt-xs">
                    ชี้หรือคลิกจุดเพื่อดูรายละเอียด · คลอง: เทียบตลิ่งที่ต่ำกว่า (สนน. กทม.) · แม่น้ำ: เทียบตลิ่ง (สสน.)
                  </p>
                </div>
              </div>

              <div className="tabs mb-md">
                {DETAIL_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    className={`tab-item ${activeDetail === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveDetail(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Flood points list */}
              <div className="water-stations-list">
                {FLOOD_POINTS.map((fp, i) => (
                  <div key={fp.id} className="water-station-item animate-fadeInUp" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className={`water-station-dot ${fp.level === 'ล้น' ? 'dot-red' : fp.level === 'เฝ้าระวัง' ? 'dot-orange' : 'dot-green'}`} />
                    <div className="flex-1">
                      <div className="fw-medium">{fp.name}</div>
                      <div className="text-xs text-muted">ระดับน้ำ: {fp.waterLevel} ม.</div>
                    </div>
                    <span className={`badge ${fp.level === 'ล้น' ? 'badge-red' : fp.level === 'เฝ้าระวัง' ? 'badge-orange' : 'badge-green'}`}>
                      {fp.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'situation' && (
          <div className="animate-fadeIn">
            <div className="card empty-state">
              <Droplets size={40} strokeWidth={1.4} />
              <h3>
                {activeTab === 'road-flood' && 'ถนนน้ำท่วม'}
                {activeTab === 'watch' && 'เฝ้าระวังน้ำท่วม'}
                {activeTab === 'shelter' && 'จุดพักพิงใกล้ฉัน'}
              </h3>
              <p className="text-secondary">กำลังพัฒนา เร็ว ๆ นี้</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
