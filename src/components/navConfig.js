import {
  LayoutDashboard,
  Map,
  Compass,
  Eye,
  MonitorPlay,
  Droplets,
  AlertTriangle,
  Bell,
  Bot,
  Camera,
  Users,
} from 'lucide-react'

export const NAV_SECTIONS = [
  {
    key: 'overview',
    label: 'ภาพรวม',
    items: [
      { icon: LayoutDashboard, label: 'ภาพรวมจราจร', desc: 'ภาพรวมจราจรทั้งเมืองแบบสด', path: '/dashboard' },
      { icon: Map, label: 'แผนที่จราจร', desc: 'แผนที่จราจร กล้อง และจุดน้ำท่วม', path: '/map' },
      { icon: Compass, label: 'สำรวจข้อมูล', desc: 'เริ่มจากคำถาม ดูว่าข้อมูลไหนตอบได้', path: '/explore' },
    ],
  },
  {
    key: 'cameras',
    label: 'กล้อง & AI',
    items: [
      { icon: Eye, label: 'กล้อง AI', desc: 'ดูกล้องสดและ AI นับรถ', path: '/camera-ai' },
      { icon: MonitorPlay, label: 'กล้องของฉัน', desc: 'กล้องที่บันทึกไว้', path: '/my-cameras' },
    ],
  },
  {
    key: 'city',
    label: 'เฝ้าระวังเมือง',
    items: [
      { icon: Droplets, label: 'พยากรณ์น้ำ', desc: 'ระดับน้ำและถนนน้ำท่วม', path: '/water-forecast' },
      { icon: AlertTriangle, label: 'อุบัติเหตุและจุดเสี่ยง', desc: 'สถิติอุบัติเหตุ Black Spot และมาตรการ', path: '/accidents' },
      { icon: Bell, label: 'การแจ้งเตือน', desc: 'การแจ้งเตือนล่าสุด', path: '/alerts' },
    ],
  },
  {
    key: 'tools',
    label: 'เครื่องมือ',
    items: [
      { icon: Bot, label: 'ถาม AI', desc: 'ถามเรื่องจราจรกับ AI', path: '/ask-ai', badge: 'ทำงาน' },
      { icon: Camera, label: 'แจ้งน้ำท่วม', desc: 'แจ้งจุดน้ำท่วมขัง', path: '/report-flood' },
      { icon: Users, label: 'ผู้เข้าชม', desc: 'สถิติผู้ใช้งาน', path: '/visitors' },
    ],
  },
]
