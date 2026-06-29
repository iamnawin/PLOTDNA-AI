import { TrendingUp, ShieldAlert } from 'lucide-react'
import type { GrowthForecast } from '@/lib/forecast/growthForecast'

interface Props {
  forecast: GrowthForecast
}

export default function GrowthForecastCard({ forecast }: Props) {
  return (
    <section className="space-y-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-3 sm:p-4" aria-label="Growth Forecast">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={13} className="text-emerald-300" />
            <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-emerald-300">
              {forecast.title}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-300">{forecast.summary}</p>
        </div>
        <span className="shrink-0 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[10px] font-bold text-emerald-100">
          Confidence: {forecast.confidence}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
        <ForecastMetric label="Expected 6-Month Growth" value={forecast.six_month_growth.label} />
        <ForecastMetric label="Expected 12-Month Growth" value={forecast.twelve_month_growth.label} />
      </div>

      {forecast.investment_example && (
        <p className="rounded-lg border border-white/10 bg-slate-950/30 px-3 py-2 text-[10px] leading-relaxed text-slate-300 sm:text-[11px]">
          {forecast.investment_example.label}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300">
          Risk Level: <span className="font-bold text-slate-100">{forecast.risk}</span>
        </p>
        <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300">Estimated range</p>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-400">
        <span className="font-bold text-slate-300">Simple reason:</span> {forecast.reason}
      </p>

      <div className="flex items-start gap-2 border-t border-white/10 pt-3">
        <ShieldAlert size={12} className="mt-0.5 flex-shrink-0 text-amber-300" />
        <p className="text-[10px] leading-relaxed text-slate-500">{forecast.disclaimer}</p>
      </div>
    </section>
  )
}

function ForecastMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-emerald-200">{value}</p>
    </div>
  )
}
