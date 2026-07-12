import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, AlertTriangle, Clock, ArrowRight, Calculator } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { getInvestmentReportSummary } from '@/lib/investmentReport'
import { buildUserInvestmentEstimate } from '@/lib/userInvestmentEstimate'
import { getScoreColor } from '@/lib/utils'
import { buildAreaStoryPath } from '../areaStoryNav'
import SignalTrendChart from './SignalTrendChart'

interface MoneyScreenProps {
  area: MicroMarket
}

function formatCurrency(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} lakh`
  return `₹${value.toLocaleString('en-IN')}`
}

function parsePriceRangeMidpoint(priceRange: string): number | null {
  const matches = [...priceRange.matchAll(/[\d,.]+/g)].map(match => Number(match[0].replace(/,/g, '')))
  const valid = matches.filter(Number.isFinite)
  if (valid.length === 0) return null
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

export default function MoneyScreen({ area }: MoneyScreenProps) {
  const summary = getInvestmentReportSummary(area)
  const scoreColor = getScoreColor(area.score)
  const basePricePerSqft = parsePriceRangeMidpoint(area.priceRange)
  const [pricePerSqft, setPricePerSqft] = useState(basePricePerSqft ? String(Math.round(basePricePerSqft)) : '')
  const [plotSizeSqft, setPlotSizeSqft] = useState('1000')

  const estimate = basePricePerSqft
    ? buildUserInvestmentEstimate({
        pricePerSqft: Number(pricePerSqft) || basePricePerSqft,
        plotSizeSqft: Number(plotSizeSqft) || 0,
        baseEstimatedPricePerSqft: basePricePerSqft,
        yoy: area.yoy,
      })
    : null

  return (
    <div>
      <header className="mb-4">
        <p className="font-display text-xl font-black leading-tight text-slate-50">Money View</p>
        <p className="mt-1 text-xs text-slate-500">{area.name}</p>
      </header>

      {estimate ? (
        <>
          {estimate.currentValue > 0 && (
            <section className="relative mb-3 overflow-hidden rounded-2xl border p-5" style={{ borderColor: `${scoreColor}38`, background: `linear-gradient(145deg, ${scoreColor}18, rgba(2,6,23,0.72))` }}>
              <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full opacity-20 blur-3xl" style={{ background: scoreColor }} />
              <p className="relative text-xs font-bold text-slate-400">If you invest</p>
              <p className="relative mt-1 font-display text-4xl font-black tracking-[-0.04em] text-slate-50">{formatCurrency(estimate.currentValue)}</p>
              <p className="relative mt-4 text-xs text-slate-400">Your possible value after 5 years</p>
              <p className="relative mt-1 font-display text-3xl font-black tracking-[-0.03em]" style={{ color: scoreColor }}>{formatCurrency(estimate.fiveYearValue)}</p>
              <div className="relative mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1.5 text-[11px] font-bold text-emerald-200">+{formatCurrency(estimate.fiveYearProfit)} potential gain</span>
                <span className="rounded-full border border-sky-300/20 bg-sky-300/[0.08] px-3 py-1.5 text-[11px] font-bold text-sky-200">10 years: {formatCurrency(estimate.tenYearValue)}</span>
              </div>
              <p className="relative mt-3 text-[10px] leading-relaxed text-slate-500">Directional screening estimate, not a valuation or guaranteed return.</p>
            </section>
          )}

          <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.025] p-3.5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ color: scoreColor, background: `${scoreColor}12` }}><Calculator size={14} /></span>
              <div>
                <p className="text-xs font-bold text-slate-200">Adjust your estimate</p>
                <p className="text-[10px] text-slate-500">Change the seller quote or plot size</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">Quote / sqft</span>
                <input type="number" min="0" inputMode="numeric" value={pricePerSqft} onChange={event => setPricePerSqft(event.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/55 px-3 text-sm font-display font-bold text-slate-100 outline-none focus:border-emerald-400/40" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">Plot sqft</span>
                <input type="number" min="0" inputMode="numeric" value={plotSizeSqft} onChange={event => setPlotSizeSqft(event.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/55 px-3 text-sm font-display font-bold text-slate-100 outline-none focus:border-emerald-400/40" />
              </label>
            </div>

            {estimate.currentValue > 0 ? (
              <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-white/8 bg-slate-950/35">
                <CompactValue label="Today" value={formatCurrency(estimate.currentValue)} />
                <CompactValue label="5 years" value={formatCurrency(estimate.fiveYearValue)} change={`+${estimate.fiveYearProfitPct}%`} color={scoreColor} />
                <CompactValue label="10 years" value={formatCurrency(estimate.tenYearValue)} change={`+${estimate.tenYearProfitPct}%`} color="#7dd3fc" />
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">Enter a quote and plot size to see an estimate.</p>
            )}
          </section>
        </>
      ) : (
        <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm leading-relaxed text-slate-400">A price estimate is not available for {area.name} yet. The figures below are based on PlotDNA's current growth, risk, and demand signals for this area.</p>
        </section>
      )}

      <section className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] px-4">
        <MoneyPoint icon={TrendingUp} label="Possible upside" value={summary.mainUpside} tone="text-emerald-300" />
        <MoneyPoint icon={AlertTriangle} label="Risk of overpaying" value={summary.mainRisk} tone="text-amber-300" />
        <MoneyPoint icon={Clock} label="Best for" value={summary.bestFor} tone="text-sky-300" last />
      </section>

      <section className="mb-4">
        <SignalTrendChart signals={area.signals} accentColor={scoreColor} />
      </section>

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-sans font-black text-slate-100">Good for investment?</p>
        <p className="mt-1 text-sm text-slate-400">{summary.nextVerification}</p>
      </section>

      <Link to={buildAreaStoryPath(area.slug, 'map')} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-sans font-black text-slate-950" style={{ background: `linear-gradient(90deg, ${scoreColor}, #38bdf8)` }}>
        Check Map Proof <ArrowRight size={16} />
      </Link>
    </div>
  )
}

function CompactValue({ label, value, change, color }: { label: string; value: string; change?: string; color?: string }) {
  return (
    <div className="min-w-0 border-r border-white/8 px-2 py-2.5 last:border-r-0">
      <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-[13px] font-black text-slate-100" style={color ? { color } : undefined}>{value}</p>
      {change && <p className="mt-0.5 text-[9px] text-slate-500">{change}</p>}
    </div>
  )
}

function MoneyPoint({ icon: Icon, label, value, tone, last = false }: { icon: typeof TrendingUp; label: string; value: string; tone: string; last?: boolean }) {
  return (
    <div className={`flex items-start gap-3 py-3 ${last ? '' : 'border-b border-white/7'}`}>
      <Icon size={16} className={`mt-0.5 shrink-0 ${tone}`} />
      <div className="min-w-0">
        <p className={`text-[9px] font-bold uppercase tracking-[0.08em] ${tone}`}>{label}</p>
        <p className="mt-1 text-xs font-bold leading-relaxed text-slate-200">{value}</p>
      </div>
    </div>
  )
}
