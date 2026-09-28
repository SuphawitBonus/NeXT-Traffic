import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, LocateFixed, ImagePlus, X, Send, Trash2, Droplets, CheckCircle2, ArrowRight } from 'lucide-react'
import PinPicker from '../components/PinPicker'
import {
  WATER_LEVELS,
  PASSABILITY,
  SEVERITY_COLOR,
  useFloodReports,
  addFloodReport,
  removeFloodReport,
  levelOf,
  passabilityOf,
  timeAgo,
  downscaleImage,
} from '../data/floodReports'
import './ReportFlood.css'

const EMPTY_FORM = { place: '', level: 'shin', passable: 'all', note: '', photo: null }

export default function ReportFlood() {
  const reports = useFloodReports()
  const [form, setForm] = useState(EMPTY_FORM)
  const [pin, setPin] = useState(null)
  const [flyKey, setFlyKey] = useState(0)
  const [errors, setErrors] = useState({})
  const [locating, setLocating] = useState(false)
  const [notice, setNotice] = useState(null)
  const fileRef = useRef(null)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function pickPin(p) {
    setPin(p)
    setErrors((e) => ({ ...e, pin: undefined }))
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setErrors((e) => ({ ...e, pin: 'เบราว์เซอร์นี้หาตำแหน่งไม่ได้ กรุณาจิ้มบนแผนที่แทน' }))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        pickPin({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setFlyKey((k) => k + 1)
      },
      () => {
        setLocating(false)
        setErrors((e) => ({ ...e, pin: 'หาตำแหน่งไม่สำเร็จ (อาจไม่ได้อนุญาต) กรุณาจิ้มบนแผนที่แทน' }))
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((er) => ({ ...er, photo: 'กรุณาเลือกไฟล์รูปภาพ' }))
      return
    }
    try {
      update('photo', await downscaleImage(file))
    } catch (err) {
      setErrors((er) => ({ ...er, photo: err.message }))
    }
  }

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!pin) next.pin = 'กรุณาปักหมุดตำแหน่งบนแผนที่'
    if (!form.place.trim()) next.place = 'กรุณาระบุชื่อสถานที่ เช่น ซอย ถนน หรือแยก'
    setErrors(next)
    if (Object.keys(next).length) return

    const saved = addFloodReport({ ...form, place: form.place.trim(), note: form.note.trim(), lat: pin.lat, lng: pin.lng })
    setForm(EMPTY_FORM)
    setPin(null)
    setNotice(
      saved
        ? { kind: 'ok', text: 'บันทึกรายงานแล้ว ดูหมุดได้ในหน้าแผนที่จราจร' }
        : { kind: 'warn', text: 'บันทึกได้ชั่วคราว แต่เบราว์เซอร์ไม่ยอมเก็บถาวร (พื้นที่เต็มหรือโหมดส่วนตัว) รายงานจะหายเมื่อปิดหน้า' },
    )
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>แจ้งน้ำท่วม</h1>
          <p>ปักหมุดจุดน้ำท่วมขัง บอกระดับน้ำ แล้วรายงานจะขึ้นบนแผนที่ให้คนอื่นเห็น</p>
        </div>
        <div className="page-header-right">
          <span className="badge badge-neutral">
            <Droplets size={12} /> {reports.length} รายงาน
          </span>
        </div>
      </div>

      <div className="page-body p-xl">
        <div className="callout mb-xl">
          <span className="badge badge-yellow">ต้นแบบ</span>
          <span>
            ตอนนี้รายงานเก็บไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น ยังไม่ได้ส่งเข้าศูนย์ของ กทม. ถ้าเจอเหตุฉุกเฉิน โทร 1555 (กทม.) หรือ 199
          </span>
        </div>

        <form className="report-layout" onSubmit={submit} noValidate>
          <div className="card report-map-card">
            <div className="flex items-center justify-between gap-md mb-md flex-wrap">
              <div>
                <h3>1. ปักหมุดตำแหน่ง</h3>
                <p className="text-sm text-muted mt-xs">จิ้มบนแผนที่ หรือลากหมุดเพื่อขยับ</p>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={useMyLocation} disabled={locating}>
                <LocateFixed size={14} className={locating ? 'spin' : ''} />
                {locating ? 'กำลังหาตำแหน่ง…' : 'ใช้ตำแหน่งของฉัน'}
              </button>
            </div>
            <div className={`pin-picker ${errors.pin ? 'has-error' : ''}`}>
              <PinPicker value={pin} onChange={pickPin} flyKey={flyKey} />
              {!pin && (
                <div className="pin-picker-hint">
                  <MapPin size={16} /> จิ้มที่แผนที่เพื่อปักหมุด
                </div>
              )}
            </div>
            <p className={`field-msg ${errors.pin ? 'is-error' : ''}`}>
              {errors.pin || (pin ? `ตำแหน่ง ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : ' ')}
            </p>
          </div>

          <div className="card report-form-card">
            <h3 className="mb-md">2. รายละเอียด</h3>

            <label className="field">
              <span className="field-label">สถานที่ <span className="text-red">*</span></span>
              <input
                type="text"
                value={form.place}
                onChange={(e) => update('place', e.target.value)}
                placeholder="เช่น ซ.ลาดพร้าว 71 หน้าเซเว่น"
                aria-invalid={!!errors.place}
                maxLength={120}
              />
              {errors.place && <span className="field-msg is-error">{errors.place}</span>}
            </label>

            <fieldset className="field">
              <legend className="field-label">ระดับน้ำ</legend>
              <div className="choice-grid choice-grid-4">
                {WATER_LEVELS.map((l) => (
                  <label key={l.key} className={`choice ${form.level === l.key ? 'is-on' : ''}`} style={{ '--c': SEVERITY_COLOR[l.severity] }}>
                    <input type="radio" name="level" value={l.key} checked={form.level === l.key} onChange={() => update('level', l.key)} />
                    <span className="choice-dot" />
                    <span className="choice-title">{l.label}</span>
                    <span className="choice-sub">{l.depth}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="field">
              <legend className="field-label">การสัญจร</legend>
              <div className="choice-grid choice-grid-3">
                {PASSABILITY.map((p) => (
                  <label key={p.key} className={`choice choice-compact ${form.passable === p.key ? 'is-on' : ''}`}>
                    <input type="radio" name="passable" value={p.key} checked={form.passable === p.key} onChange={() => update('passable', p.key)} />
                    <span className="choice-title">{p.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="field">
              <span className="field-label">รายละเอียดเพิ่มเติม <span className="text-muted">(ไม่บังคับ)</span></span>
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => update('note', e.target.value)}
                placeholder="เช่น ท่อระบายน้ำอุดตัน น้ำเริ่มลดแล้ว"
                maxLength={300}
              />
            </label>

            <div className="field">
              <span className="field-label">รูปถ่าย <span className="text-muted">(ไม่บังคับ)</span></span>
              {form.photo ? (
                <div className="photo-preview">
                  <img src={form.photo} alt="รูปจุดน้ำท่วม" />
                  <button type="button" className="btn btn-ghost btn-icon photo-remove" onClick={() => update('photo', null)} aria-label="ลบรูป">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button type="button" className="photo-drop" onClick={() => fileRef.current?.click()}>
                  <ImagePlus size={20} strokeWidth={1.6} />
                  เพิ่มรูปถ่าย
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} />
              {errors.photo && <span className="field-msg is-error">{errors.photo}</span>}
            </div>

            <button type="submit" className="btn btn-primary report-submit">
              <Send size={15} />
              ส่งรายงาน
            </button>

            {notice && (
              <p className={`report-notice ${notice.kind === 'ok' ? 'is-ok' : 'is-warn'}`} role="status">
                <CheckCircle2 size={16} />
                <span>
                  {notice.text}
                  {notice.kind === 'ok' && (
                    <Link to="/map" className="report-notice-link">
                      เปิดแผนที่ <ArrowRight size={13} />
                    </Link>
                  )}
                </span>
              </p>
            )}
          </div>
        </form>

        <section className="mt-xl">
          <div className="section-eyebrow">รายงานล่าสุด</div>
          {reports.length === 0 ? (
            <div className="card empty-state">
              <Droplets size={36} strokeWidth={1.4} />
              <h3>ยังไม่มีรายงาน</h3>
              <p className="text-secondary">รายงานที่ส่งจะแสดงที่นี่และบนแผนที่จราจร</p>
            </div>
          ) : (
            <div className="report-list">
              {reports.map((r) => {
                const level = levelOf(r.level)
                return (
                  <article key={r.id} className="card report-item animate-fadeInUp">
                    {r.photo && <img className="report-photo" src={r.photo} alt={`น้ำท่วม ${r.place}`} />}
                    <div className="report-body">
                      <div className="flex items-center justify-between gap-sm">
                        <span className="report-level" style={{ '--c': SEVERITY_COLOR[level.severity] }}>
                          <span className="choice-dot" /> น้ำ{level.label} · {level.depth}
                        </span>
                        <span className="text-xs text-muted">{timeAgo(r.createdAt)}</span>
                      </div>
                      <h4 className="report-place">{r.place}</h4>
                      <p className="text-sm text-secondary">{passabilityOf(r.passable).label}</p>
                      {r.note && <p className="text-sm text-muted mt-xs">{r.note}</p>}
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon report-delete"
                      onClick={() => removeFloodReport(r.id)}
                      aria-label={`ลบรายงาน ${r.place}`}
                      title="ลบรายงาน"
                    >
                      <Trash2 size={15} />
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
