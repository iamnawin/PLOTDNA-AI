import { ArrowRight, BadgeCheck, Building2, CircleCheck, IndianRupee, MapPin, RadioTower, Route, ShieldCheck, TrendingUp } from 'lucide-react'
import type { ReactNode, Ref } from 'react'
import type { MicroMarket } from '@/types'
import type { LandDnaAccessState } from '@/lib/founderPass/landDnaPlan'
import { getConfidenceMeta } from '@/lib/cityProduction'
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
  if (score >= 80) return 'Lower risk'
  if (score >= 60) return 'Medium risk'
  return 'Higher risk'
}

export default function LandDNACard({ area, cityName, accessState, cardRef }: Props) {
  const code = getLandDnaAreaCode(cityName, area)
  const forecast = featureFlags.enableGrowthForecastCard ? getGrowthForecastForArea(area.slug) : null
  const annualGrowth = forecast
    ? (forecast.twelve_month_growth.min + forecast.twelve_month_growth.max) / 2 / 100
    : area.yoy / 100
  const growthOutlook = (years: number) => `${Math.pow(1 + annualGrowth, years).toFixed(1)}x`
  const paymentLink = getReportPaymentLink('instant_pdf_99')
  const confidence = getConfidenceMeta(area.dataConfidence)
  const risk = riskFromScore(area.score)
  const checks = [
    'Verify title and latest encumbrance certificate',
    'Confirm layout approval and exact survey match',
    'Check road access, utilities, and seller quote',
  ]

  return (
    <article ref={cardRef} className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-2xl border border-cyan-200/35 bg-[linear-gradient(150deg,#062b3d_0%,#0b2948_48%,#101b3f_100%)] text-white shadow-[0_16px_40px_rgba(0,0,0,0.32)]">
      <span className="pointer-events-none absolute -left-4 top-[21%] h-8 w-8 rounded-full border border-cyan-200/35 bg-[#020617]" />
      <span className="pointer-events-none absolute -right-4 top-[21%] h-8 w-8 rounded-full border border-cyan-200/35 bg-[#020617]" />

      <header className="flex items-center justify-between gap-4 border-b border-dashed border-cyan-200/30 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-200/30 bg-cyan-200/10"><BadgeCheck size={19} className="text-cyan-200" /></span>
          <div><p className="text-sm font-black text-emerald-300">PlotDNA</p><p className="text-[9px] font-semibold text-slate-300">Know the land before you buy</p></div>
        </div>
        <div className="text-right"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Area Pass</p><p className="mt-0.5 text-[9px] text-slate-400">Premium buyer card</p></div>
      </header>

      <section className="grid grid-cols-[minmax(0,1fr)_132px] gap-3 border-b border-dashed border-cyan-200/25 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:px-6">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-200"><MapPin size={11} />Area</p>
          <h1 className="mt-1 break-words text-[1.7rem] font-black leading-none tracking-[-0.035em] sm:text-4xl">{area.name}</h1>
          <p className="mt-3 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-200"><Route size={11} />City</p>
          <p className="mt-1 text-sm font-bold text-slate-100">{cityName}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-200">Pass code</p>
          <p className="mt-1 rounded-lg border border-cyan-200/35 bg-slate-950/30 px-2 py-2 text-center font-mono text-xs font-black tracking-[0.07em] text-white sm:text-sm">{code}</p>
          <div className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-300/[0.08] p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.11em] text-emerald-200">PlotDNA score</p>
            <p className="mt-1 text-2xl font-black text-emerald-300">{area.score}<span className="text-xs text-slate-400">/100</span></p>
            <p className="mt-1 text-[9px] font-semibold text-slate-300">{confidence.label} confidence</p>
          </div>
        </div>
      </section>

      <section className="grid gap-0 border-b border-dashed border-cyan-200/25 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="divide-y divide-white/10 px-4 sm:px-6">
          <PassRow icon={<ShieldCheck size={16} />} label="Verdict" value={getScoreLabel(area.score)} detail={`${risk}. ${area.category} market.`} tone="cyan" />
          <PassRow icon={<IndianRupee size={16} />} label="Money range" value={area.priceRange} detail="Compare against the seller quote." tone="amber" />
          <PassRow icon={<TrendingUp size={16} />} label="Growth reason" value={area.highlights[0] ?? 'Locality signal needs verification'} detail={area.highlights[1] ?? 'Confirm demand on the ground.'} tone="green" />
        </div>
        <div className="border-t border-dashed border-cyan-200/25 bg-slate-950/20 p-4 sm:border-l sm:border-t-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-200">Area signal proof</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ProofMetric icon={<Building2 size={15} />} label="Infra" value={`${area.signals.infrastructure}/100`} />
            {area.livability?.connectivity ? <ProofMetric icon={<RadioTower size={15} />} label="Connect" value={`${area.livability.connectivity}/100`} /> : <ProofMetric icon={<ShieldCheck size={15} />} label="Risk" value={risk} />}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <ProofMetric icon={<TrendingUp size={15} />} label="5-year" value={growthOutlook(5)} />
            <ProofMetric icon={<TrendingUp size={15} />} label="10-year" value={growthOutlook(10)} />
          </div>
          <p className="mt-2 text-[8px] leading-3 text-slate-500">Directional outlook, not a guaranteed forecast.</p>
        </div>
      </section>

      <section className="px-4 py-4 sm:px-6">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-200">Top 3 checks before paying</p>
        <div className="mt-2 space-y-1.5">
          {checks.map(check => <p key={check} className="flex items-start gap-2 text-[10px] leading-4 text-slate-200"><CircleCheck size={12} className="mt-0.5 shrink-0 text-emerald-300" />{check}</p>)}
        </div>
      </section>

      {accessState && (
        <section className="mx-4 mb-4 rounded-xl border border-amber-200/30 bg-amber-200/[0.09] p-4 sm:mx-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200">Founder Pass</p>
          <p className="mt-1 text-base font-black">{accessState.upgradeRequired ? 'Unlock Founder Pass — ₹99 Lifetime Access' : 'Founder Pass active'}</p>
          {accessState.upgradeRequired && paymentLink && <a href={paymentLink} className="btn-3d-reflective mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(115deg,#f59e0b_0%,#facc15_28%,#2dd4bf_67%,#38bdf8_100%)] px-4 text-sm font-black text-slate-950">Unlock Founder Pass <ArrowRight size={16} /></a>}
        </section>
      )}

      <footer className="flex items-center justify-between gap-3 border-t border-dashed border-cyan-200/25 bg-slate-950/20 px-4 py-3 text-[8px] text-slate-400 sm:px-6">
        <span className="font-black uppercase tracking-[0.12em] text-cyan-200">PlotDNA Area Pass</span>
        <span className="max-w-[220px] text-right leading-3">Buyer-side location intelligence, not legal or approval certification.</span>
      </footer>
    </article>
  )
}

function PassRow({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: 'cyan' | 'amber' | 'green' }) {
  const toneClass = tone === 'amber' ? 'border-amber-300/25 bg-amber-300/10 text-amber-200' : tone === 'green' ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200'
  return <div className="flex gap-3 py-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${toneClass}`}>{icon}</span><div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[0.11em] text-slate-400">{label}</p><p className="mt-0.5 text-xs font-black leading-4 text-white">{value}</p><p className="mt-0.5 text-[9px] leading-3 text-slate-400">{detail}</p></div></div>
}

function ProofMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2"><span className="text-cyan-200">{icon}</span><p className="mt-2 text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p><p className="mt-0.5 text-xs font-black text-white">{value}</p></div>
}
