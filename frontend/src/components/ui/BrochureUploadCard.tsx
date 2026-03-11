/**
 * BrochureUploadCard — AI brochure analyzer (Phase 2).
 * Drag & drop a PDF or image brochure → Gemini 2.0 Flash extracts
 * plot area, RERA number, lat/lng, hidden clauses, loading %, and pricing.
 * POST /api/v1/analyze-brochure
 */
import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Upload, Sparkles, AlertTriangle, CheckCircle2,
  MapPin, Shield, Calendar, IndianRupee, Percent, Loader2,
  X, ExternalLink, ChevronDown, ChevronUp,
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

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 10

function buildReraUrl(state: string | undefined, rera: string): string {
  const s = (state ?? '').toLowerCase()
  if (s.includes('telangana') || s.includes('ts')) return `https://rera.telangana.gov.in/reraHome/searchProject.do?reraNumber=${rera}`
  if (s.includes('karnataka') || s.includes('ka')) return `https://rera.karnataka.gov.in/searchProjects?reraNumber=${rera}`
  if (s.includes('maharashtra') || s.includes('mh')) return `https://maharera.mahaonline.gov.in/Registrations/SearchForProjectorAgent?searchText=${rera}`
  if (s.includes('delhi') || s.includes('dl')) return `https://rera.delhi.gov.in/rera/SearchProject?regNo=${rera}`
  return `https://www.google.com/search?q=RERA+${rera}`
}

export default function BrochureUploadCard() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BrochureResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [showClausesAll, setShowClausesAll] = useState(false)

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setExpanded(false)
    setShowClausesAll(false)
  }

  const analyze = useCallback(async (f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
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
      const res = await fetch(`${API_BASE}/api/v1/analyze-brochure`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data: BrochureResult = await res.json()
      setResult(data)
      setExpanded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed — start the FastAPI backend.')
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
  const confidenceColor = confidence >= 80 ? '#10b981' : confidence >= 60 ? '#f59e0b' : '#ef4444'
  const clauses = result?.hidden_clauses ?? []
  const displayClauses = showClausesAll ? clauses : clauses.slice(0, 3)

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.18 }}
      className="mb-10"
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <FileText size={11} className="text-[#555566]" />
        <h2 className="text-xs font-mono text-[#444455] uppercase tracking-widest">
          Brochure Analyzer
        </h2>
        <span
          className="text-[8px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1"
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)', color: '#444455' }}
        >
          <Sparkles size={8} />
          Gemini 2.0 Flash
        </span>
        <span
          className="text-[8px] font-mono px-1.5 py-0.5 rounded ml-1"
          style={{ background: '#6366f115', color: '#6366f1', border: '1px solid #6366f125' }}
        >
          Phase 2
        </span>
      </div>

      {/* Upload zone or result */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Drop zone — shown when no file or reset */}
        {!loading && !result && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-4 py-12 px-6 cursor-pointer transition-all duration-200"
            style={{
              background: dragging ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
              borderColor: dragging ? '#6366f140' : 'transparent',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: dragging ? '#6366f120' : '#111120', border: `1px solid ${dragging ? '#6366f140' : 'rgba(255,255,255,0.06)'}` }}
            >
              <Upload size={22} style={{ color: dragging ? '#6366f1' : '#444455' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-mono text-[#888899]">Drop a brochure PDF or image</p>
              <p className="text-[10px] font-mono text-[#444455] mt-1">PDF · JPEG · PNG · WebP — max {MAX_MB} MB</p>
            </div>
            <span
              className="text-[10px] font-mono px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: '#6366f115', color: '#6366f1', border: '1px solid #6366f125' }}
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
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-14 px-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-[#6366f130]" />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-t-[#6366f1] border-r-[#6366f1] border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={18} className="text-[#6366f1]" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-mono text-[#888899]">Gemini 2.0 Flash analyzing…</p>
              <p className="text-[10px] font-mono text-[#444455] mt-1 truncate max-w-xs">{file?.name}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {['Parsing layout', 'Extracting data', 'Verifying RERA', 'Scoring'].map((s, i) => (
                <motion.span
                  key={s}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                  className="text-[8px] font-mono text-[#444455] px-1.5 py-0.5 rounded"
                  style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  {s}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="px-5 py-6" style={{ background: '#ef444408' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={14} className="text-[#ef4444] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-mono text-[#ef4444]">{error}</p>
                <p className="text-[10px] font-mono text-[#444455] mt-1">cd backend && uvicorn app.main:app --reload</p>
              </div>
              <button onClick={reset} className="text-[#444455] hover:text-[#888899] transition-colors">
                <X size={13} />
              </button>
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-4 text-[10px] font-mono text-[#6366f1] underline"
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
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {/* Result header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ background: '#6366f110', borderBottom: '1px solid #6366f120' }}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={14} className="text-[#6366f1]" />
                  <div>
                    <p className="text-sm font-mono font-bold text-[#e8e8f0]">
                      {result.project_name ?? file?.name ?? 'Brochure Analyzed'}
                    </p>
                    <p className="text-[10px] font-mono text-[#555566] mt-0.5">
                      Extraction confidence · <span style={{ color: confidenceColor }}>{confidence}%</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Confidence badge */}
                  <div
                    className="px-2.5 py-1 rounded-lg text-center"
                    style={{ background: `${confidenceColor}12`, border: `1px solid ${confidenceColor}28` }}
                  >
                    <p className="text-lg font-mono font-bold" style={{ color: confidenceColor }}>{confidence}%</p>
                    <p className="text-[8px] font-mono text-[#444455]">confidence</p>
                  </div>
                  <button
                    onClick={reset}
                    className="text-[#333344] hover:text-[#666680] transition-colors ml-1"
                    title="Clear"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Extracted data grid */}
              <div className="p-5" style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {result.plot_area && (
                    <StatTile icon={<FileText size={11} />} label="Plot Area" value={result.plot_area} color="#6366f1" />
                  )}
                  {result.carpet_area && (
                    <StatTile icon={<FileText size={11} />} label="Carpet Area" value={result.carpet_area} color="#6366f1" />
                  )}
                  {result.loading_pct !== undefined && (
                    <StatTile
                      icon={<Percent size={11} />}
                      label="Loading %"
                      value={`${result.loading_pct.toFixed(1)}%`}
                      color={result.loading_pct > 35 ? '#ef4444' : result.loading_pct > 25 ? '#f59e0b' : '#10b981'}
                    />
                  )}
                  {result.price_per_sqft && (
                    <StatTile
                      icon={<IndianRupee size={11} />}
                      label="Price / sqft"
                      value={`${result.currency ?? '₹'}${result.price_per_sqft.toLocaleString('en-IN')}`}
                      color="#22c55e"
                    />
                  )}
                  {result.possession_date && (
                    <StatTile icon={<Calendar size={11} />} label="Possession" value={result.possession_date} color="#f59e0b" />
                  )}
                  {(result.lat !== undefined && result.lng !== undefined) && (
                    <StatTile
                      icon={<MapPin size={11} />}
                      label="Coordinates"
                      value={`${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`}
                      color="#10b981"
                    />
                  )}
                </div>

                {/* RERA number */}
                {result.rera_number && (
                  <div
                    className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
                    style={{ background: '#10b98110', border: '1px solid #10b98125' }}
                  >
                    <div className="flex items-center gap-2">
                      <Shield size={12} className="text-[#10b981]" />
                      <div>
                        <p className="text-[8px] font-mono text-[#555566] uppercase tracking-widest">RERA Number</p>
                        <p className="text-sm font-mono font-bold text-[#10b981]">{result.rera_number}</p>
                      </div>
                    </div>
                    <a
                      href={buildReraUrl(result.rera_state, result.rera_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[9px] font-mono text-[#10b981] hover:underline"
                    >
                      Verify <ExternalLink size={9} />
                    </a>
                  </div>
                )}

                {/* Hidden clauses */}
                {clauses.length > 0 && (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid #f59e0b22' }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-2.5"
                      style={{ background: '#f59e0b0c' }}
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={11} className="text-[#f59e0b]" />
                        <p className="text-[9px] font-mono text-[#f59e0b] uppercase tracking-widest">
                          Hidden Clauses Detected ({clauses.length})
                        </p>
                      </div>
                      {clauses.length > 3 && (
                        <button
                          onClick={() => setShowClausesAll(p => !p)}
                          className="flex items-center gap-1 text-[9px] font-mono text-[#f59e0b] hover:opacity-80"
                        >
                          {showClausesAll ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                          {showClausesAll ? 'Less' : `+${clauses.length - 3} more`}
                        </button>
                      )}
                    </div>
                    <div className="px-4 py-3 space-y-2" style={{ background: 'rgba(255,255,255,0.015)' }}>
                      {displayClauses.map((c, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertTriangle size={9} className="text-[#f59e0b] flex-shrink-0 mt-0.5" />
                          <p className="text-[11px] font-mono text-[#888899]">{c}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {clauses.length === 0 && result.rera_number && (
                  <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                    style={{ background: '#10b98108', border: '1px solid #10b98118' }}
                  >
                    <CheckCircle2 size={11} className="text-[#10b981]" />
                    <p className="text-[10px] font-mono text-[#10b981]">No hidden clauses detected</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                className="flex items-center gap-1.5 px-5 py-2.5"
                style={{ background: '#0a0a14', borderTop: '1px solid rgba(255,255,255,0.04)' }}
              >
                <Loader2 size={9} className="text-[#222233]" />
                <p className="text-[9px] font-mono text-[#222233]">
                  Powered by Gemini 2.0 Flash vision
                  {result.source ? ` · ${result.source}` : ''}
                </p>
                <button
                  onClick={() => { reset(); setTimeout(() => inputRef.current?.click(), 50) }}
                  className="ml-auto text-[9px] font-mono text-[#333344] hover:text-[#6366f1] transition-colors"
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-[9px] font-mono text-[#1e1e30] mt-2">
        PDF or image · max {MAX_MB} MB · Always verify RERA independently before purchasing
      </p>
    </motion.section>
  )
}

// ── Helper tile ──────────────────────────────────────────────────────────────
function StatTile({
  icon, label, value, color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div
      className="p-3 rounded-xl"
      style={{ background: `${color}08`, border: `1px solid ${color}18` }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color }}>{icon}</span>
        <p className="text-[8px] font-mono text-[#444455] uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-sm font-mono font-bold" style={{ color }}>{value}</p>
    </div>
  )
}
