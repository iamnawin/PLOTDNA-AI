import { useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  Gauge,
  MapPinCheck,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import type { MicroMarket } from '@/types'
import type { CityEntry } from '@/data/cities'
import { buildAreaStoryBrief, SELLER_QUESTIONS, VERIFICATION_GROUPS } from '@/lib/areaStoryBrief'

interface AreaDetailsScreenProps {
  area: MicroMarket
  city: CityEntry
  usesNearbySignals?: boolean
}

const MANUAL_CHECKS = ['RERA checked', 'Land record checked', 'Market value checked', 'EC/title checked', 'Site visit checked']

export default function AreaDetailsScreen({ area, city, usesNearbySignals = false }: AreaDetailsScreenProps) {
  const [checked, setChecked] = useState<string[]>([])
  const brief = buildAreaStoryBrief(area, city.meta.slug, usesNearbySignals)

  function toggleCheck(item: string) {
    setChecked(current => current.includes(item) ? current.filter(value => value !== item) : [...current, item])
  }

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-xl font-black leading-tight text-slate-50">Area Story</h1>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{area.name} · Infrastructure, demand, risks, and checks before token</p>
      </header>

      <section className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-300" />
          <h2 className="text-sm font-black text-slate-100">What is happening here?</h2>
        </div>
        <p className="text-xs leading-5 text-slate-300">{brief.story}</p>
        {brief.fallbackWarning && <p className="mt-3 rounded-xl bg-amber-300/10 px-3 py-2 text-[11px] font-semibold leading-4 text-amber-200">{brief.fallbackWarning}</p>}
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Building2 size={16} className="text-cyan-300" />
          <h2 className="text-sm font-black text-slate-100">Roads and nearby development</h2>
        </div>
        <div className="divide-y divide-white/8">
          {brief.signals.map(signal => (
            <div key={signal.title} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold text-slate-200">{signal.title}</p>
                <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-2 py-1 text-[9px] font-bold text-cyan-200">{signal.status}</span>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">{signal.meaning}</p>
              <p className="mt-1 text-[9px] font-semibold text-slate-500">{signal.confidence}</p>
            </div>
          ))}
        </div>
      </section>

      {brief.demandDrivers.length > 0 && (
        <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-emerald-300" /><h2 className="text-sm font-black text-slate-100">Why buyers may be interested</h2></div>
          <ul className="space-y-2">
            {brief.demandDrivers.map(driver => <li key={driver} className="flex gap-2 text-xs leading-5 text-slate-300"><CheckCircle2 size={13} className="mt-1 shrink-0 text-emerald-400" />{driver}</li>)}
          </ul>
          <p className="mt-3 text-[10px] text-slate-500">Directional locality signals only. They do not promise appreciation.</p>
        </section>
      )}

      <section className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-4">
        <div className="mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-300" /><h2 className="text-sm font-black text-slate-100">Where you may lose money</h2></div>
        <ul className="space-y-2">{brief.uncertainties.map(item => <li key={item} className="text-xs leading-5 text-slate-300">{item}</li>)}</ul>
      </section>

      <section className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4">
        <div className="mb-2 flex items-center gap-2"><CircleHelp size={16} className="text-cyan-300" /><h2 className="text-sm font-black text-slate-100">What this means for a buyer</h2></div>
        <p className="text-xs leading-5 text-slate-300">{brief.buyerMeaning}</p>
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-300" /><h2 className="text-sm font-black text-slate-100">What to verify before paying token</h2></div>
        <div className="space-y-2">
          {VERIFICATION_GROUPS.map((group, index) => (
            <details key={group.title} open={index === 0} className="group rounded-xl border border-white/8 bg-slate-950/35 px-3 py-2.5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-slate-100">
                {group.title}<ChevronDown size={14} className="text-slate-500 transition-transform group-open:rotate-180" />
              </summary>
              <ul className="mt-2 space-y-2 border-t border-white/6 pt-2">
                {group.items.map(item => <li key={item} className="flex gap-2 text-[11px] leading-4 text-slate-400"><ShieldCheck size={12} className="mt-0.5 shrink-0 text-emerald-400/80" />{item}</li>)}
              </ul>
            </details>
          ))}
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center gap-2"><MessageSquareText size={16} className="text-cyan-300" /><h2 className="text-sm font-black text-slate-100">Ask seller or broker</h2></div>
        <ol className="space-y-2.5">{SELLER_QUESTIONS.map((question, index) => <li key={question} className="flex gap-2 text-[11px] leading-4 text-slate-300"><span className="font-bold text-cyan-300">{index + 1}.</span>{question}</li>)}</ol>
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center gap-2"><MapPinCheck size={16} className="text-emerald-300" /><h2 className="text-sm font-black text-slate-100">Where to verify this</h2></div>
        <div className="space-y-2">
          {brief.sources.map(source => (
            <article key={source.id} className="rounded-xl bg-slate-950/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="text-xs font-bold text-slate-100">{source.title}</h3><p className="mt-1 text-[10px] leading-4 text-slate-400">{source.description}</p></div>
                <span className="shrink-0 text-[9px] font-bold uppercase text-slate-500">{source.sourceType === 'gov' ? 'Official' : source.sourceType}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[9px] font-semibold text-amber-200">{source.statusLabel}</span>
                {source.url && <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300">Open source <ExternalLink size={11} /></a>}
              </div>
              <p className="mt-2 text-[9px] leading-3 text-slate-500">{source.warning}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-sm font-black text-slate-100">My manual checks</h2>
        <p className="mt-1 text-[10px] text-slate-500">Stored only on this screen. These checks do not change the score.</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MANUAL_CHECKS.map(item => <label key={item} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950/35 px-3 text-xs text-slate-300"><input type="checkbox" checked={checked.includes(item)} onChange={() => toggleCheck(item)} className="accent-emerald-400" />{item}</label>)}
        </div>
      </section>

      <section className="mb-4 rounded-2xl border px-4 py-3" style={{ borderColor: `${brief.confidence.tone}30`, background: `${brief.confidence.tone}0c` }}>
        <div className="flex items-start gap-2"><Gauge size={16} style={{ color: brief.confidence.tone }} /><div><h2 className="text-sm font-black text-slate-100">How much information do we have?</h2><p className="mt-1 text-xs font-bold" style={{ color: brief.confidence.tone }}>{brief.confidence.label}</p><p className="mt-1 text-[11px] leading-4 text-slate-400">{brief.confidence.description}</p></div></div>
        <ul className="mt-3 space-y-1.5 border-t border-white/8 pt-3">{brief.confidenceReasons.map(reason => <li key={reason} className="text-[10px] text-slate-400">{reason}</li>)}</ul>
      </section>

      <section className="mb-6 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-4">
        <div className="mb-2 flex items-center gap-2"><BadgeCheck size={16} className="text-emerald-300" /><h2 className="text-sm font-black text-slate-100">Buyer action recommendation</h2></div>
        <p className="text-xs font-semibold leading-5 text-emerald-100">{brief.recommendation}</p>
        <p className="mt-2 text-[10px] leading-4 text-slate-400">Verify road access, approvals, documents, and price before paying token.</p>
      </section>

    </div>
  )
}
