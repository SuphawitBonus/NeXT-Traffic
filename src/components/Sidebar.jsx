import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { NAV_SECTIONS } from './navConfig'

export function BrandMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="11.5" stroke="currentColor" strokeOpacity="0.35" />
      <circle cx="16" cy="16" r="6.5" stroke="currentColor" strokeOpacity="0.7" />
      <circle cx="16" cy="16" r="2.25" fill="currentColor" />
      <circle cx="25.5" cy="9.5" r="1.75" fill="#b3feef" />
    </svg>
  )
}

// Slide-in drawer used on small screens; desktop navigation lives in TopNav
export default function Sidebar({ open = false, onNavigate }) {
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onNavigate?.()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
  }, [open, onNavigate])

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} inert={!open}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <BrandMark />
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">NextTraffic</div>
          <p>วิเคราะห์จราจรกรุงเทพฯ</p>
        </div>
        <button ref={closeRef} className="btn btn-ghost btn-icon sidebar-close" onClick={onNavigate} aria-label="ปิดเมนู">
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.key}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon className="nav-icon" size={18} strokeWidth={1.6} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="live-dot" />
        ข้อมูลสด · กรุงเทพมหานคร
      </div>
    </aside>
  )
}
