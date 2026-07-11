import { ArrowRight, BadgeCheck, CheckCircle2, MapPin, ShieldCheck, TrendingUp } from 'lucide-react'
import type { Ref } from 'react'
import type { MicroMarket } from '@/types'
import type { LandDnaAccessState } from '@/lib/founderPass/landDnaPlan'
import { getLandDnaAreaCode } from '@/lib/landDnaCard'
import { BUYER_DUE_DILIGENCE_CHECKLIST, getInvestmentReportSummary } from '@/lib/investmentReport'
import { getScoreLabel } from '@/lib/utils'
import { buildAreaStoryPath } from '@/features/areaStory/areaStoryNav'

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
  const summary = getInvestmentReportSummary(area)
  const code = getLandDnaAreaCode(cityName, area)

  return (
    <article ref={cardRef} className="mx-auto w-full max-w-[680px] overflow-hidden rounded-2xl bg-[#f5f7f4] text-slate-950">
      <header className="border-b border-slate-900/10 px-5 py-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-black tracking-[0.18em] text-emerald-700">PLOTDNA AREA PASS</p>
          <BadgeCheck size={20} className="text-emerald-700" />
        </div>
        <h1 className="mt-5 break-words text-4xl font-black leading-none tracking-[-0.035em]">{area.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
          <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{cityName}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tracking-[0.08em]">{code}</span>
        </div>
      </header>

      <section className="grid grid-cols-2 divide-x divide-slate-900/10 border-b border-slate-900/10">
        <div className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Verdict</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">{summary.verdict}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">{getScoreLabel(area.score)} · {area.score}/100</p>
        </div>
        <div className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Money risk</p>
          <p className="mt-2 text-2xl font-black text-amber-700">{riskFromScore(area.score)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">Quoted range {area.priceRange}</p>
        </div>
      </section>

      <section className="border-b border-slate-900/10 p-5">
        <div className="flex items-start gap-3">
          <TrendingUp size={18} className="mt-0.5 shrink-0 text-emerald-700" />
          <div>
            <h2 className="text-sm font-black">Growth reason</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{summary.mainUpside}</p>
          </div>
        </div>
      </section>

      <section className="p-5">
        <div className="mb-3 flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-700" /><h2 className="text-sm font-black">Top checks before token</h2></div>
        <ul className="space-y-2.5">
          {BUYER_DUE_DILIGENCE_CHECKLIST.slice(0, 3).map(item => (
            <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-700" />{item}</li>
          ))}
        </ul>
      </section>

      <footer className="flex items-center justify-between gap-4 bg-slate-950 px-5 py-4 text-slate-100">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Share code</p>
          <p className="mt-1 font-mono text-xs font-bold">{code}</p>
        </div>
        <p className="max-w-[190px] text-right text-[10px] leading-relaxed text-slate-400">Buyer-side screening only. Verify documents, access, approvals, and latest pricing.</p>
      </footer>

      {accessState && (
        <section className="flex items-center justify-between gap-4 border-t border-slate-900/10 bg-amber-50 px-5 py-4">
          <div><p className="text-sm font-black">Founder Pass</p><p className="text-xs text-slate-600">Rs 99 lifetime access</p></div>
          <a href={buildAreaStoryPath(area.slug, 'verdict')} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-black text-white">View access <ArrowRight size={14} /></a>
        </section>
      )}
    </article>
  )
}
