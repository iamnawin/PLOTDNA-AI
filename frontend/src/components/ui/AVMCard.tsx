/**
 * AVMCard — Automated Valuation Model (Phase 2).
 * Fetches from GET /api/v1/avm/{country}/{area_slug}
 * Shows: estimated value per sqft, confidence band, gross yield,
 * payback years, and 5-year price projection.
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, Calculator, Info, TrendingUp } from 'lucide-react'
import { buildUserInvestmentEstimate, type UserInvestmentEstimate } from '@/lib/userInvestmentEstimate'

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

function fmt(n: number, currency = '\u20B9') {
  if (n >= 10000000) return `${currency}${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000)   return `${currency}${(n / 100000).toFixed(1)}L`
  return `${currency}${n.toLocaleString('en-IN')}`
}

function parseInputNumber(value: string) {
  const normalized = Number(value.replace(/,/g, ''))
  return Number.isFinite(normalized) ? normalized : 0
}

interface Props {
  areaSlug: string
  country?: string
  accentColor?: string
}

export default function AVMCard({ areaSlug, country = 'india', accentColor = '#10b981' }: Props) {
  type AVMState =
    | { key: string; status: 'success'; data: AVMData }
    | { key: string; status: 'error' }
    | null

  const requestKey = `${country}/${areaSlug}`
  const [state, setState] = useState<AVMState>(null)
  const [userInput, setUserInput] = useState<{ key: string; pricePerSqft: string; plotSizeSqft: string } | null>(null)

  const current = state?.key === requestKey ? state : null
  const loading = current === null
  const error = current?.status === 'error'
  const data = current?.status === 'success' ? current.data : null

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE}/api/v1/avm/${country}/${areaSlug}`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then((nextData: AVMData) => setState({ key: requestKey, status: 'success', data: nextData }))
      .catch((err: unknown) => {
        if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') return
        setState({ key: requestKey, status: 'error' })
      })

    return () => controller.abort()
  }, [areaSlug, country, requestKey])

  if (loading) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.26 }}
        className="mb-10"
      >
        <SectionHeader />
        <div className="h-48 rounded-2xl animate-pulse glass-panel" />
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
          className="p-6 rounded-2xl text-center glass-panel"
        >
          <p className="text-slate-400 font-sans text-xs">AVM unavailable — Phase 2 backend required.</p>
          <p className="text-slate-500 font-sans text-[10px] mt-1">GET /api/v1/avm/{country}/{areaSlug}</p>
        </div>
      </motion.section>
    )
  }

  const currency = data.currency === 'AED' ? 'AED ' : '\u20B9'
  const proj = data.five_year_projection
  const maxVal = proj.length ? Math.max(...proj.map(p => p.value)) : data.confidence_high
  const assumedSqft = data.area_sqft_assumption ?? 1000
  const userPricePerSqft = userInput?.key === requestKey ? userInput.pricePerSqft : String(data.estimated_value_per_sqft)
  const userPlotSizeSqft = userInput?.key === requestKey ? userInput.plotSizeSqft : String(assumedSqft)
  const updateUserPricePerSqft = (nextValue: string) => {
    setUserInput({ key: requestKey, pricePerSqft: nextValue, plotSizeSqft: userPlotSizeSqft })
  }
  const updateUserPlotSizeSqft = (nextValue: string) => {
    setUserInput({ key: requestKey, pricePerSqft: userPricePerSqft, plotSizeSqft: nextValue })
  }
  const userEstimate = buildUserInvestmentEstimate({
    pricePerSqft: parseInputNumber(userPricePerSqft),
    plotSizeSqft: parseInputNumber(userPlotSizeSqft),
    baseEstimatedPricePerSqft: data.estimated_value_per_sqft,
    fiveYearProjectedPricePerSqft: proj.at(-1)?.value,
    yoy: proj.length >= 2 ? ((proj.at(-1)!.value - proj[0].value) / proj[0].value) * 20 : 12,
  })

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.26 }}
      className="mb-10"
    >
      <SectionHeader />

      <div
        className="glass-panel rounded-2xl overflow-hidden"
        style={{ borderColor: `${accentColor}22` }}
      >
        {/* Header */}
        <div
          className="px-5 py-4"
          style={{ background: `${accentColor}08`, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Value</p>
              <p className="text-3xl font-sans font-bold" style={{ color: accentColor }}>
                <span className="font-display">{currency}{data.estimated_value_per_sqft.toLocaleString('en-IN')}</span>
                <span className="text-xs text-slate-400 font-sans font-medium ml-1">/sqft</span>
              </p>
              {/* Confidence band */}
              <p className="text-[10px] font-sans text-slate-400 mt-1">
                Range: <span className="font-display">{currency}{data.confidence_low.toLocaleString('en-IN')}</span>{" \u2013 "}<span className="font-display">{currency}{data.confidence_high.toLocaleString('en-IN')}</span> <span className="font-sans">/sqft</span>
              </p>
            </div>
            <div
              className="text-right px-4 py-3 rounded-xl glass-panel-light"
            >
              <p className="text-[8px] font-sans font-bold text-slate-400 uppercase tracking-wider">Total (<span className="font-display">{assumedSqft}</span> sqft)</p>
              <p className="text-lg font-display font-bold text-slate-100 mt-0.5">
                {fmt(data.estimated_value_per_sqft * assumedSqft, currency)}
              </p>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[8px] font-sans text-slate-400 mb-1">
              <span className="font-display">{currency}{data.confidence_low.toLocaleString('en-IN')}</span>
              <span className="text-slate-400 font-sans font-medium">Confidence Range</span>
              <span className="font-display">{currency}{data.confidence_high.toLocaleString('en-IN')}</span>
            </div>
            <div className="h-2 rounded-full relative overflow-hidden bg-slate-900/50" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
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
          className="grid grid-cols-3 divide-x divide-white/5"
          style={{
            background: 'rgba(255,255,255,0.015)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <KpiCell label="Gross Yield" value={`${data.gross_yield_pct.toFixed(1)}%`} color="#10b981" />
          <KpiCell label="Payback" value={`${data.payback_years.toFixed(0)} yrs`} color="#f59e0b" />
          <KpiCell label="5-Yr Upside" value={proj.length >= 2
            ? `+${(((proj[proj.length - 1].value - proj[0].value) / proj[0].value) * 100).toFixed(0)}%`
            : '\u2013'}
            color={accentColor}
          />
        </div>

        {/* 5-year projection chart */}
        {proj.length >= 2 && (
          <div className="px-5 py-5" style={{ background: 'rgba(255,255,255,0.01)' }}>
            <p className="text-[9px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-4">5-Year Price Projection</p>

            <div className="flex items-end gap-2 h-20">
              {proj.map((p, i) => {
                const heightPct = (p.value / maxVal) * 100
                const opacityHex = Math.round(40 + (i / (proj.length - 1)) * 60).toString(16).padStart(2, '0')
                return (
                  <div key={p.year} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-[7px] font-display text-slate-400">
                      {currency}{(p.value / 1000).toFixed(0)}k
                    </p>
                    <div className="w-full rounded-t-md relative overflow-hidden bg-slate-900/40" style={{ height: `${heightPct}%`, minHeight: 4, border: '1px solid rgba(255,255,255,0.03)' }}>
                      <motion.div
                        className="w-full rounded-t-md absolute bottom-0"
                        style={{
                          background: i === proj.length - 1
                            ? `linear-gradient(to top, ${accentColor}80, ${accentColor})`
                            : `linear-gradient(to top, ${accentColor}15, ${accentColor}${opacityHex})`,
                          boxShadow: i === proj.length - 1 ? `0 0 8px ${accentColor}40` : undefined,
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: '100%' }}
                        transition={{ duration: 0.8, delay: 0.1 * i, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="text-[7px] font-display text-slate-400">{p.year}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <UserEstimationPanel
          currency={currency}
          accentColor={accentColor}
          pricePerSqft={userPricePerSqft}
          plotSizeSqft={userPlotSizeSqft}
          onPricePerSqftChange={updateUserPricePerSqft}
          onPlotSizeSqftChange={updateUserPlotSizeSqft}
          estimate={userEstimate}
        />

        {/* Footer */}
        <div
          className="flex items-center gap-1.5 px-5 py-2.5"
          style={{ background: 'rgba(10, 10, 20, 0.4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <Info size={9} className="text-slate-500" />
          <p className="text-[9px] font-sans text-slate-500">
            {data.model ?? 'Regression-based AVM'}{" \u00B7 "}Directional estimate only{" \u2014 "}not a valuation report
          </p>
        </div>
      </div>
    </motion.section>
  )
}

function UserEstimationPanel({
  currency,
  accentColor,
  pricePerSqft,
  plotSizeSqft,
  onPricePerSqftChange,
  onPlotSizeSqftChange,
  estimate,
}: {
  currency: string
  accentColor: string
  pricePerSqft: string
  plotSizeSqft: string
  onPricePerSqftChange: (value: string) => void
  onPlotSizeSqftChange: (value: string) => void
  estimate: UserInvestmentEstimate
}) {
  return (
    <div className="px-5 py-5 border-t border-white/5" style={{ background: 'rgba(255,255,255,0.018)' }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-5">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}14`, border: `1px solid ${accentColor}28` }}
          >
            <Calculator size={15} style={{ color: accentColor }} />
          </div>
          <div>
            <p className="text-[9px] font-sans font-bold text-slate-400 uppercase tracking-wider">User Estimation</p>
            <p className="text-sm font-sans font-bold text-slate-100 mt-1">Edit quote and plot size to model value and growth.</p>
            <p className="text-[10px] font-sans text-slate-500 mt-1">Use the actual seller quote when you have it. This is directional, not a guaranteed return.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full lg:w-[320px]">
          <label className="block">
            <span className="block text-[8px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500 mb-1">Quote / sqft</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={pricePerSqft}
              onChange={(event) => onPricePerSqftChange(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2 text-sm font-display font-bold text-slate-100 outline-none focus:border-emerald-400/40"
            />
          </label>
          <label className="block">
            <span className="block text-[8px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500 mb-1">Plot sqft</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={plotSizeSqft}
              onChange={(event) => onPlotSizeSqftChange(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2 text-sm font-display font-bold text-slate-100 outline-none focus:border-emerald-400/40"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <EstimateTile label="Current Value" value={fmt(estimate.currentValue, currency)} caption="Quote x plot size" color="#e2e8f0" />
        <EstimateTile
          label="5Y Growth Estimate"
          value={fmt(estimate.fiveYearValue, currency)}
          caption={`+${estimate.fiveYearProfitPct}% margin | ${fmt(estimate.fiveYearProfit, currency)} profit`}
          color={accentColor}
        />
        <EstimateTile
          label="10Y Growth Estimate"
          value={fmt(estimate.tenYearValue, currency)}
          caption={`+${estimate.tenYearProfitPct}% margin | ${fmt(estimate.tenYearProfit, currency)} profit`}
          color="#38bdf8"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-950/35 border border-white/5 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp size={12} style={{ color: accentColor }} />
            <p className="text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">Future Price / sqft</p>
          </div>
          <p className="text-xs font-sans text-slate-300 mt-1">
            5Y <span className="font-display font-bold" style={{ color: accentColor }}>{currency}{estimate.fiveYearPricePerSqft.toLocaleString('en-IN')}</span>
            <span className="text-slate-600"> | </span>
            10Y <span className="font-display font-bold text-sky-300">{currency}{estimate.tenYearPricePerSqft.toLocaleString('en-IN')}</span>
          </p>
        </div>
        <div className="rounded-xl bg-amber-500/[0.06] border border-amber-400/15 px-3 py-2.5">
          <p className="text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-amber-300">Check before buying</p>
          <p className="text-[10px] font-sans text-amber-100/80 mt-1 leading-relaxed">Profit depends on title, approvals, road access, liquidity, and actual resale demand.</p>
        </div>
      </div>
    </div>
  )
}

function EstimateTile({ label, value, caption, color }: { label: string; value: string; caption: string; color: string }) {
  return (
    <div className="rounded-xl bg-slate-950/35 border border-white/5 px-3 py-3">
      <p className="text-[8px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500 mb-1">{label}</p>
      <p className="text-lg sm:text-xl font-display font-black leading-tight" style={{ color }}>{value}</p>
      <p className="text-[10px] font-sans text-slate-500 mt-1 leading-snug">{caption}</p>
    </div>
  )
}

function SectionHeader() {
  return (
    <div className="flex items-center gap-2 mb-5">
      <BarChart2 size={11} className="text-slate-400" />
      <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">Automated Valuation</h2>
      <span
        className="text-[8px] font-sans font-bold px-1.5 py-0.5 rounded"
        style={{ background: '#6366f115', color: '#6366f1', border: '1px solid #6366f125' }}
      >
        Phase 2{" \u00B7 "}AVM
      </span>
    </div>
  )
}

function KpiCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center py-3 px-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <p className="text-[8px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-base sm:text-xl font-display font-bold" style={{ color }}>{value}</p>
    </div>
  )
}
