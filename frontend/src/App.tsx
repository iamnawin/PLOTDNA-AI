import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const CmdK = lazy(() => import('@/components/ui/CmdK'))
const Landing = lazy(() => import('@/pages/Landing'))
const Home = lazy(() => import('@/pages/Home'))
const AreaDetail = lazy(() => import('@/pages/AreaDetail'))
const BrochurePage = lazy(() => import('@/pages/BrochurePage'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-[#060814]" />}>
        <CmdK />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/map" element={<Home />} />
          <Route path="/area/:slug" element={<AreaDetail />} />
          <Route path="/brochure" element={<BrochurePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
