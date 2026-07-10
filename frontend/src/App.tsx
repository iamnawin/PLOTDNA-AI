import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { buildAreaStoryPath } from '@/features/areaStory/areaStoryNav'
import { findLandDnaCardMatch } from '@/lib/landDnaCard'

const CmdK = lazy(() => import('@/components/ui/CmdK'))
const Landing = lazy(() => import('@/pages/Landing'))
const Home = lazy(() => import('@/pages/Home'))
const BrochurePage = lazy(() => import('@/pages/BrochurePage'))
const AreaStoryShell = lazy(() => import('@/features/areaStory/AreaStoryShell'))

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function LegacyAreaRedirect() {
  const { slug } = useParams<{ slug: string }>()
  if (!slug) return <Navigate to="/map" replace />
  return <Navigate to={buildAreaStoryPath(slug, 'verdict')} replace />
}

function LegacyCardRedirect() {
  const { shareSlug } = useParams<{ shareSlug: string }>()
  const match = findLandDnaCardMatch(shareSlug)
  if (!match) return <Navigate to="/map" replace />
  return <Navigate to={buildAreaStoryPath(match.area.slug, 'pass')} replace />
}

function LegacyCompareRedirect() {
  return <Navigate to="/map" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-[#060814]" />}>
        <ScrollToTop />
        <CmdK />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/map" element={<Home />} />
          <Route path="/area/:slug/:step" element={<AreaStoryShell />} />
          <Route path="/area/:slug" element={<LegacyAreaRedirect />} />
          <Route path="/card/:shareSlug" element={<LegacyCardRedirect />} />
          <Route path="/c/:shareSlug" element={<LegacyCardRedirect />} />
          <Route path="/compare" element={<LegacyCompareRedirect />} />
          <Route path="/brochure" element={<BrochurePage />} />
        </Routes>
        <Analytics />
      </Suspense>
    </BrowserRouter>
  )
}
