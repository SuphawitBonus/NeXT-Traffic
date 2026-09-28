import { createPersistentStore } from './persistentStore'

export const ALERTS = [
  {
    id: 1,
    type: 'traffic',
    severity: 'warning',
    title: 'จราจรติดขัดหนัก - ถ.สุขุมวิท',
    description: 'ช่วงแยกอโศก-แยกทองหล่อ ขาเข้า ติดขัดมากกว่าปกติ 40%',
    time: '2 นาทีก่อน',
  },
  {
    id: 2,
    type: 'flood',
    severity: 'danger',
    title: 'น้ำท่วมขัง - ถ.พหลโยธิน',
    description: 'น้ำท่วมขังสูง 15 ซม. บริเวณแยกเกษตร หลังฝนตกหนัก',
    time: '10 นาทีก่อน',
  },
  {
    id: 3,
    type: 'accident',
    severity: 'danger',
    title: 'อุบัติเหตุ - ทางด่วนศรีรัช',
    description: 'รถชน 3 คัน กีดขวาง 2 ช่องจราจร ช่วง กม.8 ขาออก',
    time: '25 นาทีก่อน',
  },
  {
    id: 4,
    type: 'traffic',
    severity: 'info',
    title: 'จราจรคล่องตัว - ทางด่วนบูรพาวิถี',
    description: 'สภาพจราจรกลับสู่ปกติแล้ว หลังเคลียร์อุบัติเหตุเสร็จ',
    time: '45 นาทีก่อน',
  },
  {
    id: 5,
    type: 'flood',
    severity: 'warning',
    title: 'เฝ้าระวังน้ำ - คลองเปรมประชากร',
    description: 'ระดับน้ำใกล้ล้นตลิ่ง สูง 1.95 ม. (ล้นที่ 2.0 ม.)',
    time: '1 ชม.ก่อน',
  },
]

// Alerts 3-5 start as already read, matching the original mock data
const readStore = createPersistentStore('nexttraffic:readAlerts', [3, 4, 5])

export function useReadAlertIds() {
  return readStore.useStore()
}

export function useUnreadCount() {
  const read = readStore.useStore()
  return ALERTS.filter((a) => !read.includes(a.id)).length
}

export function markAlertRead(id) {
  readStore.set((ids) => (ids.includes(id) ? ids : [...ids, id]))
}

export function markAllAlertsRead() {
  readStore.set(ALERTS.map((a) => a.id))
}
