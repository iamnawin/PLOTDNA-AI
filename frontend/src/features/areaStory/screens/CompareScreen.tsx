import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, FileText, ShieldCheck, TrendingUp, WalletCards } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { CITIES, getCityForArea } from '@/data/cities'
import { getInvestmentReportSummary } from '@/lib/investmentReport'
import { trackEvent } from '@/lib/analytics'
import { getSelectableCompareSlugs, parseCompareAreaParams } from '@/lib/compareSelection'
import { buildAreaStoryPath } from '../areaStoryNav'

interface CompareScreenProps { area: MicroMarket }

function riskLabel(area: MicroMarket) {
  return area.score >= 80 ? 'Lower risk' : area.score >= 60 ? 'Medium risk' : 'High risk'
}

export default function CompareScreen({ area }: CompareScreenProps) {
  const cityEntry = getCityForArea(area.slug) ?? CITIES.hyderabad
  const areaBySlug = useMemo(() => new Map(cityEntry.areas.map(item => [item.slug, item])), [cityEntry.areas])
  const availableSlugs = useMemo(() => cityEntry.areas.map(item => item.slug), [cityEntry.areas])
  const [selectedSlugs, setSelectedSlugs] = useState(() => parseCompareAreaParams(area.slug, availableSlugs))
  const selectedAreas = useMemo(
    () => selectedSlugs.map(slug => areaBySlug.get(slug) ?? cityEntry.areas[0]),
    [areaBySlug, cityEntry.areas, selectedSlugs],
  )

  const growthWinner = selectedAreas.reduce((best, item) => item.yoy > best.yoy ? item : best, selectedAreas[0])
  const stabilityWinner = selectedAreas.reduce((best, item) => item.score > best.score ? item : best, selectedAreas[0])
  const valueWinner = selectedAreas.reduce((best, item) => (item.signals.priceVelocity ?? 0) > (best.signals.priceVelocity ?? 0) ? item : best, selectedAreas[0])

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
    trackEvent('compare_area_changed', { citySlug: cityEntry.meta.slug, index, areaSlug: slug, areas: next.join(',') })
  }

  const metrics = [
    { label: 'PlotDNA score', values: selectedAreas.map(item => `${item.score}/100`) },
    { label: 'Money range', values: selectedAreas.map(item => item.priceRange) },
    { label: 'Gain signal', values: selectedAreas.map(item => `+${item.yoy}% YoY`) },
    { label: 'Risk', values: selectedAreas.map(riskLabel) },
    { label: 'Best use', values: selectedAreas.map(item => getInvestmentReportSummary(item).bestFor) },
  ]

  return (
    <div>
      <header className="mb-5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200"><BarChart3 size={19} /></span>
        <div>
          <h1 className="text-xl font-black leading-tight text-slate-50">Which area is better for my money?</h1>
          <p className="mt-1 text-xs text-slate-400">Compare the buyer signals that matter before you pay.</p>
        </div>
      </header>

      <section className="mb-4 grid gap-2" aria-label="Area selectors">
        {selectedAreas.map((item, index) => (
          <label key={`selector-${index}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-[10px] font-bold text-slate-400">{index + 1}</span>
            <select value={item.slug} onChange={event => updateSelection(index, event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-100 outline-none">
              {getSelectableCompareSlugs(selectedSlugs, index, availableSlugs).map(slug => {
                const option = areaBySlug.get(slug)
                return option ? <option key={slug} value={slug} className="bg-slate-950">{option.name}</option> : null
              })}
            </select>
          </label>
        ))}
      </section>

      <section className="mb-5 grid grid-cols-3 gap-2" aria-label="Comparison winners">
        {[
          { label: 'Growth', area: growthWinner, icon: TrendingUp },
          { label: 'Stability', area: stabilityWinner, icon: ShieldCheck },
          { label: 'Value', area: valueWinner, icon: WalletCards },
        ].map(({ label, area: winner, icon: Icon }) => (
          <div key={label} className="min-w-0 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] p-2.5">
            <Icon size={14} className="text-emerald-300" />
            <p className="mt-2 text-[10px] text-slate-400">Best {label.toLowerCase()}</p>
            <p className="mt-0.5 truncate text-xs font-black text-slate-100">{winner.name}</p>
          </div>
        ))}
      </section>

      <section className="mb-5 space-y-3" aria-label="Buyer comparison metrics">
        {metrics.map(metric => (
          <article key={metric.label} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
            <h2 className="border-b border-white/8 px-3 py-2 text-xs font-black text-slate-200">{metric.label}</h2>
            <div className="grid grid-cols-3 divide-x divide-white/8">
              {metric.values.map((value, index) => (
                <div key={`${metric.label}-${selectedAreas[index].slug}`} className="min-w-0 px-2.5 py-3">
                  <p className="truncate text-[10px] font-bold text-emerald-300">{selectedAreas[index].name}</p>
                  <p className="mt-1 break-words text-xs font-semibold leading-relaxed text-slate-200">{value}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <Link to={buildAreaStoryPath(growthWinner.slug, 'pass')} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3.5 text-sm font-black text-slate-950 active:scale-[0.99]">
        <FileText size={16} /> Generate Area Pass
      </Link>
    </div>
  )
}
