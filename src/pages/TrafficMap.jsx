import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Navigation, Camera, Droplets, AlertTriangle, TrainFront, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import LiveVideo from '../components/LiveVideo'
import FavoriteButton from '../components/FavoriteButton'
import ShareLinkButton from '../components/ShareLinkButton'
import { reportPinIcon } from '../components/PinPicker'
import { useFloodReports, levelOf, passabilityOf, timeAgo, SEVERITY_COLOR } from '../data/floodReports'
import { fetchBangkokCameras } from '../data/cameras'
import { CCTV_CAMERAS, BANGKOK_CENTER, FLOOD_POINTS, TRAFFIC_SCORE } from '../data/mockData'
import './TrafficMap.css'

const LEVEL_COLORS = {
  heavy: '#ff7b6b',
  moderate: '#f5c26b',
  light: '#6fd39a',
}

function getCameraIcon(trafficLevel) {
  const color = LEVEL_COLORS[trafficLevel] || '#a9d4ff'

  return L.divIcon({
    className: 'camera-marker',
    html: `<div class="camera-marker-dot" style="--c: ${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  })
}

const LIVE_CAMERA_ICON = getCameraIcon(null)

// Leaflet gives keyboard-focusable markers role="button" but no accessible name
function labelMarker(label) {
  return (e) => e.target.getElement()?.setAttribute('aria-label', label)
}

function getFloodIcon(level) {
  const colors = { 'ล้น': '#ff7b6b', 'เฝ้าระวัง': '#f5c26b', 'ปกติ': '#6fd39a' }
  const color = colors[level] || '#a9d4ff'

  return L.divIcon({
    className: 'flood-marker',
    html: `<div class="flood-marker-dot" style="--c: ${color}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  })
}

// A view can be opened from a link: /map?layers=cameras,reports&view=13.7563,100.5018,14
// Only layers that actually draw something are addressable.
const LINKABLE_LAYERS = ['traffic', 'cameras', 'flood', 'reports']
const DEFAULT_LAYERS = ['traffic', 'cameras', 'reports']

function parseLayers(param) {
  if (param == null) return DEFAULT_LAYERS
  return param.split(',').filter((k) => LINKABLE_LAYERS.includes(k))
}

function parseView(param) {
  const [lat, lng, zoom] = (param ?? '').split(',').map(Number)
  const valid = Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && zoom >= 5 && zoom <= 19
  return valid ? { center: [lat, lng], zoom: Math.round(zoom) } : null
}

// Locate control rendered inside MapContainer
function LocateControl() {
  const map = useMap()

  function handleLocate() {
    map.locate({ setView: true, maxZoom: 16 })
  }

  return (
    <div className="leaflet-top leaflet-right" style={{ top: 10, right: 10 }}>
      <button
        className="map-locate-btn btn btn-outline"
        onClick={handleLocate}
        title="ไปที่ตำแหน่งของฉัน"
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}
      >
        <Navigation size={14} />
        ไปที่ตำแหน่งของฉัน
      </button>
    </div>
  )
}

export default function TrafficMap() {
  const [searchParams] = useSearchParams()
  // Read once: the map owns its state after it mounts
  const [initial] = useState(() => ({
    layers: parseLayers(searchParams.get('layers')),
    view: parseView(searchParams.get('view')),
  }))
  const mapRef = useRef(null)
  const [showTraffic, setShowTraffic] = useState(initial.layers.includes('traffic'))
  const [showCameras, setShowCameras] = useState(initial.layers.includes('cameras'))
  const [showFlood, setShowFlood] = useState(initial.layers.includes('flood'))
  const [showIncidents, setShowIncidents] = useState(false)
  const [showBTS, setShowBTS] = useState(false)
  const [showReports, setShowReports] = useState(initial.layers.includes('reports'))

  function shareUrl() {
    const layers = [showTraffic && 'traffic', showCameras && 'cameras', showFlood && 'flood', showReports && 'reports']
      .filter(Boolean)
      .join(',')
    const params = new URLSearchParams({ layers })
    const map = mapRef.current
    if (map) {
      const c = map.getCenter()
      params.set('view', `${c.lat.toFixed(4)},${c.lng.toFixed(4)},${map.getZoom()}`)
    }
    // URLSearchParams encodes commas; they're safe in a query and read better raw
    return `${window.location.origin}/map?${params.toString().replaceAll('%2C', ',')}`
  }
  const floodReports = useFloodReports()
  const [panelOpen, setPanelOpen] = useState(true)
  const [liveCameras, setLiveCameras] = useState([])
  const [camerasStatus, setCamerasStatus] = useState('loading')
  const [openCameraId, setOpenCameraId] = useState(null)
  const [popupError, setPopupError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchBangkokCameras()
      .then((list) => {
        if (cancelled) return
        setLiveCameras(list)
        setCamerasStatus('ok')
      })
      .catch(() => {
        if (!cancelled) setCamerasStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Count active layers
  const activeLayers = [showTraffic, showCameras].filter(Boolean).length

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>แผนที่จราจร</h1>
          <p>
            เส้นสีบอกการระบายรถแบบสด จิ้มหมุดกล้องเพื่อเปิดภาพสด
            เปิด/ปิดชั้นข้อมูลได้ที่แผงซ้าย
          </p>
        </div>
        <div className="page-header-right">
          <ShareLinkButton
            className="btn btn-outline"
            label="แชร์มุมมองนี้"
            title="แผนที่จราจร · NextTraffic"
            getUrl={shareUrl}
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="map-container">
        {/* Left Panel */}
        {panelOpen && (
          <div className="map-panel">
            {/* Section: Traffic & Cameras */}
            <div className="map-panel-section">
              <div className="map-panel-header">
                <h3>จราจรและกล้อง</h3>
                <div className="flex items-center gap-sm">
                  <span className="badge badge-blue">เปิด {activeLayers}</span>
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => setPanelOpen(false)}
                    aria-label="ซ่อนแผงควบคุม"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted mt-sm">
                เส้นจราจร หมุดกล้อง อุบัติเหตุ และรถไฟฟ้า
              </p>
            </div>

            {/* Traffic Lines Toggle */}
            <div className="map-layer-toggle">
              <label className="custom-checkbox flex-1 flex items-center gap-md">
                <input
                  type="checkbox"
                  checked={showTraffic}
                  onChange={(e) => setShowTraffic(e.target.checked)}
                />
                <div className="flex-1">
                  <div className="toggle-title flex items-center gap-sm">
                    เส้นจราจร
                    <span className="badge badge-yellow badge-sm">สด 00:30</span>
                  </div>
                  <div className="map-legend-inline">
                    <span className="legend-item">
                      <span className="map-legend-dot" style={{ background: 'var(--traffic-green)', width: 10, height: 10 }} />
                      โล่ง
                    </span>
                    <span className="legend-item">
                      <span className="map-legend-dot" style={{ background: 'var(--traffic-yellow)', width: 10, height: 10 }} />
                      ปานกลาง
                    </span>
                    <span className="legend-item">
                      <span className="map-legend-dot" style={{ background: 'var(--traffic-red)', width: 10, height: 10 }} />
                      ติดขัด
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {/* Traffic Score */}
            <div className="map-traffic-summary">
              ทั้งเมืองระบายได้{' '}
              <strong>{TRAFFIC_SCORE.score}</strong>/{TRAFFIC_SCORE.max}{' '}
              · แดง {TRAFFIC_SCORE.redPercent}%
            </div>

            {/* Map Pins Section */}
            <div className="map-panel-section">
              <h4 className="font-display fw-semibold">หมุดบนแผนที่</h4>
            </div>

            {/* Camera Toggle */}
            <div className="map-layer-toggle">
              <label className="custom-checkbox flex-1 flex items-center gap-md">
                <input
                  type="checkbox"
                  checked={showCameras}
                  onChange={(e) => setShowCameras(e.target.checked)}
                />
                <div className="toggle-icon" style={{ background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)' }}>
                  <Camera size={16} strokeWidth={1.6} />
                </div>
                <div className="flex-1">
                  <div className="toggle-title">
                    กล้อง CCTV จราจร
                    <span className="badge badge-blue badge-sm" style={{ marginLeft: 6 }}>
                      {camerasStatus === 'loading' ? '…' : `${liveCameras.length} ตัว`}
                    </span>
                  </div>
                  <div className="toggle-desc">
                    {camerasStatus === 'error'
                      ? 'โหลดรายชื่อกล้องจาก Longdo ไม่สำเร็จ ลองรีเฟรชหน้า'
                      : 'กล้องสดจาก Longdo · คลิกหมุดเพื่อดูวิดีโอสด'}
                  </div>
                </div>
              </label>
            </div>

            {/* Flood Toggle */}
            <div className="map-layer-toggle">
              <label className="custom-checkbox flex-1 flex items-center gap-md">
                <input
                  type="checkbox"
                  checked={showFlood}
                  onChange={(e) => setShowFlood(e.target.checked)}
                />
                <div className="toggle-icon" style={{ background: 'rgba(169, 255, 245, 0.1)', color: 'var(--accent-cyan)' }}>
                  <Droplets size={16} strokeWidth={1.6} />
                </div>
                <div className="flex-1">
                  <div className="toggle-title">
                    กล้องจุดเฝ้าระวังน้ำท่วม
                    <span className="badge badge-orange badge-sm" style={{ marginLeft: 6 }}>
                      {FLOOD_POINTS.length} จุด
                    </span>
                  </div>
                  <div className="toggle-desc">
                    อยู่ใกล้สถานีวัดน้ำแม่น้ำ/คลองที่น้ำสูงหรือเสี่ยงล้นตลิ่ง
                  </div>
                </div>
              </label>
            </div>

            <div className="map-layer-toggle">
              <label className="custom-checkbox flex-1 flex items-center gap-md">
                <input
                  type="checkbox"
                  checked={showReports}
                  onChange={(e) => setShowReports(e.target.checked)}
                />
                <div className="toggle-icon" style={{ background: 'rgba(179, 254, 239, 0.1)', color: 'var(--accent-cyan)' }}>
                  <MapPin size={16} strokeWidth={1.6} />
                </div>
                <div className="flex-1">
                  <div className="toggle-title">
                    รายงานน้ำท่วมจากผู้ใช้
                    <span className="badge badge-blue badge-sm" style={{ marginLeft: 6 }}>
                      {floodReports.length}
                    </span>
                  </div>
                  <div className="toggle-desc">
                    {floodReports.length === 0 ? (
                      <>ยังไม่มีรายงาน · <Link to="/report-flood">แจ้งน้ำท่วม</Link></>
                    ) : (
                      <>จุดที่ผู้ใช้แจ้งผ่านหน้า <Link to="/report-flood">แจ้งน้ำท่วม</Link></>
                    )}
                  </div>
                </div>
              </label>
            </div>

            {/* Incidents Toggle */}
            <div className="map-layer-toggle">
              <label className="custom-checkbox flex-1 flex items-center gap-md">
                <input
                  type="checkbox"
                  checked={showIncidents}
                  onChange={(e) => setShowIncidents(e.target.checked)}
                />
                <div className="toggle-icon" style={{ background: 'var(--accent-red-dim)', color: 'var(--accent-red)' }}>
                  <AlertTriangle size={16} strokeWidth={1.6} />
                </div>
                <div className="flex-1">
                  <div className="toggle-title">
                    อุบัติเหตุ / กีดขวางทาง
                  </div>
                  <div className="toggle-desc">
                    จุดเกิดอุบัติเหตุหรือชนที่ดขวาง (ตรวจพบโดย AI / รายงานสด)
                  </div>
                </div>
              </label>
            </div>

            {/* BTS/MRT Toggle */}
            <div className="map-layer-toggle">
              <label className="custom-checkbox flex-1 flex items-center gap-md">
                <input
                  type="checkbox"
                  checked={showBTS}
                  onChange={(e) => setShowBTS(e.target.checked)}
                />
                <div className="toggle-icon" style={{ background: 'rgba(210, 194, 255, 0.1)', color: 'var(--accent-purple)' }}>
                  <TrainFront size={16} strokeWidth={1.6} />
                </div>
                <div className="flex-1">
                  <div className="toggle-title">
                    รถไฟฟ้า BTS / MRT
                  </div>
                  <div className="toggle-desc">
                    BTS, MRT, Airport Rail Link และสายสีแดง จาก OpenStreetMap · คลิกสถานีเพื่อดูชื่อ
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Collapsed panel button */}
        {!panelOpen && (
          <button
            className="map-panel-collapsed"
            onClick={() => setPanelOpen(true)}
          >
            <ChevronRight size={14} />
            แผงควบคุม
          </button>
        )}

        {/* Leaflet Map */}
        <div className="map-wrapper">
          <MapContainer
            ref={mapRef}
            center={initial.view?.center ?? BANGKOK_CENTER}
            zoom={initial.view?.zoom ?? 12}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
          >
            <LocateControl />
            {/* Dark theme tile layer - free OSM with dark CSS filter */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="dark-tiles"
            />

            {/* Traffic overlay (Longdo-like simulation with colored circles on roads) */}
            {showTraffic && (
              <>
                {/* Simulated traffic segments as colored polyline markers */}
                {CCTV_CAMERAS.map((cam) => {
                  const color = LEVEL_COLORS[cam.trafficLevel]
                  return (
                    <CircleMarker
                      key={`traffic-${cam.id}`}
                      center={[cam.lat, cam.lng]}
                      radius={cam.trafficLevel === 'heavy' ? 18 : cam.trafficLevel === 'moderate' ? 14 : 10}
                      pathOptions={{
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.15,
                        weight: 2,
                        opacity: 0.4,
                      }}
                    />
                  )
                })}
              </>
            )}

            {/* Live CCTV markers (Longdo). Only the open popup mounts a stream. */}
            {showCameras &&
              liveCameras.map((cam) => (
                <Marker
                  key={cam.id}
                  position={[cam.lat, cam.lng]}
                  icon={LIVE_CAMERA_ICON}
                  eventHandlers={{
                    add: labelMarker(`กล้องสด ${cam.name}`),
                    popupopen: () => {
                      setOpenCameraId(cam.id)
                      setPopupError(false)
                    },
                    popupclose: () => setOpenCameraId((id) => (id === cam.id ? null : id)),
                  }}
                >
                  {openCameraId !== cam.id && (
                    <Tooltip direction="top" offset={[0, -10]} className="map-tooltip">
                      <span className="map-tooltip-live" />
                      {cam.name}
                    </Tooltip>
                  )}
                  <Popup maxWidth={320} className="camera-popup">
                    <div className="popup-content">
                      <div className="popup-header">
                        <Camera size={16} strokeWidth={1.6} />
                        <strong>{cam.name}</strong>
                      </div>
                      <div className="popup-body">
                        <div className="popup-camera-preview">
                          {openCameraId === cam.id && !popupError ? (
                            <div className="popup-video theme-dark">
                              <LiveVideo src={cam.url} onError={() => setPopupError(true)} />
                              <span className="badge badge-live popup-live">LIVE</span>
                            </div>
                          ) : (
                            <div className="popup-camera-placeholder theme-dark">
                              <Camera size={28} strokeWidth={1.4} />
                              <span>{popupError ? 'โหลดภาพจากกล้องไม่สำเร็จ' : 'กำลังเชื่อมต่อ…'}</span>
                            </div>
                          )}
                        </div>
                        <div className="popup-stats">
                          <div className="popup-stat">
                            <span className="popup-stat-label">หน่วยงาน</span>
                            <span className="text-sm">{cam.district}</span>
                          </div>
                        </div>
                        <div className="popup-actions">
                          <Link to={`/camera-ai?cam=${encodeURIComponent(cam.id)}`} className="btn btn-outline btn-sm popup-open-link">
                            เปิดในหน้ากล้อง AI
                          </Link>
                          <FavoriteButton cameraId={cam.id} withLabel />
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {showReports &&
              floodReports.map((r) => {
                const level = levelOf(r.level)
                return (
                  <Marker
                    key={r.id}
                    position={[r.lat, r.lng]}
                    icon={reportPinIcon(SEVERITY_COLOR[level.severity])}
                    eventHandlers={{
                      add: labelMarker(`รายงานน้ำท่วม ${r.place} ระดับ${level.label}`),
                      popupopen: (e) => e.target.getTooltip()?.setOpacity(0),
                      popupclose: (e) => e.target.getTooltip()?.setOpacity(0.9),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -12]} className="map-tooltip">
                      น้ำ{level.label} · {r.place}
                    </Tooltip>
                    <Popup maxWidth={300}>
                      <div className="popup-content">
                        <div className="popup-header">
                          <MapPin size={16} strokeWidth={1.6} />
                          <strong>{r.place}</strong>
                        </div>
                        <div className="popup-body">
                          {r.photo && <img src={r.photo} alt={r.place} className="popup-report-photo" />}
                          <div className="popup-stats">
                            <div className="popup-stat">
                              <span className="popup-stat-label">ระดับน้ำ</span>
                              <span className="text-sm">{level.label} ({level.depth})</span>
                            </div>
                            <div className="popup-stat">
                              <span className="popup-stat-label">การสัญจร</span>
                              <span className="text-sm">{passabilityOf(r.passable).label}</span>
                            </div>
                            <div className="popup-stat">
                              <span className="popup-stat-label">แจ้งเมื่อ</span>
                              <span className="text-sm">{timeAgo(r.createdAt)}</span>
                            </div>
                          </div>
                          {r.note && <p className="text-sm text-secondary mt-sm">{r.note}</p>}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}

            {/* Flood Markers */}
            {showFlood &&
              FLOOD_POINTS.map((fp) => (
                <Marker
                  key={`flood-${fp.id}`}
                  position={[fp.lat, fp.lng]}
                  icon={getFloodIcon(fp.level)}
                  eventHandlers={{ add: labelMarker(`จุดเฝ้าระวังน้ำ ${fp.name} ${fp.level}`) }}
                >
                  <Popup>
                    <div className="popup-content">
                      <div className="popup-header">
                        <Droplets size={16} />
                        <strong>{fp.name}</strong>
                      </div>
                      <div className="popup-body">
                        <div className="popup-stat">
                          <span className="popup-stat-label">สถานะ</span>
                          <span className={`badge ${fp.level === 'ล้น' ? 'badge-red' : fp.level === 'เฝ้าระวัง' ? 'badge-orange' : 'badge-green'}`}>
                            {fp.level}
                          </span>
                        </div>
                        <div className="popup-stat">
                          <span className="popup-stat-label">ระดับน้ำ</span>
                          <span className="fw-semibold">{fp.waterLevel} ม.</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>
    </>
  )
}
