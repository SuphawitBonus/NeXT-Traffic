import { useState } from 'react'
import { Bell, Circle, CheckCircle2, AlertTriangle, Droplets, Car } from 'lucide-react'
import { ALERTS, useReadAlertIds, useUnreadCount, markAlertRead, markAllAlertsRead } from '../data/alerts'
import './Alerts.css'

const FILTERS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'traffic', label: 'จราจร' },
  { key: 'flood', label: 'น้ำท่วม' },
  { key: 'accident', label: 'อุบัติเหตุ' },
]

function getAlertIcon(type) {
  switch (type) {
    case 'traffic': return <Car size={16} />
    case 'flood': return <Droplets size={16} />
    case 'accident': return <AlertTriangle size={16} />
    default: return <Bell size={16} />
  }
}

function getSeverityBadge(severity) {
  switch (severity) {
    case 'danger': return 'badge-red'
    case 'warning': return 'badge-orange'
    default: return 'badge-blue'
  }
}

export default function Alerts() {
  const [filter, setFilter] = useState('all')
  const readIds = useReadAlertIds()
  const unreadCount = useUnreadCount()

  const filtered = filter === 'all' ? ALERTS : ALERTS.filter((a) => a.type === filter)

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>การแจ้งเตือน</h1>
          <p>การแจ้งเตือนจราจร น้ำท่วม อุบัติเหตุ แบบเรียลไทม์</p>
        </div>
        <div className="page-header-right">
          {unreadCount > 0 && <span className="badge badge-red">{unreadCount} ใหม่</span>}
          <button
            className="btn btn-outline btn-sm"
            onClick={markAllAlertsRead}
            disabled={unreadCount === 0}
          >
            <CheckCircle2 size={14} />
            อ่านทั้งหมด
          </button>
        </div>
      </div>

      <div className="page-body p-xl">
        <div className="alerts-filter">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`btn ${filter === f.key ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="alerts-list">
          {filtered.map((alert, i) => {
            const read = readIds.includes(alert.id)
            return (
              <div
                key={alert.id}
                className={`alert-item ${!read ? 'alert-unread' : ''} animate-fadeInUp`}
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => markAlertRead(alert.id)}
              >
                <div className={`alert-icon-wrap alert-${alert.severity}`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="alert-content">
                  <div className="flex items-center gap-sm">
                    <span className="fw-medium">{alert.title}</span>
                    <span className={`badge ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity === 'danger' ? 'ด่วน' : alert.severity === 'warning' ? 'เตือน' : 'ข้อมูล'}
                    </span>
                  </div>
                  <p className="text-sm text-secondary mt-xs">{alert.description}</p>
                </div>
                <div className="alert-meta">
                  <span className="text-xs text-muted">{alert.time}</span>
                  {!read && <Circle size={8} fill="var(--accent-blue)" color="var(--accent-blue)" />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
