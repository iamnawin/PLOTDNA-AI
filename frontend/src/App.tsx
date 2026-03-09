import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import AreaDetail from '@/pages/AreaDetail'
import CmdK from '@/components/ui/CmdK'

export default function App() {
  return (
    <BrowserRouter>
      {/* CmdK is global — works on every page */}
      <CmdK />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/area/:slug" element={<AreaDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
