import { useState, useCallback, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopNav from './components/TopNav'
import useCursorSpotlight from './hooks/useCursorSpotlight'
import useDocumentTitle from './hooks/useDocumentTitle'

const TrafficDashboard = lazy(() => import('./pages/TrafficDashboard'))
const TrafficMap = lazy(() => import('./pages/TrafficMap'))
const CameraAI = lazy(() => import('./pages/CameraAI'))
const WaterForecast = lazy(() => import('./pages/WaterForecast'))
const AccidentsRisk = lazy(() => import('./pages/AccidentsRisk'))
const Alerts = lazy(() => import('./pages/Alerts'))
const MyCameras = lazy(() => import('./pages/MyCameras'))
const ReportFlood = lazy(() => import('./pages/ReportFlood'))
const AskAI = lazy(() => import('./pages/AskAI'))
const Explore = lazy(() => import('./pages/Explore'))
const ComingSoon = lazy(() => import('./pages/ComingSoon'))

const UPCOMING = [
  { path: '/visitors', title: 'ผู้เข้าชม', description: 'สถิติผู้ใช้งานระบบ NextTraffic' },
]

function App() {
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = useCallback(() => setNavOpen(false), [])
  useCursorSpotlight()
  useDocumentTitle()

  return (
    <>
      <TopNav onOpenDrawer={() => setNavOpen(true)} />
      <div className={`sidebar-backdrop ${navOpen ? 'open' : ''}`} onClick={closeNav} />
      <Sidebar open={navOpen} onNavigate={closeNav} />
      <main className="main-content">
        <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<Navigate to="/explore" replace />} />
            <Route path="/dashboard" element={<TrafficDashboard />} />
            <Route path="/map" element={<TrafficMap />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/camera-ai" element={<CameraAI />} />
            <Route path="/water-forecast" element={<WaterForecast />} />
            <Route path="/accidents" element={<AccidentsRisk />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/my-cameras" element={<MyCameras />} />
            <Route path="/report-flood" element={<ReportFlood />} />
            <Route path="/ask-ai" element={<AskAI />} />
            {UPCOMING.map((p) => (
              <Route key={p.path} path={p.path} element={<ComingSoon title={p.title} description={p.description} />} />
            ))}
            <Route path="*" element={<Navigate to="/explore" replace />} />
          </Routes>
        </Suspense>
      </main>
    </>
  )
}

export default App
