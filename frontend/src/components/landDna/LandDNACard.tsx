import { AlertTriangle, ArrowRight, BadgeCheck, Building2, RadioTower, Route, Share2, ShieldCheck, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import type { MicroMarket } from '@/types'
import { getScoreLabel } from '@/lib/utils'
import { featureFlags } from '@/lib/features'
import { getGrowthForecastForArea, type GrowthForecast } from '@/lib/forecast/growthForecast'
import type { LandDnaAccessState } from '@/lib/founderPass/landDnaPlan'

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

function passCode(cityName: string, area: MicroMarket) {
  const city = cityName.slice(0, 3).toUpperCase()
  const areaCode = area.name
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X')
  return `${city}-${areaCode}-${String(area.score).padStart(3, '0')}`
}

function forecastMultiple(forecast: GrowthForecast | null, years: 5 | 10) {
  if (!forecast) return null
  const annualMidpoint = (forecast.twelve_month_growth.min + forecast.twelve_month_growth.max) / 2 / 100
  const multiplier = Math.pow(1 + annualMidpoint, years)
  return `${multiplier.toFixed(1)}x`
}

export default function LandDNACard({ area, cityName, accessState, onShare }: Props) {
  const forecast = featureFlags.enableGrowthForecastCard ? getGrowthForecastForArea(area.slug) : null
  const risk = riskFromScore(area.score)
  const infrastructure = area.signals.infrastructure
  const connectivity = area.livability?.connectivity
  const developmentSignal = area.highlights[0] ?? 'Development signal not available yet.'
  const fiveYearOutlook = forecastMultiple(forecast, 5)
  const tenYearOutlook = forecastMultiple(forecast, 10)
  const code = passCode(cityName, area)

  return (
    <article className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-[22px] border border-cyan-200/35 bg-[#050a14] p-4 text-slate-100 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.28),transparent_32%),radial-gradient(circle_at_84%_16%,rgba(99,102,241,0.24),transparent_28%),linear-gradient(135deg,rgba(8,47,73,0.52),rgba(2,6,23,0.28)_42%,rgba(20,83,45,0.22))]" />
      <div className="pointer-events-none absolute inset-[1px] rounded-[21px] border border-white/10" />
      <div className="pointer-events-none absolute -left-5 top-[22%] h-10 w-10 rounded-full border border-cyan-200/35 bg-[#020617]" />
      <div className="pointer-events-none absolute -right-5 top-[22%] h-10 w-10 rounded-full border border-cyan-200/35 bg-[#020617]" />

      <div className="relative">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">PlotDNA</p>
            <p className="mt-2 text-[12px] font-bold uppercase tracking-[0.22em] text-amber-200">Area Pass / Land DNA Card</p>
            <h1 className="mt-3 text-4xl font-display font-black leading-none text-white sm:text-6xl">{area.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-sm font-bold text-cyan-100">
                <Route size={15} />
                {cityName}
              </span>
              <span className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-bold tracking-[0.12em] text-slate-200">
                {code}
              </span>
            </div>
          </div>
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="rounded-xl border border-white/15 bg-white/[0.06] p-2.5 text-slate-200 transition-colors hover:border-cyan-200/50 hover:text-white"
              aria-label="Share Land DNA Card"
            >
              <Share2 size={17} />
            </button>
          )}
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          <HeroMetric
            label="PlotDNA Score"
            value={`${area.score} / 100`}
            subtext={getScoreLabel(area.score)}
            icon={<TrendingUp size={26} />}
            tone="cyan"
          />
          <HeroMetric
            label="Risk Level"
            value={risk}
            subtext={area.category}
            icon={<ShieldCheck size={26} />}
            tone="amber"
          />
        </section>

        <section className="mt-3 grid gap-3 sm:grid-cols-2">
          <SignalTile
            icon={<Building2 size={22} />}
            label="Infrastructure Readiness"
            value={infrastructure === null ? 'Not available yet' : `${infrastructure} / 100`}
          />
          <SignalTile
            icon={<RadioTower size={22} />}
            label="Connectivity Signal"
            value={connectivity ? `${connectivity} / 100 locality connectivity` : 'Connectivity signal not available yet'}
          />
        </section>

        <section className="mt-3 rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/[0.06] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-200">Nearby Development Signal</p>
          <p className="mt-2 text-lg font-bold leading-snug text-white">{developmentSignal}</p>
        </section>

        <section className="mt-3 grid gap-3 sm:grid-cols-2">
          <OutlookTile label="5-Year Growth Outlook" value={fiveYearOutlook ?? 'Not available yet'} />
          <OutlookTile label="10-Year Growth Outlook" value={tenYearOutlook ?? 'Not available yet'} />
        </section>

        <section className="mt-4 flex flex-wrap gap-2">
          {['Connectivity', 'Expansion', 'Access', risk === 'Low' ? 'Lower Risk' : 'Emerging'].map(label => (
            <span key={label} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-100">
              {label}
            </span>
          ))}
        </section>

        {accessState && (
          <section className="mt-5 rounded-2xl border border-amber-200/30 bg-amber-200/[0.08] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Founder Pass</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-2xl font-black text-white">Unlock the city with Rs 99</p>
                <p className="mt-1 text-xs text-amber-100/80">
                  Plan: {accessState.plan} / Card limit: {accessState.cardLimit} / Payment status: {accessState.paymentStatus}
                </p>
              </div>
              <a href={`/area/${area.slug}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-200 px-4 py-3 text-xs font-black text-slate-950">
                Founder Pass
                <ArrowRight size={14} />
              </a>
            </div>
          </section>
        )}

        <footer className="mt-5 border-t border-dashed border-cyan-200/30 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-amber-200" />
              <p className="text-xs leading-relaxed text-slate-300">
                PlotDNA provides location intelligence signals, not legal/title/approval certification. Always verify documents and ground reality before purchase.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-100">
              <BadgeCheck size={14} />
              Intelligence card
            </div>
          </div>
        </footer>
      </div>
    </article>
  )
}

function HeroMetric({
  label,
  value,
  subtext,
  icon,
  tone,
}: {
  label: string
  value: string
  subtext: string
  icon: ReactNode
  tone: 'cyan' | 'amber'
}) {
  const color = tone === 'cyan' ? 'text-cyan-200' : 'text-amber-200'
  const border = tone === 'cyan' ? 'border-cyan-300/30 bg-cyan-300/[0.08]' : 'border-amber-200/30 bg-amber-200/[0.08]'

  return (
    <div className={`rounded-2xl border ${border} p-4`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className={`mt-2 text-4xl font-black leading-none ${color}`}>{value}</p>
          <p className="mt-2 text-sm font-semibold text-slate-200">{subtext}</p>
        </div>
        <div className={`rounded-2xl border border-white/10 bg-white/[0.04] p-3 ${color}`}>{icon}</div>
      </div>
    </div>
  )
}

function SignalTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.045] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">{label}</p>
          <p className="mt-2 text-xl font-black text-white">{value}</p>
        </div>
        <div className="text-cyan-200">{icon}</div>
      </div>
    </div>
  )
}

function OutlookTile({ label, value }: { label: string; value: string }) {
  const available = value !== 'Not available yet'

  return (
    <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-200">{label}</p>
      <p className="mt-2 text-4xl font-black leading-none text-emerald-200">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{available ? 'indicative outlook' : 'requires historical data'}</p>
    </div>
  )
}
