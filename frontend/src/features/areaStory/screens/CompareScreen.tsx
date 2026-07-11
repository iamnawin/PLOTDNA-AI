import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, BarChart3, Bookmark, Check, ChevronDown, FileText,
  IndianRupee, MapPin, ShieldCheck, TrendingUp,
} from 'lucide-react'
import type { MicroMarket } from '@/types'
import { CITIES, getCityForArea } from '@/data/cities'
import { getConfidenceMeta } from '@/lib/cityProduction'
import { getInvestmentReportSummary } from '@/lib/investmentReport'
import { trackEvent } from '@/lib/analytics'
import { getSelectableCompareSlugs, parseCompareAreaParams } from '@/lib/compareSelection'
import { buildAreaStoryPath } from '../areaStoryNav'

interface CompareScreenProps { area: MicroMarket }

interface AreaCardMeta {
  badge: string
  verdict: string
  explanation: string
  tone: 'rose' | 'emerald' | 'sky'
}

function riskLabel(area: MicroMarket) {
  return area.score >= 80 ? 'Lower risk' : area.score >= 45 ? 'Medium risk' : 'High risk'
}

function exitPotential(area: MicroMarket) {
  if (area.score >= 80 && area.yoy >= 20) return 'Good'
  if (area.score >= 45) return 'Moderate'
  return 'Limited'
}

export default function CompareScreen({ area }: CompareScreenProps) {
  const cityEntry = getCityForArea(area.slug) ?? CITIES.hyderabad
  const areaBySlug = useMemo(() => new Map(cityEntry.areas.map(item => [item.slug, item])), [cityEntry.areas])
  const availableSlugs = useMemo(() => cityEntry.areas.map(item => item.slug), [cityEntry.areas])
  const [selectedSlugs, setSelectedSlugs] = useState(() => parseCompareAreaParams(area.slug, availableSlugs))
  const [saved, setSaved] = useState(false)
  const selectedAreas = useMemo(
    () => selectedSlugs.map(slug => areaBySlug.get(slug) ?? cityEntry.areas[0]),
    [areaBySlug, cityEntry.areas, selectedSlugs],
  )

  const growthWinner = selectedAreas.reduce((best, item) => item.yoy > best.yoy ? item : best, selectedAreas[0])
  const lowerRiskPool = selectedAreas.filter(item => item.score >= 80)
  const stabilityWinner = (lowerRiskPool.length > 0 ? lowerRiskPool : selectedAreas)
    .reduce((best, item) => item.yoy < best.yoy ? item : best)
  const valueWinner = selectedAreas.reduce((best, item) =>
    (item.signals.priceVelocity ?? 0) > (best.signals.priceVelocity ?? 0) ? item : best,
  selectedAreas[0])
  const carefulArea = selectedAreas.reduce((lowest, item) => item.score < lowest.score ? item : lowest, selectedAreas[0])

  useEffect(() => {
    trackEvent('compare_started', {
      citySlug: cityEntry.meta.slug,
      areas: selectedAreas.map(item => item.slug).join(','),
      source: 'area_story_compare_screen',
    })
  }, [cityEntry.meta.slug, selectedAreas])

  function updateSelection(index: number, slug: string) {
    const next = [...selectedSlugs]
    next[index] = slug
    setSelectedSlugs(next)
    setSaved(false)
    trackEvent('compare_area_changed', { citySlug: cityEntry.meta.slug, index, areaSlug: slug, areas: next.join(',') })
  }

  function saveComparison() {
    try {
      window.localStorage.setItem('plotdna:saved-comparison', JSON.stringify({ city: cityEntry.meta.slug, areas: selectedSlugs }))
      setSaved(true)
      trackEvent('comparison_saved', { citySlug: cityEntry.meta.slug, areas: selectedSlugs.join(',') })
    } catch {
      setSaved(false)
    }
  }

  function cardMeta(item: MicroMarket) {
    if (item.slug === carefulArea.slug && item.score < 60) {
      return { badge: 'Check carefully', verdict: 'Not the strongest pick', explanation: 'Needs careful price and document verification.', tone: 'rose' as const }
    }
    if (item.slug === growthWinner.slug) {
      return { badge: 'Best for growth', verdict: 'Strongest growth pick', explanation: 'Best balance of growth and value in this comparison.', tone: 'emerald' as const }
    }
    if (item.slug === stabilityWinner.slug) {
      return { badge: 'Best for lower risk', verdict: 'Stable growth pick', explanation: 'Lower risk with good long-term potential.', tone: 'sky' as const }
    }
    return { badge: 'Balanced option', verdict: 'Worth shortlisting', explanation: 'Compare the quoted price and documents before deciding.', tone: 'emerald' as const }
  }

  const buyerExplanation = `${growthWinner.name} looks stronger for growth and value. ${stabilityWinner.name} is close and may suit lower-risk buyers. ${carefulArea.name} needs careful price and document verification before shortlisting.`

  return (
    <div>
      <header className="mb-5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200"><BarChart3 size={19} /></span>
        <div>
          <h1 className="text-xl font-black leading-tight text-slate-50">Which area is better for my money?</h1>
          <p className="mt-1 text-xs text-slate-400">Compare up to 3 areas before you shortlist.</p>
        </div>
      </header>

      <section className="mb-5 grid gap-2 sm:grid-cols-3" aria-label="Area selectors">
        {selectedAreas.map((item, index) => (
          <label key={`selector-${index}`} className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-300/[0.08] text-[11px] font-black text-emerald-300">{index + 1}</span>
            <select value={item.slug} onChange={event => updateSelection(index, event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-100 outline-none">
              {getSelectableCompareSlugs(selectedSlugs, index, availableSlugs).map(slug => {
                const option = areaBySlug.get(slug)
                return option ? <option key={slug} value={slug} className="bg-slate-950">{option.name}</option> : null
              })}
            </select>
          </label>
        ))}
      </section>

      <section className="-mx-4 mb-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0" aria-label="Area comparison cards">
        {selectedAreas.map(item => <AreaCard key={item.slug} area={item} cityName={cityEntry.meta.name} meta={cardMeta(item)} />)}
      </section>

      <section className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.05] p-4" aria-label="PlotDNA recommendation">
        <h2 className="text-sm font-black text-emerald-300">PlotDNA recommendation</h2>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
          <Recommendation icon={TrendingUp} label="Best growth" value={growthWinner.name} />
          <Recommendation icon={ShieldCheck} label="Best lower risk" value={stabilityWinner.name} />
          <Recommendation icon={IndianRupee} label="Best value" value={valueWinner.name} />
          <Recommendation icon={AlertTriangle} label="Check carefully" value={carefulArea.name} warning />
        </div>
        <p className="mt-4 border-t border-white/8 pt-3 text-sm leading-relaxed text-slate-300">{buyerExplanation}</p>
      </section>

      <details className="mb-4 rounded-xl border border-white/10 bg-white/[0.025]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-xs font-bold text-slate-300">
          View detailed metric table <ChevronDown size={15} />
        </summary>
        <div className="overflow-x-auto border-t border-white/8 p-3">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead><tr className="text-slate-500"><th className="pb-2">Area</th><th>Score</th><th>Money</th><th>Gain</th><th>Risk</th><th>Exit</th></tr></thead>
            <tbody>{selectedAreas.map(item => <tr key={item.slug} className="border-t border-white/6 text-slate-300"><th className="py-2 font-bold text-slate-100">{item.name}</th><td>{item.score}/100</td><td>{item.priceRange}</td><td>+{item.yoy}%</td><td>{riskLabel(item)}</td><td>{exitPotential(item)}</td></tr>)}</tbody>
          </table>
        </div>
      </details>

      <div className="grid grid-cols-2 gap-2">
        <Link to={buildAreaStoryPath(growthWinner.slug, 'pass')} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-black text-slate-950 active:scale-[0.99]">
          <FileText size={16} /> Generate Area Pass
        </Link>
        <button type="button" onClick={saveComparison} className="flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-slate-200" aria-label="Save comparison">
          {saved ? <Check size={17} className="text-emerald-300" /> : <Bookmark size={17} />}<span>{saved ? 'Saved' : 'Save comparison'}</span>
        </button>
      </div>
      {saved && <p className="mt-2 text-center text-[11px] font-semibold text-emerald-300">Comparison saved on this device.</p>}
    </div>
  )
}

function AreaCard({ area, cityName, meta }: { area: MicroMarket; cityName: string; meta: AreaCardMeta }) {
  const summary = getInvestmentReportSummary(area)
  const confidence = getConfidenceMeta(area.dataConfidence)
  const toneBorder = meta.tone === 'rose' ? 'border-rose-400/30' : meta.tone === 'sky' ? 'border-sky-400/30' : 'border-emerald-400/30'
  const toneText = meta.tone === 'rose' ? 'text-rose-300' : meta.tone === 'sky' ? 'text-sky-300' : 'text-emerald-300'

  return (
    <article className={`w-[calc(100vw-3.5rem)] max-w-[340px] shrink-0 snap-center overflow-hidden rounded-2xl border bg-slate-950/55 sm:w-auto ${toneBorder}`}>
      <header className="p-4">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black text-slate-50">{area.name}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400"><MapPin size={13} />{cityName}</p></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${toneBorder} ${toneText}`}>{meta.badge}</span></div>
      </header>
      <div className="border-y border-white/8 px-4 py-3"><p className="text-[11px] text-slate-400">PlotDNA score</p><div className="mt-1 flex items-baseline gap-1"><strong className={`text-3xl ${toneText}`}>{area.score}</strong><span className="font-bold text-slate-500">/100</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${meta.tone === 'rose' ? 'bg-rose-400' : meta.tone === 'sky' ? 'bg-sky-400' : 'bg-emerald-400'}`} style={{ width: `${area.score}%` }} /></div></div>
      <dl className="divide-y divide-white/7 px-4">
        <Fact label="Money range" value={area.priceRange} />
        <Fact label="Gain signal" value={`+${area.yoy}% YoY`} />
        <Fact label="Risk level" value={riskLabel(area)} />
        <Fact label="Exit potential" value={exitPotential(area)} />
        <Fact label="Best use" value={meta.tone === 'rose' ? 'Only if price is attractive' : summary.bestFor} />
        <Fact label="Confidence" value={confidence.label} />
      </dl>
      <footer className="border-t border-white/8 p-4"><p className={`text-sm font-black ${toneText}`}>{meta.verdict}</p><p className="mt-1 text-xs leading-relaxed text-slate-400">{meta.explanation}</p></footer>
    </article>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[92px_1fr] gap-2 py-2.5"><dt className="text-[11px] text-slate-500">{label}</dt><dd className="text-xs font-bold leading-relaxed text-slate-200">{value}</dd></div>
}

function Recommendation({ icon: Icon, label, value, warning = false }: { icon: typeof TrendingUp; label: string; value: string; warning?: boolean }) {
  return <div className="flex min-w-0 items-start gap-2"><Icon size={16} className={warning ? 'mt-0.5 shrink-0 text-rose-300' : 'mt-0.5 shrink-0 text-emerald-300'} /><div className="min-w-0"><p className="text-[10px] text-slate-400">{label}</p><p className={`truncate text-xs font-black ${warning ? 'text-rose-300' : 'text-slate-100'}`}>{value}</p></div></div>
}
