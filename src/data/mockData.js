// Mock data for the Bangkok Traffic system
// Will be replaced with real API calls later

export const BANGKOK_CENTER = [13.7563, 100.5018]

export const TRAFFIC_SCORE = {
  score: 72,
  max: 100,
  redPercent: 8,
  label: 'ปานกลาง',
  description: 'มีจุดชะลอตัวบางช่วง เพิ่มเวลาเดินทาง',
  changeFromLastHour: '+5 จุด จาก 1 ชม.ก่อน',
  changeDirection: 'up',
  lastUpdate: new Date().toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }),
}

export const DASHBOARD_STATS = [
  {
    id: 'traffic',
    icon: '≡',
    title: 'จราจรทั้งเมือง',
    value: 'ชะลอตัว',
    valueColor: 'var(--accent-primary)',
    status: 'warning',
    detailPath: '/map',
  },
  {
    id: 'weather',
    icon: '🌡',
    title: 'อากาศ กทม.',
    value: '28°C ฝนตกเบา',
    valueColor: 'var(--accent-orange)',
    status: 'ok',
    detailPath: null,
  },
  {
    id: 'water',
    icon: '💧',
    title: 'ฝนและน้ำ',
    value: 'น้ำท่วมขัง 6 จุด',
    valueColor: 'var(--accent-red)',
    status: 'danger',
    detailPath: '/water-forecast',
  },
  {
    id: 'flood-reports',
    icon: '🏠',
    title: 'การแจ้งน้ำท่วม',
    value: '321 เคส',
    valueColor: 'var(--accent-red)',
    status: 'danger',
    detailPath: '/report-flood',
  },
  {
    id: 'pm25',
    icon: '🌫',
    title: 'ฝุ่น PM2.5',
    value: 'อากาศดีมาก',
    valueColor: 'var(--accent-green)',
    status: 'ok',
    detailPath: null,
  },
  {
    id: 'accidents',
    icon: '⚠',
    title: 'เหตุการณ์บนถนน',
    value: '4 เหตุการณ์',
    valueColor: 'var(--accent-orange)',
    status: 'warning',
    detailPath: '/accidents',
  },
]

export const CCTV_CAMERAS = [
  {
    id: 1,
    name: 'แยกราชประสงค์',
    lat: 13.7465,
    lng: 100.5395,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'heavy',
    vehicleCount: 45,
    imageUrl: null,
  },
  {
    id: 2,
    name: 'แยกอโศก',
    lat: 13.7377,
    lng: 100.5602,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'moderate',
    vehicleCount: 28,
    imageUrl: null,
  },
  {
    id: 3,
    name: 'แยกสะพานควาย',
    lat: 13.7939,
    lng: 100.5497,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'light',
    vehicleCount: 12,
    imageUrl: null,
  },
  {
    id: 4,
    name: 'แยกพระราม 4-สีลม',
    lat: 13.7265,
    lng: 100.5343,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'heavy',
    vehicleCount: 52,
    imageUrl: null,
  },
  {
    id: 5,
    name: 'อนุสาวรีย์ชัยฯ',
    lat: 13.7649,
    lng: 100.5382,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'heavy',
    vehicleCount: 60,
    imageUrl: null,
  },
  {
    id: 6,
    name: 'แยกลาดพร้าว',
    lat: 13.8084,
    lng: 100.5617,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'moderate',
    vehicleCount: 35,
    imageUrl: null,
  },
  {
    id: 7,
    name: 'แยกบางนา',
    lat: 13.6652,
    lng: 100.5991,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'light',
    vehicleCount: 18,
    imageUrl: null,
  },
  {
    id: 8,
    name: 'แยกรัชดา-ลาดพร้าว',
    lat: 13.7975,
    lng: 100.5743,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'moderate',
    vehicleCount: 30,
    imageUrl: null,
  },
  {
    id: 9,
    name: 'สะพานพระราม 8',
    lat: 13.7626,
    lng: 100.4922,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'light',
    vehicleCount: 15,
    imageUrl: null,
  },
  {
    id: 10,
    name: 'แยกประชานิเวศน์',
    lat: 13.8493,
    lng: 100.5272,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'light',
    vehicleCount: 10,
    imageUrl: null,
  },
  {
    id: 11,
    name: 'แยกสาทร',
    lat: 13.7205,
    lng: 100.5254,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'heavy',
    vehicleCount: 48,
    imageUrl: null,
  },
  {
    id: 12,
    name: 'แยกเกษตร',
    lat: 13.8472,
    lng: 100.5735,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'moderate',
    vehicleCount: 25,
    imageUrl: null,
  },
  {
    id: 13,
    name: 'แยกพัฒนาการ',
    lat: 13.7115,
    lng: 100.6351,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'light',
    vehicleCount: 20,
    imageUrl: null,
  },
  {
    id: 14,
    name: 'แยกดินแดง',
    lat: 13.7612,
    lng: 100.5507,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'moderate',
    vehicleCount: 32,
    imageUrl: null,
  },
  {
    id: 15,
    name: 'แยกสุทธิสาร',
    lat: 13.7889,
    lng: 100.5741,
    district: 'กรุงเทพมหานคร',
    status: 'online',
    trafficLevel: 'light',
    vehicleCount: 14,
    imageUrl: null,
  },
]

export const ROAD_DATA = [
  { name: 'ถ.สุขุมวิท', score: 35, status: 'ติดขัด', vehicles: 1250 },
  { name: 'ถ.พหลโยธิน', score: 52, status: 'ปานกลาง', vehicles: 980 },
  { name: 'ถ.รัชดาภิเษก', score: 45, status: 'ปานกลาง', vehicles: 1100 },
  { name: 'ถ.วิภาวดีฯ', score: 68, status: 'คล่องตัว', vehicles: 750 },
  { name: 'ถ.เพชรบุรี', score: 30, status: 'ติดขัด', vehicles: 1320 },
  { name: 'ถ.พระราม 4', score: 42, status: 'ปานกลาง', vehicles: 890 },
  { name: 'ถ.สาทร', score: 28, status: 'ติดขัด', vehicles: 1400 },
  { name: 'ถ.ศรีนครินทร์', score: 75, status: 'คล่องตัว', vehicles: 620 },
]

// Simulated flood monitoring points
export const FLOOD_POINTS = [
  { id: 1, name: 'คลองเปรมประชากร', lat: 13.8120, lng: 100.5230, level: 'ล้น', waterLevel: 2.1 },
  { id: 2, name: 'คลองลาดพร้าว', lat: 13.8000, lng: 100.5800, level: 'เฝ้าระวัง', waterLevel: 1.5 },
  { id: 3, name: 'คลองแสนแสบ', lat: 13.7500, lng: 100.6000, level: 'ปกติ', waterLevel: 0.8 },
  { id: 4, name: 'คลองบางซื่อ', lat: 13.8200, lng: 100.5300, level: 'ล้น', waterLevel: 2.3 },
]

// Traffic data by time of day (for charts)
export const TRAFFIC_HOURLY = Array.from({ length: 24 }, (_, i) => {
  const hour = i
  let score
  if (hour >= 7 && hour <= 9) score = 35 + Math.random() * 20
  else if (hour >= 16 && hour <= 19) score = 30 + Math.random() * 25
  else if (hour >= 0 && hour <= 5) score = 85 + Math.random() * 10
  else score = 55 + Math.random() * 20
  return {
    hour: `${hour.toString().padStart(2, '0')}:00`,
    score: Math.round(score),
  }
})

// Accident data
export const ACCIDENT_STATS = {
  deathsToday: 1,
  deathsYTD: 412,
  injuredToday: 89,
  injuredYTD: 98520,
  hotspots: 8,
  highRiskDistrict: 'หนองจอก',
}

// District-level accident data
export const DISTRICT_ACCIDENTS = [
  { name: 'หนองจอก', deaths: 35, injured: 1483 },
  { name: 'ลาดกระบัง', deaths: 31, injured: 3718 },
  { name: 'คลองสามวา', deaths: 27, injured: 1820 },
  { name: 'จตุจักร', deaths: 25, injured: 4796 },
  { name: 'ดินแดง', deaths: 22, injured: 3250 },
]

// Water level stations
export const WATER_STATIONS = {
  overflowing: 6,
  total: 28,
  nearOverflow: 4,
  tideLevel: '1.05 ม.',
  tideLocation: 'สันดอนเจ้าพระยา',
  tideTime: '18:00 น.',
  floodedRoads: 6,
  totalSensors: 107,
  canalHigh: { count: 32, total: 274 },
}

// Online users
export const ONLINE_USERS = 12

// BTS/MRT stations for map overlay
export const RAIL_STATIONS = [
  { name: 'สยาม', lat: 13.7454, lng: 100.5345, line: 'BTS' },
  { name: 'อโศก', lat: 13.7368, lng: 100.5601, line: 'BTS/MRT' },
  { name: 'ชิดลม', lat: 13.7440, lng: 100.5430, line: 'BTS' },
  { name: 'พร้อมพงษ์', lat: 13.7300, lng: 100.5696, line: 'BTS' },
  { name: 'หมอชิต', lat: 13.8025, lng: 100.5536, line: 'BTS/MRT' },
  { name: 'สะพานควาย', lat: 13.7939, lng: 100.5497, line: 'BTS' },
  { name: 'พญาไท', lat: 13.7566, lng: 100.5343, line: 'BTS/ARL' },
  { name: 'วงเวียนใหญ่', lat: 13.7245, lng: 100.5053, line: 'BTS' },
]
