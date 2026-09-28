import { useState } from 'react'
import { RefreshCw, AlertTriangle, BarChart3, Circle } from 'lucide-react'
import { ACCIDENT_STATS, DISTRICT_ACCIDENTS } from '../data/mockData'
import './AccidentsRisk.css'

const ACCIDENT_TABS = [
  { key: 'overview', label: 'อุบัติเหตุและมาตรการ', icon: AlertTriangle },
  { key: 'risk-ai', label: 'จุดเสี่ยง กทม. (AI)', icon: BarChart3 },
]

export default function AccidentsRisk() {
  const [activeTab, setActiveTab] = useState('overview')

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
          <h1>อุบัติเหตุและจุดเสี่ยง</h1>
          <p>อุบัติเหตุ มาตรการลดอุบัติเหตุรายจุด และจุดเสี่ยงจราจร กทม. ที่ AI วิเคราะห์</p>
        </div>
      </div>

      <div className="page-body p-xl">
        {/* Tabs */}
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
            {/* Last Update */}
            <div className="flex items-center gap-md mb-base">
              <span className="text-sm text-secondary">อัปเดต {now}</span>
              <button className="btn btn-outline btn-sm">
                <RefreshCw size={12} />
                รีเฟรช
              </button>
            </div>

            {/* Stat Cards */}
            <div className="accident-stats-grid">
              <div className="card-stat animate-fadeInUp">
                <span className="stat-title">เสียชีวิตวันนี้</span>
                <span className="stat-value" style={{ color: 'var(--accent-red)' }}>
                  {ACCIDENT_STATS.deathsToday}
                </span>
                <span className="text-xs text-muted">บาดเจ็บ {ACCIDENT_STATS.injuredToday} ราย</span>
              </div>

              <div className="card-stat animate-fadeInUp" style={{ animationDelay: '80ms' }}>
                <span className="stat-title">เสียชีวิตสะสมปี 2569</span>
                <span className="stat-value" style={{ color: 'var(--accent-red)' }}>
                  {ACCIDENT_STATS.deathsYTD}
                </span>
                <span className="text-xs text-muted">
                  บาดเจ็บ {ACCIDENT_STATS.injuredYTD.toLocaleString()} ราย
                </span>
              </div>

              <div className="card-stat animate-fadeInUp" style={{ animationDelay: '160ms' }}>
                <span className="stat-title">จุดเกิดเหตุกระจุกตัว</span>
                <span className="stat-value" style={{ color: 'var(--accent-orange)' }}>
                  {ACCIDENT_STATS.hotspots}
                </span>
                <span className="text-xs text-muted">จากพิกัดอุบัติเหตุ 241,903 จุด</span>
              </div>

              <div className="card-stat animate-fadeInUp" style={{ animationDelay: '240ms' }}>
                <span className="stat-title">เขตเสี่ยงสูงสุด</span>
                <span className="stat-value font-display" style={{ color: 'var(--text-primary)' }}>
                  {ACCIDENT_STATS.highRiskDistrict}
                </span>
                <span className="text-xs text-muted">เสียชีวิต 35 · บาดเจ็บ 1483</span>
              </div>
            </div>

            {/* AI Insight Banner */}
            <div className="accident-insight-banner mt-base animate-fadeInUp" style={{ animationDelay: '320ms' }}>
              <span className="badge badge-yellow">มาตรการทั่วเมือง</span>
              <span>
                ผู้เสียชีวิตช่วง 18:00-06:00 คิดเป็น 53% - เพิ่มไฟส่องสว่างและด่านตรวจแอลกอฮอล์กลางคืนที่จุดเสี่ยง
                · รถจักรยานยนต์ 91.87% ของผู้เสียชีวิต - บังคับใช้หมวกกันน็อกและช่องทางเฉพาะจักรยานยนต์บนถนนสายหลัก
              </span>
            </div>

            {/* Black Spots and District Table */}
            <div className="accident-content-grid mt-base">
              <div className="card animate-fadeInUp" style={{ animationDelay: '400ms' }}>
                <h3 className="mb-sm">
                  Black Spots และแนวทางลดอุบัติเหตุเฉพาะพื้นที่
                </h3>
                <p className="text-xs text-muted mb-md">
                  จัดกลุ่มพิกัดอุบัติเหตุในรัศมี ~275 ม. · คะแนน = เคส + 3×บาดเจ็บ + 10×เสียชีวิต
                </p>

                <div className="blackspot-list">
                  {[
                    {
                      rank: 1,
                      name: 'แขวงดินแดง เขตดินแดง กรุงเทพมหานคร',
                      urgent: true,
                      mainRoad: true,
                      cases: 936,
                      deaths: 11,
                      injured: 1270,
                      years: '2023/2024/2025/2026',
                      measures: [
                        'ติดกล้องตรวจจับความเร็วและกำหนดช่องทางเฉพาะรถจักรยานยนต์ช่องซ้าย',
                        'เพิ่มไฟส่องสว่างและเส้นจราจรสะท้อนแสงตลอดช่วงที่เกิดเหตุซ้ำ',
                      ],
                    },
                  ].map((spot) => (
                    <div key={spot.rank} className="blackspot-item">
                      <div className="blackspot-rank">{spot.rank}</div>
                      <div className="blackspot-info">
                        <div className="flex items-center gap-sm flex-wrap">
                          <span className="fw-medium">{spot.name}</span>
                          {spot.urgent && <span className="badge badge-red">เร่งด่วน</span>}
                          {spot.mainRoad && <span className="badge badge-blue">ถนนสายหลัก</span>}
                        </div>
                        <div className="text-xs text-muted mt-sm">
                          เขตดินแดง · {spot.cases} เคส · เสียชีวิต {spot.deaths} · บาดเจ็บ {spot.injured.toLocaleString()} · ปี {spot.years}
                        </div>
                        <ul className="blackspot-measures">
                          {spot.measures.map((m, i) => (
                            <li key={i} className="text-sm text-secondary">{m}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* District ranking */}
              <div className="card animate-fadeInUp" style={{ animationDelay: '480ms' }}>
                <h3 className="mb-sm">รายเขต</h3>
                <p className="text-xs text-muted mb-md">เรียงตามผู้เสียชีวิตสะสมปีนี้</p>

                <div className="district-list">
                  {DISTRICT_ACCIDENTS.map((d, i) => (
                    <div key={d.name} className="district-item">
                      <span className="fw-medium">{d.name}</span>
                      <span className="text-sm">
                        <span className="text-red fw-semibold">{d.deaths}</span>
                        <span className="text-muted"> ตาย</span>
                        {' · '}
                        <span>{d.injured.toLocaleString()}</span>
                        <span className="text-muted"> เจ็บ</span>
                      </span>
                    </div>
                  ))}
                </div>
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
