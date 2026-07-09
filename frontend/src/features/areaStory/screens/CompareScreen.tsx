import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, TrendingUp, Shield, FileText } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { CITIES } from '@/data/cities'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import { getInvestmentReportSummary } from '@/lib/investmentReport'
import { trackEvent } from '@/lib/analytics'
import { getSelectableCompareSlugs, parseCompareAreaParams } from '@/lib/compareSelection'
import { buildAreaStoryPath } from '../areaStoryNav'

interface CompareScreenProps {
  area: MicroMarket
}

const CITY_SLUG = 'hyderabad'

export default function CompareScreen({ area }: CompareScreenProps) {
  const cityEntry = CITIES[CITY_SLUG]
  const areaBySlug = useMemo(
    () => new Map(cityEntry.areas.map(a => [a.slug, a])),
    [cityEntry.areas],
  )
  const availableSlugs = useMemo(() => cityEntry.areas.map(a => a.slug), [cityEntry.areas])
  const [selectedSlugs, setSelectedSlugs] = useState(() =>
    parseCompareAreaParams(area.slug, availableSlugs),
  )
  const selectedAreas = useMemo(
    () => selectedSlugs.map(slug => areaBySlug.get(slug) ?? cityEntry.areas[0]),
    [areaBySlug, cityEntry.areas, selectedSlugs],
  )
  const primaryAreas = selectedAreas.slice(0, 2)
  const bestArea = selectedAreas.reduce((best, a) => a.score > best.score ? a : best, selectedAreas[0])
  const stableArea = selectedAreas.reduce((best, a) => a.score >= best.score && a.yoy <= best.yoy ? a : best, selectedAreas[0])

  useEffect(() => {
    trackEvent('compare_started', {
      citySlug: CITY_SLUG,
      areas: selectedAreas.map(a => a.slug).join(','),
      source: 'area_story_compare_screen',
    })
  }, [selectedAreas])

  function updateSelection(index: number, slug: string) {
    const next = [...selectedSlugs]
    next[index] = slug
    trackEvent('compare_area_changed', {
      citySlug: CITY_SLUG,
      index,
      areaSlug: slug,
      areas: next.join(','),
    })
    setSelectedSlugs(next)
  }

  return (
    <div>
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
          <BarChart3 size={19} />
        </span>
        <div>
          <p className="font-display text-xl font-black leading-tight text-slate-50">Which area is better for my money?</p>
          <p className="mt-1 text-xs text-slate-500">Compare key factors that matter most before you buy.</p>
        </div>
      </header>

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Area selectors">
        {selectedAreas.map((a, index) => (
          <label key={`selector-${index}`} className="block rounded-xl border border-white/8 bg-slate-950/54 px-3 py-3">
            <span className="block text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">
              Area {index + 1}
            </span>
            <select
              value={a.slug}
              onChange={event => updateSelection(index, event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-[#080a16] px-3 py-2 text-sm font-sans text-slate-100 outline-none focus:border-emerald-500/50"
            >
              {getSelectableCompareSlugs(selectedSlugs, index, availableSlugs).map(slug => {
                const option = areaBySlug.get(slug)
                if (!option) return null
                return <option key={option.slug} value={option.slug}>{option.name}</option>
              })}
            </select>
          </label>
        ))}
      </section>

      <section className="mb-4 overflow-hidden rounded-2xl border border-white/8 bg-slate-950/62" aria-label="Buyer comparison table">
        {[
          ['PlotDNA Score', primaryAreas.map(a => `${a.score}/100`)],
          ['Money range', primaryAreas.map(a => a.priceRange)],
          ['Gain signal', primaryAreas.map(a => `+${a.yoy}% YoY`)],
          ['Risk level', primaryAreas.map(a => a.score >= 80 ? 'Lower risk' : a.score >= 60 ? 'Medium risk' : 'High risk')],
          ['Best use', primaryAreas.map(a => getInvestmentReportSummary(a).bestFor)],
        ].map(([label, values]) => (
          <div key={label as string} className="grid grid-cols-[0.9fr_1fr_1fr] border-b border-white/6 last:border-b-0">
            <div className="bg-white/[0.025] px-3 py-3 text-[11px] font-sans font-bold uppercase tracking-[0.08em] text-slate-500">
              {label as string}
            </div>
            {(values as string[]).map((value, index) => (
              <div key={`${label}-${index}`} className="px-3 py-3 text-xs font-sans font-bold leading-relaxed text-slate-200">
                {value}
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" style={{ color: '#34d399', borderColor: '#34d39944', background: '#34d39912' }}>
              <TrendingUp size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-sans font-black text-slate-50">Best for growth</p>
              <p className="mt-1 text-lg font-display font-black" style={{ color: '#34d399' }}>{bestArea.name}</p>
              <p className="mt-1 text-xs text-slate-500">DNA {bestArea.score} / {getScoreLabel(bestArea.score)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" style={{ color: '#fbbf24', borderColor: '#fbbf2444', background: '#fbbf2412' }}>
              <Shield size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-sans font-black text-slate-50">Best for stability</p>
              <p className="mt-1 text-lg font-display font-black" style={{ color: '#fbbf24' }}>{stableArea.name}</p>
              <p className="mt-1 text-xs text-slate-500">Risk view: {stableArea.score >= 80 ? 'lower' : 'verify carefully'}</p>
            </div>
          </div>
        </div>
      </section>

      <Link
        to={buildAreaStoryPath(bestArea.slug, 'pass')}
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-sans font-black text-slate-950"
        style={{ background: `linear-gradient(90deg, ${getScoreColor(bestArea.score)}, #38bdf8)` }}
      >
        <FileText size={16} />
        Generate Area Pass
      </Link>
    </div>
  )
}
