import { Link } from 'react-router-dom'
import { TrendingUp, AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { getGrowthForecastForArea } from '@/lib/forecast/growthForecast'
import { getInvestmentReportSummary } from '@/lib/investmentReport'
import { getScoreColor } from '@/lib/utils'
import { buildAreaStoryPath } from '../areaStoryNav'

interface MoneyScreenProps {
  area: MicroMarket
}

function formatLakh(rupees: number): string {
  return `₹${Math.round(rupees / 100000)} lakh`
}

export default function MoneyScreen({ area }: MoneyScreenProps) {
  const forecast = getGrowthForecastForArea(area.slug)
  const summary = getInvestmentReportSummary(area)
  const scoreColor = getScoreColor(area.score)

  return (
    <div>
      <header className="mb-5">
        <p className="font-display text-xl font-black leading-tight text-slate-50">Money View</p>
        <p className="mt-1 text-xs text-slate-500">{area.name}</p>
      </header>

      {forecast?.investment_example ? (
        <section
          className="mb-4 rounded-2xl border p-5"
          style={{ borderColor: `${scoreColor}30`, background: `${scoreColor}0c` }}
        >
          <p className="text-xs text-slate-400">If you invest</p>
          <p className="font-display text-3xl font-black" style={{ color: scoreColor }}>
            {formatLakh(forecast.investment_example.amount)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{forecast.investment_example.label}</p>
        </section>
      ) : (
        <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm leading-relaxed text-slate-400">
            A personalized rupee forecast is not available for {area.name} yet. The figures below are based on
            PlotDNA's current growth, risk, and demand signals for this area.
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
