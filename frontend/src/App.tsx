import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import AreaDetail from '@/pages/AreaDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/area/:slug" element={<AreaDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
