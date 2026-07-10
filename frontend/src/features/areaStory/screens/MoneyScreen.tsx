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
  const matches = [...priceRange.matchAll(/[\d,.]+/g)].map(m => Number(m[0].replace(/,/g, '')))
  const valid = matches.filter(Number.isFinite)
  if (valid.length === 0) return null
  return valid.reduce((sum, v) => sum + v, 0) / valid.length
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
      <header className="mb-5">
        <p className="font-display text-xl font-black leading-tight text-slate-50">Money View</p>
        <p className="mt-1 text-xs text-slate-500">{area.name}</p>
      </header>

      {estimate ? (
        <section
          className="mb-4 rounded-2xl border p-5"
          style={{ borderColor: `${scoreColor}30`, background: `${scoreColor}0c` }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Calculator size={14} style={{ color: scoreColor }} />
            <p className="text-xs font-sans font-bold text-slate-300">Enter your plot to estimate value</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-sans font-bold uppercase tracking-[0.1em] text-slate-500">Quote / sqft</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={pricePerSqft}
                onChange={event => setPricePerSqft(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2 text-sm font-display font-bold text-slate-100 outline-none focus:border-emerald-400/40"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-sans font-bold uppercase tracking-[0.1em] text-slate-500">Plot sqft</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={plotSizeSqft}
                onChange={event => setPlotSizeSqft(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2 text-sm font-display font-bold text-slate-100 outline-none focus:border-emerald-400/40"
              />
            </label>
          </div>

          {estimate.currentValue > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/5 bg-slate-950/35 p-3">
                <p className="text-[9px] font-sans font-bold uppercase tracking-[0.1em] text-slate-500">Today</p>
                <p className="mt-1 font-display text-lg font-black text-slate-100">{formatCurrency(estimate.currentValue)}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-950/35 p-3">
                <p className="text-[9px] font-sans font-bold uppercase tracking-[0.1em] text-slate-500">In 5 years</p>
                <p className="mt-1 font-display text-lg font-black" style={{ color: scoreColor }}>{formatCurrency(estimate.fiveYearValue)}</p>
                <p className="text-[10px] text-slate-500">+{estimate.fiveYearProfitPct}%</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-950/35 p-3">
                <p className="text-[9px] font-sans font-bold uppercase tracking-[0.1em] text-slate-500">In 10 years</p>
                <p className="mt-1 font-display text-lg font-black text-sky-300">{formatCurrency(estimate.tenYearValue)}</p>
                <p className="text-[10px] text-slate-500">+{estimate.tenYearProfitPct}%</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">Enter a quote and plot size to see an estimate.</p>
          )}
          <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
            Directional estimate from area price and growth signals — not a valuation report. Verify against actual seller quote and recent registered comps.
          </p>
        </section>
      ) : (
        <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm leading-relaxed text-slate-400">
            A price estimate is not available for {area.name} yet. The figures below are based on PlotDNA's current
            growth, risk, and demand signals for this area.
          </p>
        </section>
      )}

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-4">
          <TrendingUp size={18} className="mb-2 text-emerald-300" />
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.1em] text-emerald-300">Possible upside</p>
          <p className="mt-1 text-sm font-sans font-black text-slate-100">{summary.mainUpside}</p>
        </div>
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
          <AlertTriangle size={18} className="mb-2 text-amber-300" />
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.1em] text-amber-300">Risk of overpaying</p>
          <p className="mt-1 text-sm font-sans font-black text-slate-100">{summary.mainRisk}</p>
        </div>
        <div className="rounded-2xl border border-sky-300/20 bg-sky-300/[0.06] p-4">
          <Clock size={18} className="mb-2 text-sky-300" />
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.1em] text-sky-300">Best for</p>
          <p className="mt-1 text-sm font-sans font-black text-slate-100">{summary.bestFor}</p>
        </div>
      </section>

      <section className="mb-4">
        <SignalTrendChart signals={area.signals} accentColor={scoreColor} />
      </section>

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-sans font-black text-slate-100">Good for investment?</p>
        <p className="mt-1 text-sm text-slate-400">{summary.nextVerification}</p>
      </section>

      <Link
        to={buildAreaStoryPath(area.slug, 'map')}
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-sans font-black text-slate-950"
        style={{ background: `linear-gradient(90deg, ${scoreColor}, #38bdf8)` }}
      >
        See Map Proof
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}
