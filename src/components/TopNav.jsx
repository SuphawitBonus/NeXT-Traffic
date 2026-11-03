import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ArrowRight, Bell, Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from '../lib/theme'
import { BrandMark } from './Sidebar'
import { NAV_SECTIONS } from './navConfig'
import { useUnreadCount } from '../data/alerts'

function NavGroup({ section, active }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  function openNow() {
    clearTimeout(closeTimer.current)
    setOpen(true)
  }

  // Small grace period so moving diagonally from trigger to menu doesn't close it
  function closeSoon() {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 140)
  }

  return (
    <div
      className={`topnav-group ${open ? 'open' : ''}`}
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          setOpen(false)
          // focus may be on an item that is about to be hidden
          triggerRef.current?.focus()
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`topnav-trigger ${active ? 'active' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        {section.label}
        <ChevronDown size={14} className="topnav-chevron" />
      </button>

      <div className="topnav-menu">
        <div className="topnav-menu-inner">
          {section.items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `topnav-item ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <span className="topnav-item-icon">
                  <Icon size={18} strokeWidth={1.6} />
                </span>
                <span className="topnav-item-text">
                  <span className="topnav-item-label">
                    {item.label}
                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                  </span>
                  <span className="topnav-item-desc">{item.desc}</span>
                </span>
                <ArrowRight size={14} className="topnav-item-arrow" />
              </NavLink>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function TopNav({ onOpenDrawer }) {
  const { pathname } = useLocation()
  const unread = useUnreadCount()
  const { theme, toggle } = useTheme()

  return (
    <header className="topnav">
      <Link to="/dashboard" className="topnav-brand">
        <BrandMark size={28} />
        <span>NextTraffic</span>
      </Link>

      <nav className="topnav-groups" aria-label="เมนูหลัก">
        {NAV_SECTIONS.map((section) => (
          <NavGroup
            key={section.key}
            section={section}
            active={section.items.some((i) => pathname.startsWith(i.path))}
          />
        ))}
      </nav>

      <div className="topnav-right">
        <span className="topnav-live">
          <span className="live-dot" />
          ข้อมูลสด
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-icon topnav-theme"
          onClick={toggle}
          aria-label={theme === 'light' ? 'เปลี่ยนเป็นธีมมืด' : 'เปลี่ยนเป็นธีมสว่าง'}
          title={theme === 'light' ? 'ธีมมืด' : 'ธีมสว่าง'}
        >
          {theme === 'light' ? <Moon size={18} strokeWidth={1.6} /> : <Sun size={18} strokeWidth={1.6} />}
        </button>
        <Link
          to="/alerts"
          className="btn btn-ghost btn-icon topnav-bell"
          aria-label={unread > 0 ? `การแจ้งเตือน (${unread} ยังไม่อ่าน)` : 'การแจ้งเตือน'}
          title={unread > 0 ? `${unread} การแจ้งเตือนใหม่` : 'ไม่มีการแจ้งเตือนใหม่'}
        >
          <Bell size={18} strokeWidth={1.6} />
          {unread > 0 && <span className="topnav-bell-count">{unread}</span>}
        </Link>
        <button className="btn btn-ghost btn-icon topnav-burger" onClick={onOpenDrawer} aria-label="เปิดเมนู">
          <Menu size={20} />
        </button>
      </div>
    </header>
  )
}
