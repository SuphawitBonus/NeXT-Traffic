import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function ComingSoon({ title, description }) {
  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      <div className="page-body p-xl">
        <div className="card empty-state animate-fadeIn">
          <Sparkles size={40} strokeWidth={1.4} />
          <h3>กำลังพัฒนา</h3>
          <p className="text-secondary">หน้านี้ยังไม่เปิดใช้งาน ระหว่างนี้ดูภาพรวมจราจรหรือกล้องสดได้ก่อน</p>
          <div className="flex gap-sm mt-base flex-wrap justify-center">
            <Link to="/dashboard" className="btn btn-primary">
              ไปที่ Dashboard
              <ArrowRight size={16} />
            </Link>
            <Link to="/camera-ai" className="btn btn-outline">ดูกล้องสด</Link>
          </div>
        </div>
      </div>
    </>
  )
}
