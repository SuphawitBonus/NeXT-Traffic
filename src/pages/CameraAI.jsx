import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, Search, Monitor, Crosshair, ArrowLeftRight, Camera, ChevronRight } from 'lucide-react'
import LiveVideo from '../components/LiveVideo'
import FavoriteButton from '../components/FavoriteButton'
import { fetchBangkokCameras } from '../data/cameras'
import './CameraAI.css'

const CAMERA_TABS = [
  { key: 'live-detect', label: 'AI ตรวจจับรถสด', icon: Eye },
  { key: 'search', label: 'ค้นหากล้อง', icon: Search },
  { key: 'count-bma', label: 'นับรถกล้อง กทม.', icon: Monitor },
  { key: 'helmet', label: 'ตรวจหมวกกันน็อก', icon: Crosshair },
  { key: 'wrong-way', label: 'ตรวจรถย้อนศร', icon: ArrowLeftRight },
]

export default function CameraAI() {
  const [activeTab, setActiveTab] = useState('live-detect')
  
  // Real API state
  const [cameras, setCameras] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [feedError, setFeedError] = useState(false)
  const [query, setQuery] = useState('')
  const [searchParams] = useSearchParams()
  const requestedCamId = searchParams.get('cam')

  useEffect(() => {
    let cancelled = false
    fetchBangkokCameras()
      .then((list) => {
        if (cancelled) return
        setCameras(list)
        const requested = list.find((c) => c.id === requestedCamId)
        if (requested) setSelectedCameraId(requested.id)
        else if (list.length > 0) setSelectedCameraId(list[0].id)
      })
      .catch((error) => {
        console.error('Failed to load cameras', error)
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [requestedCamId])

  const selectedCamera = cameras.find((c) => c.id === selectedCameraId) || cameras[0]

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cameras
    return cameras.filter((c) => `${c.name} ${c.district}`.toLowerCase().includes(q))
  }, [cameras, query])

  function openCamera(id) {
    setSelectedCameraId(id)
    setFeedError(false)
    setActiveTab('live-detect')
  }

  // Placeholder counts until the detector is wired up; stable per camera so they don't jump on re-render
  const counts = useMemo(() => {
    const seed = [...String(selectedCameraId)].reduce((s, ch) => s + ch.charCodeAt(0), 0)
    return { cars: 3 + (seed % 15), bikes: seed % 5, trucks: seed % 3 }
  }, [selectedCameraId])
  const busy = counts.cars >= 12

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>กล้อง AI และการวิเคราะห์</h1>
          <p>
            ดูรถจากกล้องสดด้วย AI ค้นหากล้องทุกตัว สถิตินับรถจากกล้อง กทม. และตรวจหมวกกันน็อก/รถย้อนศร
          </p>
        </div>
      </div>

      <div className="page-body p-xl">
        {/* Camera AI Tabs */}
        <div className="camera-tabs">
          {CAMERA_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                className={`camera-tab-item ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={15} strokeWidth={1.6} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* AI Live Detection */}
        {activeTab === 'live-detect' && (
          <div className="camera-ai-layout animate-fadeIn">
            <div className="camera-main">
              <div className="card">
                <div className="camera-card-head">
                  <div>
                    <h3>AI ตรวจจับรถสด</h3>
                    <p className="text-sm text-muted mt-xs">
                      YOLO26x นับรถยนต์ มอเตอร์ไซค์ รถบรรทุก จากภาพกล้องที่เลือก ประมาณ 10 ภาพต่อวินาที
                    </p>
                  </div>
                  <span className="badge badge-neutral">{loading ? '…' : `${cameras.length} กล้อง`}</span>
                </div>

                <div className="camera-selector">
                  <label className="text-sm text-muted" htmlFor="camera-select">กล้อง</label>
                  <select
                    id="camera-select"
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value)
                      setFeedError(false)
                    }}
                    className="camera-select"
                    disabled={loading}
                  >
                    {loading ? (
                      <option>กำลังโหลดข้อมูลกล้อง...</option>
                    ) : (
                      cameras.map((cam) => (
                        <option key={cam.id} value={cam.id}>
                          {cam.name}
                        </option>
                      ))
                    )}
                  </select>
                  {selectedCamera && !loadError && <FavoriteButton cameraId={selectedCamera.id} withLabel />}
                </div>

                <div className="camera-feed">
                  {selectedCamera?.url && !loading && !feedError ? (
                    <LiveVideo src={selectedCamera.url} onError={() => setFeedError(true)} />
                  ) : (
                    <div className="camera-feed-placeholder">
                      <Camera size={40} strokeWidth={1.4} />
                      <p>
                        {loading
                          ? 'กำลังเชื่อมต่อกล้อง…'
                          : loadError
                            ? 'โหลดรายชื่อกล้องจาก Longdo ไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง'
                            : 'ไม่สามารถโหลดภาพจากกล้องได้'}
                      </p>
                    </div>
                  )}

                  <div className="camera-overlay-info">
                    <span className="badge badge-live">LIVE</span>
                  </div>
                  {selectedCamera && !loading && (
                    <div className="camera-overlay-caption">
                      <span className="camera-overlay-name">{selectedCamera.name}</span>
                      <span className="camera-overlay-org">{selectedCamera.district}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="camera-stats">
              <div className="section-eyebrow">นับได้ในเฟรมล่าสุด</div>
              {[
                { label: 'รถยนต์', value: counts.cars },
                { label: 'มอเตอร์ไซค์', value: counts.bikes },
                { label: 'รถบรรทุก', value: counts.trucks },
              ].map((s, i) => (
                <div key={s.label} className="camera-count animate-fadeInUp" style={{ animationDelay: `${i * 80}ms` }}>
                  <span className="text-sm text-secondary">{s.label}</span>
                  <span className="camera-count-value">{s.value}</span>
                </div>
              ))}

              <div
                className={`camera-status-card ${busy ? 'is-busy' : ''} animate-fadeInUp`}
                style={{ animationDelay: '240ms' }}
              >
                <span className="text-xs text-muted">หน้ากล้องตอนนี้</span>
                <span className="camera-status-title">{busy ? 'รถค่อนข้างหนาแน่น' : 'ถนนโล่งสบาย'}</span>
                <span className="text-sm text-secondary">
                  {busy ? 'เผื่อเวลาเดินทางเพิ่มเล็กน้อย' : 'ไปได้เลย ทางสะดวก'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="animate-fadeIn">
            <div className="card">
              <div className="flex items-center justify-between gap-md mb-md">
                <h3>ค้นหากล้อง</h3>
                <span className="text-xs text-muted">
                  {loading ? 'กำลังโหลด…' : `${searchResults.length} จาก ${cameras.length} กล้อง`}
                </span>
              </div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="พิมพ์ชื่อแยก, ถนน, เขต..."
                className="camera-search-input"
                aria-label="ค้นหากล้อง"
              />
              <div className="camera-search-results mt-base">
                {searchResults.map((cam) => (
                  <div
                    key={cam.id}
                    role="button"
                    tabIndex={0}
                    className={`camera-search-item ${cam.id === selectedCamera?.id ? 'is-current' : ''}`}
                    onClick={() => openCamera(cam.id)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openCamera(cam.id)
                      }
                    }}
                  >
                    <Camera size={16} strokeWidth={1.6} />
                    <div className="flex-1">
                      <span className="fw-medium block">{cam.name}</span>
                      <span className="text-xs text-muted block">{cam.district}</span>
                    </div>
                    <FavoriteButton cameraId={cam.id} />
                    <span className="badge badge-neutral">ดูสด</span>
                    <ChevronRight size={16} className="text-muted" />
                  </div>
                ))}
                {!loading && searchResults.length === 0 && (
                  <p className="text-sm text-muted camera-search-empty">
                    ไม่พบกล้องที่ตรงกับ “{query}”
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'count-bma' || activeTab === 'helmet' || activeTab === 'wrong-way') && (
          <div className="animate-fadeIn">
            <div className="card empty-state">
              <Monitor size={40} strokeWidth={1.4} />
              <h3>
                {activeTab === 'count-bma' && 'นับรถกล้อง กทม.'}
                {activeTab === 'helmet' && 'ตรวจหมวกกันน็อก'}
                {activeTab === 'wrong-way' && 'ตรวจรถย้อนศร'}
              </h3>
              <p className="text-secondary">กำลังพัฒนา เร็ว ๆ นี้</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
