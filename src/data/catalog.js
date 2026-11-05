import { Camera, Eye, Droplets, MapPin, AlertTriangle, FlaskConical, Car, House, Landmark, GraduationCap } from 'lucide-react'

// What each dataset in the app can and cannot tell you. Keep the "notShows"
// lines blunt: they are the reason this page exists.

export const CATEGORIES = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'move', label: 'การเดินทาง' },
  { key: 'water', label: 'น้ำ' },
  { key: 'safety', label: 'ความปลอดภัย' },
]

export const STATUS = {
  live: { label: 'สด', badge: 'badge-green' },
  periodic: { label: 'รายเดือน', badge: 'badge-blue' },
  device: { label: 'ในเครื่องคุณ', badge: 'badge-neutral' },
  mock: { label: 'ข้อมูลจำลอง', badge: 'badge-yellow' },
}

export const DATASETS = [
  {
    id: 'cctv',
    icon: Camera,
    name: 'กล้อง CCTV จราจรสด',
    category: 'move',
    status: 'live',
    summary: 'ภาพวิดีโอสดจากกล้องตามแยกและถนนสายหลักในกรุงเทพฯ',
    freshness: 'ภาพสด ณ ตอนที่เปิดดู',
    coverage: 'กรุงเทพฯ เฉพาะกล้องที่มีสตรีม HLS',
    shows: ['สภาพถนนจริงตอนนี้ ณ จุดที่มีกล้อง', 'ฝนตก น้ำขัง หรือรถติดที่มองเห็นได้ด้วยตา'],
    notShows: [
      'ไม่ใช่ตัวเลขความเร็วหรือระดับการติดขัด ต้องดูภาพแล้วตัดสินเอง',
      'กล้องบางตัวดับหรือภาพค้างได้ เราไม่ได้ตรวจสถานะกล้องล่วงหน้า',
    ],
    questions: ['แยกอโศกตอนนี้รถเยอะไหม', 'ถนนหน้าออฟฟิศมีน้ำขังหรือยัง'],
    source: { label: 'Longdo Traffic / มูลนิธิ ITIC', url: 'https://traffic.longdo.com/' },
    open: { path: '/map?layers=cameras', label: 'เปิดบนแผนที่' },
  },
  {
    id: 'ai-count',
    icon: Eye,
    name: 'นับรถด้วย AI',
    category: 'move',
    status: 'device',
    summary: 'นับรถยนต์ มอเตอร์ไซค์ และรถบรรทุก/รถบัสในภาพกล้องสด ประมวลผลในเบราว์เซอร์ของคุณ',
    freshness: 'นับใหม่ทุกไม่กี่วินาทีขณะเปิดกล้อง',
    coverage: 'กล้องที่คุณกำลังดูอยู่ทีละตัว',
    shows: ['จำนวนรถแต่ละประเภทที่โมเดลมองเห็นในเฟรมตอนนี้', 'ภาพไม่ถูกส่งออกจากเครื่องคุณ'],
    notShows: [
      'นับเฉพาะรถที่เห็นในเฟรม รถที่บังกัน อยู่ไกล หรือถ่ายตอนกลางคืนจะตกหล่น',
      'ไม่ใช่ปริมาณจราจรต่อชั่วโมง และไม่มีการเก็บตัวเลขย้อนหลัง',
    ],
    questions: ['ตอนนี้แยกนี้มีมอเตอร์ไซค์มากกว่ารถยนต์ไหม'],
    source: { label: 'TensorFlow.js · โมเดล COCO-SSD', url: 'https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd' },
    open: { path: '/camera-ai', label: 'เปิดกล้อง AI' },
  },
  {
    id: 'water',
    icon: Droplets,
    name: 'ระดับน้ำแม่น้ำและคลอง',
    category: 'water',
    status: 'live',
    summary: 'ระดับน้ำจากสถานีโทรมาตร เทียบกับระดับตลิ่ง พร้อมแนวโน้มขึ้นหรือลง',
    freshness: 'ดึงใหม่ทุก 10 นาที',
    coverage: 'กรุงเทพฯ นนทบุรี ปทุมธานี สมุทรปราการ สมุทรสาคร นครปฐม',
    shows: ['ระดับน้ำเป็น % ของตลิ่ง (100% = ถึงตลิ่ง)', 'น้ำขึ้นหรือลงเท่าไรจากการวัดครั้งก่อน'],
    notShows: [
      'ระดับน้ำในคลองไม่ใช่น้ำท่วมบนถนน ถนนท่วมจากฝนระบายไม่ทันได้แม้คลองยังต่ำ',
      'เป็นค่าที่วัดล่าสุด ไม่ใช่การพยากรณ์ล่วงหน้า',
    ],
    questions: ['คลองใกล้บ้านใกล้ล้นตลิ่งหรือยัง', 'สถานีไหนน้ำกำลังขึ้น'],
    source: { label: 'ThaiWater (สสน.)', url: 'https://www.thaiwater.net/' },
    open: { path: '/water-forecast', label: 'ดูระดับน้ำ' },
  },
  {
    id: 'flood-reports',
    icon: MapPin,
    name: 'จุดน้ำท่วมที่คุณแจ้ง',
    category: 'water',
    status: 'device',
    summary: 'จุดน้ำท่วมที่แจ้งผ่านหน้า "แจ้งน้ำท่วม" พร้อมความลึกโดยประมาณ รถผ่านได้ไหม และรูปถ่าย',
    freshness: 'ทันทีที่แจ้ง',
    coverage: 'เฉพาะจุดที่แจ้งจากเบราว์เซอร์นี้',
    shows: ['ตำแหน่งบนแผนที่ ความลึก (ตาตุ่มถึงเอว) และรถผ่านได้หรือไม่'],
    notShows: [
      'เก็บไว้ในเบราว์เซอร์นี้เท่านั้น ยังไม่ส่งขึ้นเซิร์ฟเวอร์ คนอื่นจึงไม่เห็นรายงานของคุณ',
      'ความลึกเป็นการกะด้วยตาของผู้แจ้ง ไม่ใช่ค่าที่วัด',
    ],
    questions: ['จุดที่ฉันเจอน้ำท่วมเมื่อเช้าอยู่ตรงไหนบ้าง'],
    source: { label: 'ผู้ใช้ NextTraffic', url: null },
    open: { path: '/map?layers=reports,cameras', label: 'เปิดบนแผนที่' },
  },
  {
    id: 'road-deaths',
    icon: AlertTriangle,
    name: 'ผู้เสียชีวิตจากอุบัติเหตุทางถนน',
    category: 'safety',
    status: 'periodic',
    summary: 'ผู้เสียชีวิตในกรุงเทพฯ รายเดือนและรายเขต แยกตามพาหนะ เพศ และอายุ เทียบกับช่วงเดียวกันปีก่อน',
    freshness: 'ออกรายเดือน ล่าช้าหลายเดือน',
    coverage: 'กรุงเทพฯ ตามเขตที่เกิดเหตุ',
    shows: ['เขตไหนมีผู้เสียชีวิตมาก', 'สัดส่วนผู้ใช้รถจักรยานยนต์ เพศ และอายุกลาง', 'แนวโน้มเทียบปีก่อน'],
    notShows: [
      'นับเฉพาะผู้เสียชีวิต ไม่รวมผู้บาดเจ็บหรือจำนวนครั้งที่เกิดเหตุ',
      'มีพิกัดเพียงบางราย จึงยังชี้จุดเสี่ยงระดับทางแยกไม่ได้',
      'ถ้าดึงข้อมูลใหม่ไม่ได้ หน้าเว็บจะใช้ชุดที่บันทึกไว้และขึ้นป้ายบอก',
    ],
    questions: ['เขตไหนมีผู้เสียชีวิตบนถนนมากที่สุดปีนี้', 'ปีนี้มากกว่าปีก่อนไหม'],
    source: { label: 'data.go.th · RTDDI กรมควบคุมโรค', url: 'https://data.go.th/' },
    open: { path: '/accidents', label: 'ดูสถิติอุบัติเหตุ' },
  },
  {
    id: 'mock',
    icon: FlaskConical,
    name: 'ข้อมูลจำลองสำหรับต้นแบบ',
    category: 'move',
    status: 'mock',
    summary: 'คะแนนจราจรทั้งเมือง วงสีจราจรบนแผนที่ จุดเฝ้าระวังน้ำบนแผนที่ และรายการแจ้งเตือน',
    freshness: 'ไม่อัปเดต ตัวเลขตายตัว',
    coverage: 'ตัวอย่างเท่านั้น',
    shows: ['หน้าตาของหน้าจอเมื่อเชื่อมแหล่งข้อมูลจริงแล้ว'],
    notShows: ['ไม่ได้มาจากเซนเซอร์ GPS หรือหน่วยงานใด อย่าใช้ตัดสินใจเดินทาง'],
    questions: [],
    source: { label: 'สร้างขึ้นเพื่อสาธิต', url: null },
    open: { path: '/dashboard', label: 'ดูภาพรวม' },
  },
]

export const DATASET_BY_ID = Object.fromEntries(DATASETS.map((d) => [d.id, d]))

export const AUDIENCES = [
  {
    key: 'commuter',
    icon: Car,
    label: 'คนเดินทางทุกวัน',
    decisions: [
      { q: 'ถนนที่จะผ่านตอนนี้รถติดหรือน้ำขังไหม', uses: ['cctv'], path: '/map?layers=cameras', cta: 'เปิดแผนที่กล้อง' },
      { q: 'แยกนี้มีรถมากแค่ไหน เทียบรถยนต์กับมอเตอร์ไซค์', uses: ['cctv', 'ai-count'], path: '/camera-ai', cta: 'เปิดกล้อง AI' },
    ],
  },
  {
    key: 'resident',
    icon: House,
    label: 'คนบ้านริมน้ำ',
    decisions: [
      { q: 'แม่น้ำหรือคลองใกล้บ้านใกล้ล้นตลิ่งหรือยัง', uses: ['water'], path: '/water-forecast', cta: 'ดูระดับน้ำ' },
      { q: 'จดจุดน้ำท่วมที่เจอไว้บนแผนที่', uses: ['flood-reports'], path: '/report-flood', cta: 'แจ้งน้ำท่วม' },
    ],
  },
  {
    key: 'officer',
    icon: Landmark,
    label: 'เจ้าหน้าที่เขตและหน่วยงาน',
    decisions: [
      { q: 'เขตไหนควรได้มาตรการลดอุบัติเหตุก่อน', uses: ['road-deaths'], path: '/accidents', cta: 'ดูสถิติรายเขต' },
      { q: 'สถานีวัดน้ำไหนต้องเฝ้าระวังตอนนี้', uses: ['water'], path: '/water-forecast', cta: 'ดูระดับน้ำ' },
    ],
  },
  {
    key: 'research',
    icon: GraduationCap,
    label: 'นักวิจัยและสื่อ',
    decisions: [
      { q: 'ผู้เสียชีวิตบนถนนเป็นใคร ใช้พาหนะอะไร อายุเท่าไร', uses: ['road-deaths'], path: '/accidents', cta: 'ดูสถิติอุบัติเหตุ' },
      { q: 'ถามข้อมูลเหล่านี้เป็นภาษาพูด', uses: ['water', 'road-deaths'], path: '/ask-ai', cta: 'ถาม AI' },
    ],
  },
]
