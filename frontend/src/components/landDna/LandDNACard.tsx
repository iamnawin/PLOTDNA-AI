import { AlertTriangle, ArrowRight, Share2 } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { getScoreLabel } from '@/lib/utils'
import { getGrowthForecastForArea } from '@/lib/forecast/growthForecast'
import type { LandDnaAccessState } from '@/lib/founderPass/landDnaPlan'
import GrowthForecastCard from '@/components/forecast/GrowthForecastCard'

interface Props {
  area: MicroMarket
  cityName: string
  accessState?: LandDnaAccessState | null
  onShare?: () => void
}

function riskFromScore(score: number) {
  if (score >= 80) return 'Low'
  if (score >= 60) return 'Medium'
  return 'High'
}

export default function LandDNACard({ area, cityName, accessState, onShare }: Props) {
  const forecast = getGrowthForecastForArea(area.slug)
  const risk = riskFromScore(area.score)
  const connectivity = area.livability?.connectivity
  const developmentSignal = area.highlights[0] ?? 'Development signals are available at locality level.'

  return (
    <article className="mx-auto w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#080d19] p-5 text-slate-100 shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">PlotDNA</p>
          <h1 className="mt-1 text-2xl font-display font-bold leading-tight">{area.name}</h1>
          <p className="mt-1 text-sm text-slate-400">{cityName}</p>
        </div>
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="rounded-lg border border-white/10 p-2 text-slate-300 transition-colors hover:text-white"
            aria-label="Share Land DNA Card"
          >
            <Share2 size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-white/10 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">PlotDNA Score</p>
          <p className="mt-1 text-2xl font-bold text-emerald-200">{area.score} / 100</p>
          <p className="text-xs text-slate-400">{getScoreLabel(area.score)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Risk Level</p>
          <p className="mt-1 text-2xl font-bold text-amber-200">{risk}</p>
          <p className="text-xs text-slate-400">{area.category}</p>
        </div>
      </div>

      {forecast && (
        <div className="border-b border-white/10 py-4">
          <GrowthForecastCard forecast={forecast} />
        </div>
      )}

      <div className="space-y-3 border-b border-white/10 py-4">
        <SignalLine label="Connectivity signal" value={connectivity ? `${connectivity}/100 locality connectivity` : 'Connectivity signal not available yet'} />
        <SignalLine label="Nearby development signal" value={developmentSignal} />
      </div>

      <div className="space-y-3 py-4">
        <p className="text-sm leading-relaxed text-slate-300">
          {area.name} has a PlotDNA score of {area.score}, with location-level signals that should be checked against the exact plot, road access, approvals, and ground reality.
        </p>
        <div className="flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-amber-300" />
          <p className="text-xs leading-relaxed text-amber-100">
            PlotDNA provides location intelligence signals, not legal/title/approval certification. Always verify documents and ground reality before purchase.
          </p>
        </div>
      </div>

      {accessState && (
        <div className="mb-4 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
            Founder Pass
          </p>
          <p className="mt-1 text-sm font-bold text-slate-100">{accessState.cta}</p>
          <p className="mt-1 text-xs text-slate-400">
            Plan: {accessState.plan} - Card limit: {accessState.cardLimit} - Payment status: {accessState.paymentStatus}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <p className="text-xs font-bold text-slate-400">PlotDNA Land Card</p>
        <a
          href={`/area/${area.slug}`}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950"
        >
          Unlock Founder Pass - Rs 99 Lifetime Early Access
          <ArrowRight size={13} />
        </a>
      </div>
    </article>
  )
}

function SignalLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-300">{value}</p>
    </div>
  )
}
