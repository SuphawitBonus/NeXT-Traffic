import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Play, Camera, ArrowUpRight } from 'lucide-react'
import LiveVideo from '../components/LiveVideo'
import FavoriteButton from '../components/FavoriteButton'
import { fetchBangkokCameras } from '../data/cameras'
import { useFavoriteIds } from '../data/favorites'
import './MyCameras.css'

// Each stream costs bandwidth; beyond this many, tiles wait for a click
const MAX_AUTOPLAY = 4

function CameraTile({ cam, autoPlay }) {
  const [playing, setPlaying] = useState(autoPlay)
  const [error, setError] = useState(false)

  return (
    <div className="mycam-tile card">
      <div className="mycam-video">
        {playing && !error ? (
          <>
            <LiveVideo src={cam.url} onError={() => setError(true)} />
            <span className="badge badge-live mycam-live">LIVE</span>
          </>
        ) : (
          <button type="button" className="mycam-play" onClick={() => { setError(false); setPlaying(true) }}>
            {error ? (
              <>
                <Camera size={28} strokeWidth={1.4} />
                <span>โหลดภาพไม่สำเร็จ · กดเพื่อลองใหม่</span>
              </>
            ) : (
              <>
                <span className="mycam-play-icon"><Play size={18} fill="currentColor" /></span>
                <span>กดเพื่อดูสด</span>
              </>
            )}
          </button>
        )}
      </div>
      <div className="mycam-meta">
        <div className="mycam-text">
          <span className="mycam-name">{cam.name}</span>
          <span className="text-xs text-muted">{cam.district}</span>
        </div>
        <div className="flex items-center gap-xs">
          <Link
            to={`/camera-ai?cam=${encodeURIComponent(cam.id)}`}
            className="btn btn-ghost btn-icon"
            aria-label="เปิดในหน้ากล้อง AI"
            title="เปิดในหน้ากล้อง AI"
          >
            <ArrowUpRight size={16} />
          </Link>
          <FavoriteButton cameraId={cam.id} />
        </div>
      </div>
    </div>
  )
}

export default function MyCameras() {
  const favoriteIds = useFavoriteIds()
  const [cameras, setCameras] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    fetchBangkokCameras()
      .then((list) => {
        if (cancelled) return
        setCameras(list)
        setStatus('ok')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const saved = favoriteIds.map((id) => cameras.find((c) => c.id === id)).filter(Boolean)
  const others = cameras.filter((c) => !favoriteIds.includes(c.id))

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>กล้องของฉัน</h1>
          <p>กล้องที่คุณบันทึกไว้ ดูสดพร้อมกันได้ในหน้าเดียว · บันทึกไว้ในเบราว์เซอร์นี้</p>
        </div>
        <div className="page-header-right">
          <span className="badge badge-neutral">
            <Star size={12} /> {saved.length} กล้อง
          </span>
        </div>
      </div>

      <div className="page-body p-xl">
        {status === 'loading' && <div className="card empty-state"><p className="text-secondary">กำลังโหลดรายชื่อกล้อง…</p></div>}

        {status === 'error' && (
          <div className="card empty-state">
            <Camera size={40} strokeWidth={1.4} />
            <h3>โหลดรายชื่อกล้องไม่สำเร็จ</h3>
            <p className="text-secondary">เชื่อมต่อ Longdo ไม่ได้ ลองรีเฟรชหน้าอีกครั้ง</p>
          </div>
        )}

        {status === 'ok' && saved.length === 0 && (
          <div className="card empty-state animate-fadeIn">
            <Star size={40} strokeWidth={1.4} />
            <h3>ยังไม่มีกล้องที่บันทึกไว้</h3>
            <p className="text-secondary">กดรูปดาวที่กล้องด้านล่าง ในหน้ากล้อง AI หรือบนแผนที่ เพื่อเก็บไว้ดูที่นี่</p>
          </div>
        )}

        {saved.length > 0 && (
          <div className="mycam-grid">
            {saved.map((cam, i) => (
              <CameraTile key={cam.id} cam={cam} autoPlay={i < MAX_AUTOPLAY} />
            ))}
          </div>
        )}

        {status === 'ok' && others.length > 0 && (
          <section className="mycam-add">
            <div className="section-eyebrow">เพิ่มกล้อง</div>
            <div className="mycam-add-list">
              {others.map((cam) => (
                <div key={cam.id} className="mycam-add-item">
                  <Camera size={15} strokeWidth={1.6} className="text-muted" />
                  <span className="mycam-add-name">{cam.name}</span>
                  <FavoriteButton cameraId={cam.id} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
