import { ArrowRight, BadgeCheck, Building2, MapPin, RadioTower, Route, ShieldCheck, TrendingUp } from 'lucide-react'
import type { ReactNode, Ref } from 'react'
import type { MicroMarket } from '@/types'
import type { LandDnaAccessState } from '@/lib/founderPass/landDnaPlan'
import { getLandDnaAreaCode } from '@/lib/landDnaCard'
import { getScoreLabel } from '@/lib/utils'
import { featureFlags } from '@/lib/features'
import { getGrowthForecastForArea } from '@/lib/forecast/growthForecast'
import { getReportPaymentLink } from '@/lib/paymentLinks'

interface Props {
  area: MicroMarket
  cityName: string
  accessState?: LandDnaAccessState | null
  cardRef?: Ref<HTMLElement>
}

function riskFromScore(score: number) {
  if (score >= 80) return 'Low'
  if (score >= 60) return 'Medium'
  return 'High'
}

export default function LandDNACard({ area, cityName, accessState, cardRef }: Props) {
  const code = getLandDnaAreaCode(cityName, area)
  const forecast = featureFlags.enableGrowthForecastCard ? getGrowthForecastForArea(area.slug) : null
  const annualGrowth = forecast
    ? (forecast.twelve_month_growth.min + forecast.twelve_month_growth.max) / 2 / 100
    : area.yoy / 100
  const growthOutlook = (years: number) => `${Math.pow(1 + annualGrowth, years).toFixed(1)}x`
  const paymentLink = getReportPaymentLink('instant_pdf_99')
  const risk = riskFromScore(area.score)

  return (
    <article ref={cardRef} className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-2xl border border-cyan-200/35 bg-[linear-gradient(145deg,#08324a_0%,#123a5a_42%,#101b3f_100%)] p-4 text-white shadow-[0_16px_40px_rgba(0,0,0,0.32)] sm:p-6">
      <span className="pointer-events-none absolute -left-5 top-[22%] h-10 w-10 rounded-full border border-cyan-200/35 bg-[#020617]" />
      <span className="pointer-events-none absolute -right-5 top-[22%] h-10 w-10 rounded-full border border-cyan-200/35 bg-[#020617]" />

      <header>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">PlotDNA</p>
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">Area Pass / Land DNA Card</p>
          </div>
          <BadgeCheck size={21} className="text-cyan-200" />
        </div>
        <h1 className="mt-4 break-words text-4xl font-black leading-none tracking-[-0.035em] sm:text-6xl">{area.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100"><Route size={14} />{cityName}</span>
          <span className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.1em] text-slate-200">{code}</span>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <Metric label="PlotDNA score" value={`${area.score} / 100`} subtext={getScoreLabel(area.score)} icon={<TrendingUp size={22} />} tone="cyan" />
        <Metric label="Risk level" value={risk} subtext={area.category} icon={<ShieldCheck size={22} />} tone="amber" />
      </section>

      <section className="mt-3 grid grid-cols-2 gap-3">
        <Signal label="Infrastructure readiness" value={`${area.signals.infrastructure} / 100`} icon={<Building2 size={19} />} />
        <Signal label="Connectivity signal" value={area.livability?.connectivity ? `${area.livability.connectivity} / 100` : 'Not available'} icon={<RadioTower size={19} />} />
      </section>

      <section className="mt-3 rounded-xl border border-fuchsia-300/20 bg-fuchsia-300/[0.07] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fuchsia-200">Nearby development signal</p>
        <p className="mt-2 text-base font-black leading-snug">{area.highlights[0] ?? 'Development signal not available yet.'}</p>
      </section>

      <section className="mt-3 grid grid-cols-2 gap-3">
        <Signal label="5-year outlook" value={growthOutlook(5)} icon={<TrendingUp size={19} />} />
        <Signal label="10-year outlook" value={growthOutlook(10)} icon={<TrendingUp size={19} />} />
      </section>

      {accessState && (
        <section className="mt-4 rounded-xl border border-amber-200/30 bg-amber-200/[0.09] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">Founder Pass</p>
          <p className="mt-2 text-xl font-black">{accessState.upgradeRequired ? 'Unlock Founder Pass — ₹99 Lifetime Access' : 'Founder Pass active'}</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80">Generate more Area Pass cards, buyer reports, and comparisons.</p>
          {accessState.upgradeRequired && (
            paymentLink ? (
              <a href={paymentLink} className="btn-3d-reflective mt-4 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-[linear-gradient(115deg,#f59e0b_0%,#facc15_28%,#2dd4bf_67%,#38bdf8_100%)] px-4 text-sm font-black text-slate-950 active:translate-y-0.5">
                Unlock Founder Pass <ArrowRight size={16} />
              </a>
            ) : (
              <p className="mt-3 rounded-lg border border-amber-200/20 bg-black/15 px-3 py-2 text-xs text-amber-100">Payment link is temporarily unavailable. Please try again soon.</p>
            )
          )}
        </section>
      )}

      <footer className="mt-4 flex items-start gap-2 border-t border-dashed border-cyan-200/30 pt-4 text-[10px] leading-relaxed text-slate-300">
        <MapPin size={14} className="mt-0.5 shrink-0 text-cyan-200" />
        PlotDNA provides location intelligence signals, not legal, title, or approval certification. Always verify documents, access, approvals, and latest pricing before purchase.
      </footer>
    </article>
  )
}

function Metric({ label, value, subtext, icon, tone }: { label: string; value: string; subtext: string; icon: ReactNode; tone: 'cyan' | 'amber' }) {
  const color = tone === 'cyan' ? 'text-cyan-200' : 'text-amber-200'
  const surface = tone === 'cyan' ? 'border-cyan-300/25 bg-cyan-300/[0.08]' : 'border-amber-200/25 bg-amber-200/[0.08]'
  return <div className={`rounded-xl border p-3 ${surface}`}><div className="flex items-start justify-between gap-2"><div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-300">{label}</p><p className={`mt-2 text-2xl font-black leading-none ${color}`}>{value}</p><p className="mt-2 text-[11px] font-semibold text-slate-200">{subtext}</p></div><span className={color}>{icon}</span></div></div>
}

function Signal({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="rounded-xl border border-white/12 bg-white/[0.05] p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-[9px] font-bold uppercase tracking-[0.11em] text-cyan-200">{label}</p><p className="mt-2 text-sm font-black leading-snug text-white">{value}</p></div><span className="text-cyan-200">{icon}</span></div></div>
}
