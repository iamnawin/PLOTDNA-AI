/**
 * AVMCard — Automated Valuation Model (Phase 2).
 * Fetches from GET /api/v1/avm/{country}/{area_slug}
 * Shows: estimated value per sqft, confidence band, gross yield,
 * payback years, and 5-year price projection.
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, Info } from 'lucide-react'

interface YearProjection {
  year: number
  value: number
}

interface AVMData {
  estimated_value_per_sqft: number
  confidence_low: number
  confidence_high: number
  gross_yield_pct: number
  payback_years: number
  currency: string
  area_sqft_assumption?: number
  five_year_projection: YearProjection[]
  model?: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function fmt(n: number, currency = '₹') {
  if (n >= 10000000) return `${currency}${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000)   return `${currency}${(n / 100000).toFixed(1)}L`
  return `${currency}${n.toLocaleString('en-IN')}`
}

interface Props {
  areaSlug: string
  country?: string
  accentColor?: string
}

export default function AVMCard({ areaSlug, country = 'india', accentColor = '#10b981' }: Props) {
  const [data, setData] = useState<AVMData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`${API_BASE}/api/v1/avm/${country}/${areaSlug}`)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [areaSlug, country])

  if (loading) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.26 }}
        className="mb-10"
      >
        <SectionHeader />
        <div className="h-48 rounded-2xl animate-pulse" style={{ background: '#111120' }} />
      </motion.section>
    )
  }

  if (error || !data) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.26 }}
        className="mb-10"
      >
        <SectionHeader />
        <div
          className="p-6 rounded-2xl text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-[#444455] font-mono text-xs">AVM unavailable — Phase 2 backend required.</p>
          <p className="text-[#2a2a3e] font-mono text-[10px] mt-1">GET /api/v1/avm/{country}/{areaSlug}</p>
        </div>
      </motion.section>
    )
  }

  const currency = data.currency === 'AED' ? 'AED ' : '₹'
  const proj = data.five_year_projection
  const maxVal = proj.length ? Math.max(...proj.map(p => p.value)) : data.confidence_high
  const assumedSqft = data.area_sqft_assumption ?? 1000

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.26 }}
      className="mb-10"
    >
      <SectionHeader />

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${accentColor}22` }}
      >
        {/* Header */}
        <div
          className="px-5 py-4"
          style={{ background: `${accentColor}08`, borderBottom: `1px solid ${accentColor}15` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-mono text-[#444455] uppercase tracking-widest mb-1">Estimated Value</p>
              <p className="text-3xl font-mono font-bold" style={{ color: accentColor }}>
                {currency}{data.estimated_value_per_sqft.toLocaleString('en-IN')}
                <span className="text-sm text-[#555566] ml-1">/sqft</span>
              </p>
              {/* Confidence band */}
              <p className="text-[10px] font-mono text-[#555566] mt-1">
                Range: {currency}{data.confidence_low.toLocaleString('en-IN')} – {currency}{data.confidence_high.toLocaleString('en-IN')} /sqft
              </p>
            </div>
            <div
              className="text-right px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-[8px] font-mono text-[#444455] uppercase tracking-widest">Total ({assumedSqft} sqft)</p>
              <p className="text-lg font-mono font-bold text-[#e8e8f0] mt-0.5">
                {fmt(data.estimated_value_per_sqft * assumedSqft, currency)}
              </p>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[8px] font-mono text-[#333344] mb-1">
              <span>{currency}{data.confidence_low.toLocaleString('en-IN')}</span>
              <span className="text-[#444455]">Confidence Range</span>
              <span>{currency}{data.confidence_high.toLocaleString('en-IN')}</span>
            </div>
            <div className="h-2 rounded-full relative overflow-hidden" style={{ background: '#1a1a2e' }}>
              {/* Range band */}
              <div
                className="h-full rounded-full absolute"
                style={{
                  left: `${(data.confidence_low / maxVal) * 100}%`,
                  width: `${((data.confidence_high - data.confidence_low) / maxVal) * 100}%`,
                  background: `${accentColor}30`,
                }}
              />
              {/* Point estimate */}
              <motion.div
                className="h-full w-1 rounded-full absolute"
                style={{
                  left: `${(data.estimated_value_per_sqft / maxVal) * 100}%`,
                  background: accentColor,
                  boxShadow: `0 0 6px ${accentColor}80`,
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* KPI grid */}
        <div
          className="grid grid-cols-3 divide-x"
          style={{
            background: 'rgba(255,255,255,0.015)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <KpiCell label="Gross Yield" value={`${data.gross_yield_pct.toFixed(1)}%`} color="#22c55e" />
          <KpiCell label="Payback" value={`${data.payback_years.toFixed(0)} yrs`} color="#f59e0b" />
          <KpiCell label="5-Yr Upside" value={proj.length >= 2
            ? `+${(((proj[proj.length - 1].value - proj[0].value) / proj[0].value) * 100).toFixed(0)}%`
            : '–'}
            color={accentColor}
          />
        </div>

        {/* 5-year projection chart */}
        {proj.length >= 2 && (
          <div className="px-5 py-5" style={{ background: 'rgba(255,255,255,0.01)' }}>
            <p className="text-[9px] font-mono text-[#444455] uppercase tracking-widest mb-4">5-Year Price Projection</p>

            <div className="flex items-end gap-2 h-20">
              {proj.map((p, i) => {
                const heightPct = (p.value / maxVal) * 100
                return (
                  <div key={p.year} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-[7px] font-mono text-[#444455]">
                      {currency}{(p.value / 1000).toFixed(0)}k
                    </p>
                    <div className="w-full rounded-t-sm relative overflow-hidden" style={{ height: `${heightPct}%`, minHeight: 4, background: '#1a1a2e' }}>
                      <motion.div
                        className="w-full rounded-t-sm absolute bottom-0"
                        style={{
                          background: i === proj.length - 1
                            ? accentColor
                            : `${accentColor}${Math.round(40 + (i / (proj.length - 1)) * 60).toString(16).padStart(2, '0')}`,
                          boxShadow: i === proj.length - 1 ? `0 0 8px ${accentColor}50` : undefined,
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: '100%' }}
                        transition={{ duration: 0.8, delay: 0.1 * i, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="text-[7px] font-mono text-[#333344]">{p.year}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center gap-1.5 px-5 py-2.5"
          style={{ background: '#0a0a14', borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <Info size={9} className="text-[#222233]" />
          <p className="text-[9px] font-mono text-[#222233]">
            {data.model ?? 'Regression-based AVM'} · Directional estimate only — not a valuation report
          </p>
        </div>
      </div>
    </motion.section>
  )
}

function SectionHeader() {
  return (
    <div className="flex items-center gap-2 mb-5">
      <BarChart2 size={11} className="text-[#555566]" />
      <h2 className="text-xs font-mono text-[#444455] uppercase tracking-widest">Automated Valuation</h2>
      <span
        className="text-[8px] font-mono px-1.5 py-0.5 rounded"
        style={{ background: '#6366f115', color: '#6366f1', border: '1px solid #6366f125' }}
      >
        Phase 2 · AVM
      </span>
    </div>
  )
}

function KpiCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center py-3 px-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <p className="text-[8px] font-mono text-[#444455] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-base sm:text-xl font-mono font-bold" style={{ color }}>{value}</p>
    </div>
  )
}
