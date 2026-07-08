import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, BarChart3, CheckCircle2, FileText, IndianRupee, Shield, TrendingUp, X } from 'lucide-react'
import { CITIES } from '@/data/cities'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import { getInvestmentReportSummary } from '@/lib/investmentReport'
import { trackEvent } from '@/lib/analytics'
import { getLandDnaCardPath } from '@/lib/landDnaCard'
import { featureFlags } from '@/lib/features'
import { getSelectableCompareSlugs, parseCompareAreaParams } from '@/lib/compareSelection'

const CITY_SLUG = 'hyderabad'

function isSafeReturnPath(path: string | null) {
  return Boolean(path && (path.startsWith('/area/') || path.startsWith('/map')))
}

export default function CompareAreas() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const cityEntry = CITIES[CITY_SLUG]
  const areasParam = searchParams.get('areas')
  const areaBySlug = useMemo(
    () => new Map(cityEntry.areas.map(area => [area.slug, area])),
    [cityEntry.areas],
  )
  const availableSlugs = useMemo(() => cityEntry.areas.map(area => area.slug), [cityEntry.areas])
  const selectedSlugs = useMemo(
    () => parseCompareAreaParams(areasParam, availableSlugs),
    [areasParam, availableSlugs],
  )
  const selectedAreas = useMemo(
    () => selectedSlugs.map(slug => areaBySlug.get(slug) ?? cityEntry.areas[0]),
    [areaBySlug, cityEntry.areas, selectedSlugs],
  )
  const primaryAreas = selectedAreas.slice(0, 2)
  const returnToParam = searchParams.get('returnTo')
  const dnaReturnPath = isSafeReturnPath(returnToParam)
    ? returnToParam!
    : `/area/${selectedAreas[0]?.slug ?? 'adibatla'}`
  const bestArea = selectedAreas.reduce((best, area) => area.score > best.score ? area : best, selectedAreas[0])
  const stableArea = selectedAreas.reduce((best, area) => area.score >= best.score && area.yoy <= best.yoy ? area : best, selectedAreas[0])

  useEffect(() => {
    trackEvent('compare_started', {
      citySlug: CITY_SLUG,
      areas: selectedAreas.map(area => area.slug).join(','),
      source: 'compare_page',
    })
  }, [selectedAreas])

  function updateSelection(index: number, slug: string) {
    const next = [...selectedAreas.map(area => area.slug)]
    next[index] = slug
    trackEvent('compare_area_changed', {
      citySlug: CITY_SLUG,
      index,
      areaSlug: slug,
      areas: next.join(','),
    })
    setSearchParams({ areas: next.join(','), returnTo: dnaReturnPath })
  }

  return (
    <div className="min-h-[100dvh] body pb-28 text-slate-100">
      <nav className="sticky top-0 z-50 flex h-13 items-center justify-between border-b border-white/5 px-4 glass-panel sm:px-6">
        <button
          onClick={() => navigate(dnaReturnPath)}
          className="flex items-center gap-2 text-sm font-sans text-slate-400 transition-colors hover:text-slate-100"
        >
          <ArrowLeft size={15} />
          <span>Verdict</span>
        </button>
        <div className="flex items-center gap-2.5">
          <img src="/plotdna-logo.png" alt="PlotDNA" className="h-6 w-6 rounded-lg object-cover" />
          <span className="text-sm font-display font-bold text-slate-100">Compare</span>
        </div>
        <button
          type="button"
          onClick={() => navigate(dnaReturnPath)}
          aria-label="Close comparison and return to verdict"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
        >
          <X size={15} />
        </button>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <section className="rounded-2xl border border-cyan-300/16 bg-cyan-300/[0.06] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
              <BarChart3 size={19} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-black leading-tight text-slate-50">Which area is better for my money?</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Compare score, broker price range, gain signal, and risk before you decide where to visit.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Area selectors">
          {selectedAreas.map((area, index) => (
            <label key={`selector-${index}`} className="block rounded-xl border border-white/8 bg-slate-950/54 px-3 py-3">
              <span className="block text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">
                Area {index + 1}
              </span>
              <select
                value={area.slug}
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

        <section className="mt-4 grid grid-cols-2 gap-3" aria-label="Selected areas">
          {primaryAreas.map(area => {
            const color = getScoreColor(area.score)
            const summary = getInvestmentReportSummary(area)
            return (
              <article key={area.slug} className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
                <p className="truncate text-sm font-display font-black text-slate-50">{area.name}</p>
                <p className="mt-1 truncate text-[11px] text-slate-500">{area.category}</p>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">DNA</p>
                    <p className="mt-1 text-3xl font-display font-black leading-none" style={{ color }}>{area.score}</p>
                  </div>
                  <span className="rounded-full px-2 py-1 text-[10px] font-sans font-black" style={{ color, background: `${color}1a` }}>
                    {summary.verdict}
                  </span>
                </div>
              </article>
            )
          })}
        </section>

        <section className="mt-4 overflow-hidden rounded-2xl border border-white/8 bg-slate-950/62" aria-label="Buyer comparison table">
          {[
            ['PlotDNA Score', primaryAreas.map(area => `${area.score}/100`)],
            ['Money range', primaryAreas.map(area => area.priceRange)],
            ['Gain signal', primaryAreas.map(area => `+${area.yoy}% YoY`)],
            ['Risk level', primaryAreas.map(area => area.score >= 80 ? 'Lower risk' : area.score >= 60 ? 'Medium risk' : 'High risk')],
            ['Best use', primaryAreas.map(area => getInvestmentReportSummary(area).bestFor)],
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

        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          <DecisionCard icon={TrendingUp} title="Best for growth" areaName={bestArea.name} detail={`DNA ${bestArea.score} / ${getScoreLabel(bestArea.score)}`} tone="#34d399" />
          <DecisionCard icon={Shield} title="Best for stability" areaName={stableArea.name} detail={`Risk view: ${stableArea.score >= 80 ? 'lower' : 'verify carefully'}`} tone="#fbbf24" />
        </section>

        <section className="mt-4 rounded-2xl border border-emerald-300/18 bg-emerald-300/[0.07] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" />
            <div>
              <p className="text-base font-sans font-black text-slate-50">Shortlist decision</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">
                {bestArea.name} currently looks stronger on the area intelligence view. Still verify access, documents, and latest price before token.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              to={`/area/${bestArea.slug}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-sans font-black text-slate-100"
            >
              <BadgeCheck size={16} />
              Open verdict
            </Link>
            <Link
              to={featureFlags.enableLandDnaCard ? getLandDnaCardPath(cityEntry.meta.name, bestArea) : `/area/${bestArea.slug}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-sans font-black text-slate-950 transition-colors hover:bg-cyan-200"
            >
              <FileText size={16} />
              Generate Area Pass
            </Link>
          </div>
        </section>
      </main>

      <nav
        aria-label="PlotDNA compare footer navigation"
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto grid max-w-[640px] grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-slate-950/92 p-2 shadow-[0_18px_44px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      >
        {[
          { label: 'Verdict', icon: BadgeCheck, to: dnaReturnPath },
          { label: 'Money', icon: IndianRupee, to: dnaReturnPath },
          { label: 'Compare', icon: BarChart3, to: null },
          { label: 'Pass', icon: FileText, to: featureFlags.enableLandDnaCard ? getLandDnaCardPath(cityEntry.meta.name, bestArea) : `/area/${bestArea.slug}` },
        ].map(item => {
          const Icon = item.icon
          const active = item.label === 'Compare'
          const content = (
            <span className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-sans font-black ${active ? 'bg-emerald-400/14 text-emerald-300' : 'text-slate-500'}`}>
              <Icon size={15} />
              {item.label}
            </span>
          )
          return item.to ? <Link key={item.label} to={item.to}>{content}</Link> : <span key={item.label}>{content}</span>
        })}
      </nav>
    </div>
  )
}

function DecisionCard({
  icon: Icon,
  title,
  areaName,
  detail,
  tone,
}: {
  icon: typeof TrendingUp
  title: string
  areaName: string
  detail: string
  tone: string
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" style={{ color: tone, borderColor: `${tone}44`, background: `${tone}12` }}>
          <Icon size={17} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-sans font-black text-slate-50">{title}</p>
          <p className="mt-1 text-lg font-display font-black" style={{ color: tone }}>{areaName}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  )
}
