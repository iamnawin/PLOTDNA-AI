import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from '@/pages/Landing'
import Home from '@/pages/Home'
import AreaDetail from '@/pages/AreaDetail'
import BrochurePage from '@/pages/BrochurePage'
import CmdK from '@/components/ui/CmdK'

export default function App() {
  return (
    <BrowserRouter>
      {/* CmdK is global — works on every page */}
      <CmdK />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/map" element={<Home />} />
        <Route path="/area/:slug" element={<AreaDetail />} />
        <Route path="/brochure" element={<BrochurePage />} />
      </Routes>
    </BrowserRouter>
  )
}
