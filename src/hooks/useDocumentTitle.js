import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { NAV_SECTIONS } from '../components/navConfig'

const DEFAULT_TITLE = 'NextTraffic — Bangkok Traffic Analytics'
const LABELS = Object.fromEntries(NAV_SECTIONS.flatMap((s) => s.items.map((i) => [i.path, i.label])))

export default function useDocumentTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const label = LABELS[pathname]
    document.title = label ? `${label} · NextTraffic` : DEFAULT_TITLE
  }, [pathname])
}
