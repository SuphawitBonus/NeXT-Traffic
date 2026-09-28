import { createPersistentStore } from './persistentStore'

export const WATER_LEVELS = [
  { key: 'ankle', label: 'ตาตุ่ม', depth: '~10 ซม.', severity: 'low' },
  { key: 'shin', label: 'ครึ่งแข้ง', depth: '~20 ซม.', severity: 'medium' },
  { key: 'knee', label: 'หัวเข่า', depth: '~40 ซม.', severity: 'high' },
  { key: 'waist', label: 'เอวขึ้นไป', depth: '70 ซม.+', severity: 'severe' },
]

export const PASSABILITY = [
  { key: 'all', label: 'รถผ่านได้ทุกคัน' },
  { key: 'large-only', label: 'รถเล็กผ่านยาก' },
  { key: 'none', label: 'รถผ่านไม่ได้' },
]

export const SEVERITY_COLOR = {
  low: '#6fd39a',
  medium: '#f5c26b',
  high: '#ff9d6b',
  severe: '#ff7b6b',
}

const store = createPersistentStore('nexttraffic:floodReports', [])

export function useFloodReports() {
  return store.useStore()
}

// Returns false when the browser refused to persist (e.g. storage full)
export function addFloodReport(report) {
  const entry = { id: `r${Date.now().toString(36)}`, createdAt: Date.now(), ...report }
  store.set((list) => [entry, ...list])
  try {
    return localStorage.getItem('nexttraffic:floodReports')?.includes(entry.id) ?? false
  } catch {
    return false
  }
}

export function removeFloodReport(id) {
  store.set((list) => list.filter((r) => r.id !== id))
}

export function levelOf(key) {
  return WATER_LEVELS.find((l) => l.key === key) || WATER_LEVELS[0]
}

export function passabilityOf(key) {
  return PASSABILITY.find((p) => p.key === key) || PASSABILITY[0]
}

export function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts)
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'เมื่อสักครู่'
  if (min < 60) return `${min} นาทีที่แล้ว`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} ชม.ที่แล้ว`
  return new Date(ts).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Photos are downscaled before storing so a few reports don't exhaust localStorage
export function downscaleImage(file, maxSize = 640) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('อ่านไฟล์รูปไม่ได้'))
    }
    img.src = url
  })
}
