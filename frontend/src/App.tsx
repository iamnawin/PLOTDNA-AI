import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'

const CmdK = lazy(() => import('@/components/ui/CmdK'))
const Landing = lazy(() => import('@/pages/Landing'))
const Home = lazy(() => import('@/pages/Home'))
const AreaDetail = lazy(() => import('@/pages/AreaDetail'))
const BrochurePage = lazy(() => import('@/pages/BrochurePage'))
const CompareAreas = lazy(() => import('@/pages/CompareAreas'))

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
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
          <Route path="/area/:slug" element={<AreaDetail />} />
          <Route path="/compare" element={<CompareAreas />} />
          <Route path="/brochure" element={<BrochurePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
