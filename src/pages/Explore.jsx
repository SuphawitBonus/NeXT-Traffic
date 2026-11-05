import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowRight, Search, Check, X, ExternalLink, Bot } from 'lucide-react'
import ShareLinkButton from '../components/ShareLinkButton'
import { fetchBangkokCameras } from '../data/cameras'
import { useApi } from '../lib/useApi'
import { AUDIENCES, CATEGORIES, DATASETS, DATASET_BY_ID, STATUS } from '../data/catalog'
import './Explore.css'

const countStatus = (status) => DATASETS.filter((d) => d.status === status).length
const REAL_COUNT = DATASETS.filter((d) => d.status !== 'mock').length

function scrollBehavior() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
}

// The two live sources are cheap to ask for: cameras are cached in the
// browser and /api/water sits behind a 10-minute CDN cache.
function useLiveMetrics() {
  const [cameraCount, setCameraCount] = useState(null)
  const water = useApi('/api/water')

  useEffect(() => {
    let cancelled = false
    fetchBangkokCameras()
      .then((list) => !cancelled && setCameraCount(list.length))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const s = water.data?.summary
  return {
    cctv: cameraCount != null ? `${cameraCount.toLocaleString()} กล้องเปิดอยู่ตอนนี้` : null,
    water: s ? `${s.total} สถานี · ล้นตลิ่ง ${s.overflow}` : null,
  }
}

function DatasetCard({ d, metric, highlighted }) {
  const Icon = d.icon
  const status = STATUS[d.status]
  return (
    <article id={`ds-${d.id}`} className={`card dataset-card ${highlighted ? 'is-highlighted' : ''} ${d.status === 'mock' ? 'is-mock' : ''}`}>
      <header className="dataset-head">
        <span className="dataset-icon"><Icon size={18} strokeWidth={1.6} /></span>
        <div className="flex-1">
          <h3>{d.name}</h3>
          <p className="text-sm text-secondary mt-xs">{d.summary}</p>
        </div>
        <span className={`badge ${status.badge}`}>{status.label}</span>
      </header>

      <dl className="dataset-facts">
        <div>
          <dt>ความสด</dt>
          <dd>{d.freshness}</dd>
        </div>
        <div>
          <dt>ครอบคลุม</dt>
          <dd>{d.coverage}</dd>
        </div>
        {metric && (
          <div>
            <dt>ตอนนี้</dt>
            <dd className="dataset-metric">{metric}</dd>
          </div>
        )}
      </dl>

      <div className="dataset-limits">
        <div>
          <h4>บอกได้</h4>
          <ul>
            {d.shows.map((t) => (
              <li key={t}><Check size={14} className="text-green" aria-hidden="true" />{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>บอกไม่ได้</h4>
          <ul>
            {d.notShows.map((t) => (
              <li key={t}><X size={14} className="text-red" aria-hidden="true" />{t}</li>
            ))}
          </ul>
        </div>
      </div>

      {d.questions.length > 0 && (
        <div className="dataset-questions">
          <span className="text-xs text-muted">ลองถามว่า</span>
          {d.questions.map((q) => (
            <span key={q} className="dataset-question">“{q}”</span>
          ))}
        </div>
      )}

      <footer className="dataset-foot">
        <span className="text-xs text-muted dataset-source">
          ที่มา:{' '}
          {d.source.url ? (
            <a href={d.source.url} target="_blank" rel="noreferrer">
              {d.source.label}
              <ExternalLink size={11} aria-hidden="true" />
            </a>
          ) : (
            d.source.label
          )}
        </span>
        <div className="flex gap-sm flex-wrap">
          <ShareLinkButton
            className="btn btn-ghost btn-sm"
            title={`${d.name} · NextTraffic`}
            getUrl={() => `${window.location.origin}/explore#ds-${d.id}`}
          />
          <Link to={d.open.path} className="btn btn-primary btn-sm">
            {d.open.label}
            <ArrowRight size={14} />
          </Link>
        </div>
      </footer>
    </article>
  )
}

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { hash } = useLocation()
  const audienceKey = AUDIENCES.some((a) => a.key === searchParams.get('for')) ? searchParams.get('for') : AUDIENCES[0].key
  const audience = AUDIENCES.find((a) => a.key === audienceKey)
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  // `n` makes picking the same dataset twice scroll again
  const [highlight, setHighlight] = useState({ id: null, n: 0 })
  const highlightId = highlight.id
  const highlightTimer = useRef(null)
  const metrics = useLiveMetrics()

  const counts = useMemo(
    () => Object.fromEntries(CATEGORIES.map((c) => [c.key, c.key === 'all' ? DATASETS.length : DATASETS.filter((d) => d.category === c.key).length])),
    [],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return DATASETS.filter((d) => {
      if (category !== 'all' && d.category !== category) return false
      if (!q) return true
      return [d.name, d.summary, d.coverage, ...d.questions, ...d.shows].join(' ').toLowerCase().includes(q)
    })
  }, [category, query])

  // Bring a dataset into view and flash it. Filters are cleared first so the
  // card is guaranteed to be rendered.
  function focusDataset(id) {
    setCategory('all')
    setQuery('')
    setHighlight((h) => ({ id, n: h.n + 1 }))
  }

  useEffect(() => {
    if (!highlight.id) return
    const frame = requestAnimationFrame(() => scrollToId(`ds-${highlight.id}`))
    clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setHighlight((h) => ({ ...h, id: null })), 2000)
    return () => cancelAnimationFrame(frame)
  }, [highlight])

  useEffect(() => () => clearTimeout(highlightTimer.current), [])

  // Shared links land on /explore#ds-<id>
  useEffect(() => {
    const id = hash.startsWith('#ds-') ? hash.slice(4) : null
    if (id && DATASET_BY_ID[id]) focusDataset(id)
  }, [hash])

  function chooseAudience(key) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('for', key)
        return next
      },
      { replace: true, preventScrollReset: true },
    )
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <span className="explore-eyebrow">สำรวจข้อมูล</span>
          <h1>ข้อมูลจราจรและน้ำของกรุงเทพฯ สำหรับการตัดสินใจจริง</h1>
          <p>
            เริ่มจากคำถามที่อยากรู้ แล้วเราจะพาไปหน้าที่ตอบได้
            ทุกชุดข้อมูลบอกไว้ว่ารู้อะไรได้ และรู้อะไรไม่ได้
          </p>
          <div className="flex gap-sm flex-wrap mt-base">
            <button type="button" className="btn btn-primary" onClick={() => scrollToId('decisions')}>
              เริ่มจากคำถาม
              <ArrowRight size={16} />
            </button>
            <button type="button" className="btn btn-outline" onClick={() => scrollToId('datasets')}>
              ดูข้อมูลทั้งหมด
            </button>
          </div>
        </div>
      </div>

      <div className="page-body p-xl">
        <section className="explore-scope" aria-label="ขอบเขตข้อมูล">
          <div>
            <strong>{REAL_COUNT} ชุดข้อมูลจริง</strong>
            <span>สด {countStatus('live')} · รายเดือน {countStatus('periodic')} · ในเครื่องคุณ {countStatus('device')}</span>
            <em>ชุด "ในเครื่องคุณ" ไม่ได้แชร์ถึงผู้ใช้คนอื่น</em>
          </div>
          <div>
            <strong>กรุงเทพมหานคร</strong>
            <span>ระดับน้ำครอบคลุมปริมณฑลอีก 5 จังหวัด</span>
            <em>ยังไม่มีข้อมูลรายถนนจากเซนเซอร์หรือ GPS</em>
          </div>
          <div>
            <strong>ข้อมูลจำลองติดป้ายทุกจุด</strong>
            <span>ส่วนที่ยังเป็นตัวอย่างเห็นได้ชัดบนหน้าจอ</span>
            <em>อย่าใช้ส่วนนั้นตัดสินใจเดินทาง</em>
          </div>
        </section>

        <section id="decisions" className="explore-section">
          <div className="explore-section-head">
            <h2>คุณกำลังตัดสินใจเรื่องอะไร</h2>
            <p className="text-secondary">เลือกกลุ่มที่ใกล้กับคุณ แต่ละคำถามบอกไว้ว่าใช้ข้อมูลชุดไหนตอบ</p>
          </div>

          <div className="tabs mb-base" role="tablist" aria-label="กลุ่มผู้ใช้">
            {AUDIENCES.map((a) => {
              const Icon = a.icon
              return (
                <button
                  key={a.key}
                  type="button"
                  role="tab"
                  aria-selected={a.key === audienceKey}
                  className={`tab-item ${a.key === audienceKey ? 'active' : ''}`}
                  onClick={() => chooseAudience(a.key)}
                >
                  <Icon size={14} />
                  {a.label}
                </button>
              )
            })}
          </div>

          <div className="decision-grid" role="tabpanel" key={audienceKey}>
            {audience.decisions.map((dec, i) => (
              <div key={dec.q} className="card decision-card animate-fadeInUp" style={{ animationDelay: `${i * 60}ms` }}>
                <p className="decision-q">{dec.q}</p>
                <div className="decision-uses">
                  <span className="text-xs text-muted">ตอบด้วย</span>
                  {dec.uses.map((id) => {
                    const d = DATASET_BY_ID[id]
                    return (
                      <button key={id} type="button" className="decision-chip" onClick={() => focusDataset(id)}>
                        {d.name}
                        <span className={`decision-chip-dot status-${d.status}`} aria-label={STATUS[d.status].label} />
                      </button>
                    )
                  })}
                </div>
                <Link to={dec.path} className="btn btn-outline btn-sm decision-cta">
                  {dec.cta}
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section id="datasets" className="explore-section">
          <div className="explore-section-head">
            <h2>ชุดข้อมูลทั้งหมด</h2>
            <p className="text-secondary">อ่านช่อง "บอกไม่ได้" ก่อนเอาตัวเลขไปใช้</p>
          </div>

          <div className="dataset-toolbar">
            <label className="dataset-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหา เช่น คลอง มอเตอร์ไซค์ แยก"
                aria-label="ค้นหาชุดข้อมูล"
              />
            </label>
            <div className="tabs" aria-label="หมวดข้อมูล">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={category === c.key}
                  className={`tab-item ${category === c.key ? 'active' : ''}`}
                  onClick={() => setCategory(c.key)}
                >
                  {c.label}
                  <span className="text-xs text-muted">{counts[c.key]}</span>
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="card empty-state">
              <Search size={32} strokeWidth={1.4} />
              <h3>ไม่พบชุดข้อมูล</h3>
              <p className="text-secondary">ลองคำอื่น หรือถาม AI ว่าคำถามนี้ตอบได้จากข้อมูลไหน</p>
              <button type="button" className="btn btn-outline btn-sm mt-sm" onClick={() => { setQuery(''); setCategory('all') }}>
                ล้างตัวกรอง
              </button>
            </div>
          ) : (
            <div className="dataset-grid">
              {visible.map((d) => (
                <DatasetCard key={d.id} d={d} metric={metrics[d.id]} highlighted={highlightId === d.id} />
              ))}
            </div>
          )}
        </section>

        <section className="callout explore-cta">
          <Bot size={20} strokeWidth={1.6} aria-hidden="true" />
          <div className="flex-1">
            <strong>ไม่เจอคำถามของคุณ?</strong>
            <span> ถาม AI เป็นภาษาพูดได้ AI ตอบจากข้อมูลชุดเดียวกับหน้านี้ และจะบอกตรง ๆ ถ้าข้อมูลไม่พอ</span>
          </div>
          <Link to="/ask-ai" className="btn btn-outline btn-sm">
            ถาม AI
            <ArrowRight size={14} />
          </Link>
        </section>
      </div>
    </>
  )
}
