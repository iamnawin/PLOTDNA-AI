/**
 * BrochurePage — Standalone brochure analysis tool (/brochure).
 * Drag & drop any property brochure PDF or image → AI extraction
 * + AVM estimate + RERA verification + hidden clause detection.
 */
import { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Upload, FileText, Sparkles, AlertTriangle,
  CheckCircle2, MapPin, Shield, Calendar, IndianRupee,
  Percent, X, ExternalLink, ChevronDown, ChevronUp, Map,
} from 'lucide-react'

interface BrochureResult {
  project_name?: string
  plot_area?: string
  carpet_area?: string
  loading_pct?: number
  rera_number?: string
  rera_state?: string
  lat?: number
  lng?: number
  possession_date?: string
  price_per_sqft?: number
  total_price?: number
  currency?: string
  hidden_clauses?: string[]
  confidence?: number
  source?: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 10

function buildReraUrl(state: string | undefined, rera: string): string {
  const s = (state ?? '').toLowerCase()
  if (s.includes('telangana') || s.includes('ts')) return `https://rera.telangana.gov.in/reraHome/searchProject.do?reraNumber=${rera}`
  if (s.includes('karnataka') || s.includes('ka')) return `https://rera.karnataka.gov.in/searchProjects?reraNumber=${rera}`
  if (s.includes('maharashtra') || s.includes('mh')) return `https://maharera.mahaonline.gov.in/Registrations/SearchForProjectorAgent?searchText=${rera}`
  if (s.includes('delhi') || s.includes('dl')) return `https://rera.delhi.gov.in/rera/SearchProject?regNo=${rera}`
  return `https://www.google.com/search?q=RERA+${rera}`
}

export default function BrochurePage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BrochureResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAllClauses, setShowAllClauses] = useState(false)

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setShowAllClauses(false)
  }

  const analyze = useCallback(async (f: File) => {
    if (!ACCEPTED.includes(f.type)) {
      setError('Only PDF, JPEG, PNG, or WebP files are supported.')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File too large — max ${MAX_MB} MB.`)
      return
    }
    setFile(f)
    setLoading(true)
    setResult(null)
    setError(null)

    const form = new FormData()
    form.append('file', f)
    try {
      const res = await fetch(`${API_BASE}/api/v1/analyze-brochure`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setResult(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed — ensure the FastAPI backend is running.')
    } finally {
      setLoading(false)
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) analyze(f)
  }, [analyze])

  const confidence = result?.confidence ?? 0
  const confColor = confidence >= 80 ? '#10b981' : confidence >= 60 ? '#f59e0b' : '#ef4444'
  const clauses = result?.hidden_clauses ?? []
  const displayClauses = showAllClauses ? clauses : clauses.slice(0, 4)
  const currency = result?.currency === 'AED' ? 'AED' : '₹'

  return (
    <div className="min-h-screen bg-[#050508] text-[#e8e8f0]">

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 h-13"
        style={{ background: 'rgba(5,5,10,0.96)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#666680] hover:text-[#e8e8f0] transition-colors text-sm font-mono"
        >
          <ArrowLeft size={15} />
          Back to Map
        </button>

        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00e676, #00b36b)' }}
          >
            <span className="text-black font-black text-[10px]">P</span>
          </div>
          <span className="font-display font-bold text-[#e8e8f0] text-sm">PlotDNA</span>
          <span
            className="text-[8px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: '#6366f115', color: '#6366f1', border: '1px solid #6366f125' }}
          >
            Brochure AI
          </span>
        </div>

        <div className="w-28" /> {/* spacer */}
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
            style={{ background: '#6366f110', border: '1px solid #6366f130' }}
          >
            <Sparkles size={11} className="text-[#6366f1]" />
            <span className="text-[10px] font-mono text-[#6366f1]">Powered by Gemini 2.0 Flash · Phase 2</span>
          </div>

          <h1 className="font-display text-4xl font-black text-[#e8e8f0] leading-tight mb-4">
            Decode any property brochure<br />
            <span style={{ color: '#6366f1' }}>in seconds</span>
          </h1>
          <p className="text-sm font-mono text-[#555566] max-w-lg mx-auto leading-relaxed">
            Upload a PDF or image brochure. AI extracts plot area, RERA number, hidden clauses,
            pricing, coordinates, and possession date — instantly.
          </p>
        </motion.div>

        {/* Upload zone */}
        {!file && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="rounded-2xl flex flex-col items-center justify-center gap-5 py-20 px-8 cursor-pointer transition-all duration-200 mb-8"
            style={{
              background: dragging ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
              border: `2px dashed ${dragging ? '#6366f160' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: dragging ? '#6366f118' : '#111120', border: `1px solid ${dragging ? '#6366f140' : 'rgba(255,255,255,0.08)'}` }}
            >
              <Upload size={30} style={{ color: dragging ? '#6366f1' : '#444455' }} />
            </div>
            <div className="text-center">
              <p className="text-base font-mono text-[#888899]">Drop your brochure here</p>
              <p className="text-xs font-mono text-[#444455] mt-1">PDF · JPEG · PNG · WebP — max {MAX_MB} MB</p>
            </div>
            <span
              className="text-sm font-mono px-5 py-2 rounded-xl transition-colors"
              style={{ background: '#6366f115', color: '#6366f1', border: '1px solid #6366f130' }}
            >
              Select file
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) analyze(f) }}
            />
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-6 py-20 rounded-2xl mb-8"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-[#6366f120]" />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-t-[#6366f1] border-r-[#6366f1] border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={24} className="text-[#6366f1]" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-mono text-[#888899]">Gemini 2.0 Flash analyzing…</p>
              <p className="text-xs font-mono text-[#444455] mt-1">{file?.name}</p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-2">
              {['Parsing layout', 'Reading tables', 'Extracting specs', 'Verifying RERA', 'Detecting clauses'].map((s, i) => (
                <motion.span
                  key={s}
                  initial={{ opacity: 0.2 }}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.45 }}
                  className="text-[9px] font-mono text-[#444455] px-2 py-1 rounded"
                  style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  {s}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl p-6 mb-8"
            style={{ background: '#ef444408', border: '1px solid #ef444422' }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-[#ef4444] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-mono text-sm text-[#ef4444]">{error}</p>
                <p className="text-[10px] font-mono text-[#444455] mt-1">
                  Make sure the FastAPI backend is running: <code>cd backend && uvicorn app.main:app --reload</code>
                </p>
              </div>
              <button onClick={reset} className="text-[#444455] hover:text-[#888899]"><X size={14} /></button>
            </div>
            <button
              onClick={() => { reset(); setTimeout(() => inputRef.current?.click(), 50) }}
              className="mt-4 text-xs font-mono text-[#6366f1] underline"
            >
              Try another file
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) analyze(f) }}
            />
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {/* Result header */}
              <div
                className="flex items-center justify-between px-6 py-5 rounded-t-2xl"
                style={{ background: '#6366f110', border: '1px solid #6366f125', borderBottom: 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: '#6366f118' }}
                  >
                    <CheckCircle2 size={18} className="text-[#6366f1]" />
                  </div>
                  <div>
                    <p className="font-mono font-bold text-[#e8e8f0]">
                      {result.project_name ?? file?.name ?? 'Brochure Analysis Complete'}
                    </p>
                    <p className="text-[10px] font-mono text-[#555566] mt-0.5">
                      Extraction confidence · <span style={{ color: confColor }}>{confidence}%</span>
                    </p>
                  </div>
                </div>
                <button onClick={reset} className="text-[#333344] hover:text-[#666680] transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Extracted data */}
              <div
                className="rounded-b-2xl overflow-hidden"
                style={{ border: '1px solid #6366f120', borderTop: 'none' }}
              >
                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-6" style={{ background: 'rgba(255,255,255,0.015)' }}>
                  {result.plot_area && <StatCard icon={<FileText size={13} />} label="Plot Area" value={result.plot_area} color="#6366f1" />}
                  {result.carpet_area && <StatCard icon={<FileText size={13} />} label="Carpet Area" value={result.carpet_area} color="#6366f1" />}
                  {result.loading_pct !== undefined && (
                    <StatCard
                      icon={<Percent size={13} />}
                      label="Loading %"
                      value={`${result.loading_pct.toFixed(1)}%`}
                      color={result.loading_pct > 35 ? '#ef4444' : result.loading_pct > 25 ? '#f59e0b' : '#10b981'}
                      note={result.loading_pct > 35 ? 'High — verify' : result.loading_pct > 25 ? 'Moderate' : 'Acceptable'}
                    />
                  )}
                  {result.price_per_sqft && (
                    <StatCard
                      icon={<IndianRupee size={13} />}
                      label="Price / sqft"
                      value={`${currency}${result.price_per_sqft.toLocaleString('en-IN')}`}
                      color="#22c55e"
                    />
                  )}
                  {result.possession_date && <StatCard icon={<Calendar size={13} />} label="Possession" value={result.possession_date} color="#f59e0b" />}
                  {result.lat !== undefined && result.lng !== undefined && (
                    <StatCard icon={<MapPin size={13} />} label="Coordinates" value={`${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`} color="#10b981" />
                  )}
                </div>

                {/* RERA */}
                {result.rera_number && (
                  <div
                    className="mx-6 mb-4 flex items-center justify-between px-5 py-4 rounded-xl"
                    style={{ background: '#10b98110', border: '1px solid #10b98128' }}
                  >
                    <div className="flex items-center gap-3">
                      <Shield size={16} className="text-[#10b981]" />
                      <div>
                        <p className="text-[8px] font-mono text-[#555566] uppercase tracking-widest">RERA Registration</p>
                        <p className="text-base font-mono font-bold text-[#10b981]">{result.rera_number}</p>
                        {result.rera_state && (
                          <p className="text-[9px] font-mono text-[#444455]">{result.rera_state}</p>
                        )}
                      </div>
                    </div>
                    <a
                      href={buildReraUrl(result.rera_state, result.rera_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-mono text-[#10b981] hover:underline"
                    >
                      <Shield size={12} />
                      Verify on RERA Portal
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}

                {/* Hidden clauses */}
                {clauses.length > 0 ? (
                  <div className="mx-6 mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid #f59e0b25' }}>
                    <div
                      className="flex items-center justify-between px-5 py-3"
                      style={{ background: '#f59e0b0c' }}
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={13} className="text-[#f59e0b]" />
                        <p className="text-xs font-mono text-[#f59e0b]">
                          {clauses.length} Hidden Clause{clauses.length > 1 ? 's' : ''} Detected
                        </p>
                      </div>
                      {clauses.length > 4 && (
                        <button
                          onClick={() => setShowAllClauses(p => !p)}
                          className="flex items-center gap-1 text-[9px] font-mono text-[#f59e0b]"
                        >
                          {showAllClauses ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                          {showAllClauses ? 'Show less' : `+${clauses.length - 4} more`}
                        </button>
                      )}
                    </div>
                    <div className="px-5 py-4 space-y-3" style={{ background: 'rgba(255,255,255,0.01)' }}>
                      {displayClauses.map((c, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <AlertTriangle size={11} className="text-[#f59e0b] flex-shrink-0 mt-0.5" />
                          <p className="text-xs font-mono text-[#888899]">{c}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : result.rera_number ? (
                  <div
                    className="mx-6 mb-4 flex items-center gap-2 px-5 py-3 rounded-xl"
                    style={{ background: '#10b98108', border: '1px solid #10b98118' }}
                  >
                    <CheckCircle2 size={13} className="text-[#10b981]" />
                    <p className="text-xs font-mono text-[#10b981]">No hidden clauses detected in this brochure</p>
                  </div>
                ) : null}

                {/* Map link if coordinates extracted */}
                {result.lat !== undefined && result.lng !== undefined && (
                  <div className="mx-6 mb-6">
                    <a
                      href={`https://maps.google.com/?q=${result.lat},${result.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-mono transition-all hover:opacity-80"
                      style={{ background: '#10b98110', border: '1px solid #10b98120', color: '#10b981', textDecoration: 'none' }}
                    >
                      <Map size={13} />
                      View extracted coordinates on Google Maps
                      <ExternalLink size={10} className="ml-auto" />
                    </a>
                  </div>
                )}

                {/* Footer */}
                <div
                  className="flex items-center justify-between px-6 py-3"
                  style={{ background: '#0a0a14', borderTop: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <p className="text-[9px] font-mono text-[#222233]">
                    Extracted by Gemini 2.0 Flash · Always verify RERA before purchasing
                  </p>
                  <button
                    onClick={() => { reset(); setTimeout(() => inputRef.current?.click(), 50) }}
                    className="text-[9px] font-mono text-[#444455] hover:text-[#6366f1] transition-colors"
                  >
                    Analyze another
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) analyze(f) }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature chips — shown before upload */}
        {!file && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2 mt-8"
          >
            {[
              { icon: <Shield size={10} />, label: 'RERA Verification' },
              { icon: <AlertTriangle size={10} />, label: 'Hidden Clause Detection' },
              { icon: <MapPin size={10} />, label: 'GPS Coordinate Extraction' },
              { icon: <Percent size={10} />, label: 'Loading % Analysis' },
              { icon: <IndianRupee size={10} />, label: 'Price Extraction' },
              { icon: <Calendar size={10} />, label: 'Possession Date' },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#555566' }}
              >
                {icon}
                {label}
              </span>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, color, note,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  note?: string
}) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{ background: `${color}08`, border: `1px solid ${color}18` }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ color }}>{icon}</span>
        <p className="text-[8px] font-mono text-[#444455] uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-base font-mono font-bold" style={{ color }}>{value}</p>
      {note && <p className="text-[8px] font-mono mt-0.5" style={{ color }}>{note}</p>}
    </div>
  )
}
