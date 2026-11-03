import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Square, RotateCcw, Sparkles, TerminalSquare } from 'lucide-react'
import { fetchBangkokCameras } from '../data/cameras'
import { ALERTS } from '../data/alerts'
import { TRAFFIC_SCORE, ROAD_DATA } from '../data/mockData'
import { useFloodReports, levelOf, passabilityOf } from '../data/floodReports'
import './AskAI.css'

const SUGGESTIONS = [
  'ตอนนี้มีจุดไหนน้ำท่วมบ้าง',
  'ถนนไหนติดที่สุดตอนนี้',
  'มีกล้องแถวพระราม 4 ไหม',
  'จะไปสาทรควรเลี่ยงเส้นไหน',
]

// Photos are left out: they're large and the model only needs the text fields
function buildContext(cameras, reports) {
  return {
    now: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
    live_cameras: cameras.map((c) => ({
      name: c.name,
      org: c.district,
      lat: Number(c.lat.toFixed(4)),
      lng: Number(c.lng.toFixed(4)),
    })),
    flood_reports: reports.slice(0, 50).map((r) => ({
      place: r.place,
      water_level: `${levelOf(r.level).label} (${levelOf(r.level).depth})`,
      passable: passabilityOf(r.passable).label,
      note: r.note || undefined,
      reported_at: new Date(r.createdAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      lat: Number(r.lat.toFixed(4)),
      lng: Number(r.lng.toFixed(4)),
    })),
    alerts: ALERTS.map(({ title, description, time, severity }) => ({ title, description, time, severity })),
    traffic_overview: { simulated: true, score: TRAFFIC_SCORE.score, label: TRAFFIC_SCORE.label, red_percent: TRAFFIC_SCORE.redPercent },
    roads: { simulated: true, items: ROAD_DATA.map(({ name, score, status }) => ({ name, score, status })) },
  }
}

async function* readEvents(response) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let idx
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const line = chunk.split('\n').find((l) => l.startsWith('data: '))
      if (line) yield JSON.parse(line.slice(6))
    }
  }
}

export default function AskAI() {
  const reports = useFloodReports()
  const [status, setStatus] = useState('checking')
  const [cameras, setCameras] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef(null)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  async function checkHealth() {
    setStatus('checking')
    try {
      const res = await fetch('/api/health')
      const data = res.ok ? await res.json() : null
      setStatus(data?.ok ? (data.hasCredential ? 'ready' : 'no-key') : 'offline')
    } catch {
      setStatus('offline')
    }
  }

  useEffect(() => {
    checkHealth()
    fetchBangkokCameras().then(setCameras).catch(() => setCameras([]))
    return () => abortRef.current?.abort()
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  async function ask(text) {
    const question = text.trim()
    if (!question || streaming) return
    setInput('')

    const userTurn = { role: 'user', content: question }
    // Error bubbles stay on screen but are never sent back as assistant turns
    const history = [...messages.filter((m) => !m.error), userTurn]
    setMessages([...messages, userTurn, { role: 'assistant', content: '', pending: true }])
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller
    const patchLast = (fn) =>
      setMessages((list) => [...list.slice(0, -1), fn(list[list.length - 1])])

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          context: buildContext(cameras, reports),
        }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'เซิร์ฟเวอร์ API ไม่ตอบ ตรวจสอบว่ารัน npm run api อยู่')
      }
      for await (const event of readEvents(res)) {
        if (event.type === 'text') {
          patchLast((m) => ({ ...m, content: m.content + event.text }))
        } else if (event.type === 'refusal' || event.type === 'notice') {
          patchLast((m) => ({ ...m, content: (m.content ? m.content + '\n\n' : '') + event.text }))
        } else if (event.type === 'error') {
          patchLast((m) => ({ ...m, content: event.text, error: true }))
        }
      }
    } catch (err) {
      if (controller.signal.aborted) {
        patchLast((m) => ({ ...m, content: m.content || '(หยุดแล้ว)', stopped: true }))
      } else {
        patchLast((m) => ({ ...m, content: err.message, error: true }))
      }
    } finally {
      patchLast((m) => ({ ...m, pending: false }))
      setStreaming(false)
      abortRef.current = null
      inputRef.current?.focus()
    }
  }

  const ready = status === 'ready'
  const empty = messages.length === 0

  return (
    <div className="ask-page">
      <div className="page-header ask-header">
        <div className="page-header-left">
          <h1>ถาม AI</h1>
          <p>ถามเรื่องจราจร กล้อง น้ำท่วม และอุบัติเหตุในกรุงเทพฯ · AI อ่านข้อมูลกล้องสด ระดับน้ำจาก ThaiWater สถิติอุบัติเหตุ และรายงานในแอปก่อนตอบ</p>
        </div>
        <div className="page-header-right">
          {!empty && (
            <button className="btn btn-ghost btn-sm" onClick={() => setMessages([])} disabled={streaming}>
              <RotateCcw size={14} /> เริ่มใหม่
            </button>
          )}
        </div>
      </div>

      <div className="ask-body">
        {(status === 'no-key' || status === 'offline') && (
          <div className="card ask-setup animate-fadeIn">
            <div className="flex items-center gap-sm mb-md">
              <TerminalSquare size={18} />
              <h3>{status === 'no-key' ? 'ยังไม่ได้ใส่ API key' : 'ยังไม่ได้เปิดเซิร์ฟเวอร์ API'}</h3>
            </div>
            <ol className="ask-setup-steps">
              {status === 'offline' && (
                <li>เปิด terminal ใหม่ในโฟลเดอร์โปรเจกต์ แล้วรัน <code>npm run api</code></li>
              )}
              <li>คัดลอกไฟล์ <code>.env.example</code> เป็น <code>.env</code> แล้วใส่ <code>ANTHROPIC_API_KEY=...</code></li>
              <li>ถ้าเพิ่งใส่ key ให้รีสตาร์ต <code>npm run api</code> (ครั้งแรกต้องรีสตาร์ต <code>npm run dev</code> ด้วย)</li>
            </ol>
            <button className="btn btn-outline btn-sm mt-md" onClick={checkHealth}>
              <RotateCcw size={14} /> ตรวจสอบอีกครั้ง
            </button>
          </div>
        )}

        {empty ? (
          <div className="ask-empty animate-fadeInUp">
            <Sparkles size={28} strokeWidth={1.4} className="ask-empty-icon" />
            <h2 className="ask-empty-title">
              ถามอะไรก็ได้เรื่อง<span className="text-gradient">จราจรกรุงเทพฯ</span>
            </h2>
            <p className="text-secondary">
              ตอนนี้ AI เห็นกล้องสด {cameras.length} ตัว และรายงานน้ำท่วม {reports.length} รายการ
            </p>
            <div className="ask-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="ask-chip" onClick={() => ask(s)} disabled={!ready}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ask-thread" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`ask-msg ask-${m.role} ${m.error ? 'is-error' : ''}`}>
                {m.role === 'assistant' && <span className="ask-avatar"><Sparkles size={14} /></span>}
                <div className="ask-bubble">
                  {m.content}
                  {m.pending && <span className="ask-caret" aria-hidden="true" />}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form
        className="ask-composer"
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        <div className="ask-composer-inner">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                ask(input)
              }
            }}
            placeholder={ready ? 'พิมพ์คำถาม… (Enter เพื่อส่ง, Shift+Enter ขึ้นบรรทัดใหม่)' : 'ตั้งค่า API ก่อนเริ่มถาม'}
            rows={1}
            maxLength={2000}
            disabled={!ready}
            aria-label="คำถาม"
          />
          {streaming ? (
            <button type="button" className="ask-send is-stop" onClick={() => abortRef.current?.abort()} aria-label="หยุดตอบ">
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button type="submit" className="ask-send" disabled={!ready || !input.trim()} aria-label="ส่งคำถาม">
              <ArrowUp size={18} />
            </button>
          )}
        </div>
        <p className="ask-disclaimer">AI อาจตอบผิดได้ ข้อมูลภาพรวมจราจรและรายถนนในแอปยังเป็นข้อมูลจำลอง</p>
      </form>
    </div>
  )
}
