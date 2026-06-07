import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, CheckCircle2, Shield, TrendingUp, X } from 'lucide-react'
import { CITIES } from '@/data/cities'
import { getScoreColor } from '@/lib/utils'
import { getInvestmentReportSummary } from '@/lib/investmentReport'
import { trackEvent } from '@/lib/analytics'
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
  const returnToParam = searchParams.get('returnTo')
  const dnaReturnPath = isSafeReturnPath(returnToParam)
    ? returnToParam!
    : `/area/${selectedAreas[0]?.slug ?? 'adibatla'}`

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
    setSearchParams({ areas: next.join(',') })
  }

  return (
    <div className="min-h-screen body text-slate-100">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 h-13 glass-panel border-b border-white/5">
        <button
          onClick={() => navigate(dnaReturnPath)}
          className="flex items-center gap-2 text-[#94a3b8] hover:text-slate-100 transition-colors text-sm font-sans"
        >
          <ArrowLeft size={15} />
          <span>Full DNA</span>
        </button>
        <div className="flex items-center gap-2.5">
          <img src="/plotdna-logo.png" alt="PlotDNA" className="w-6 h-6 rounded-lg object-cover" />
          <span className="font-display font-bold text-slate-100 text-sm">PlotDNA</span>
        </div>
        <button
          type="button"
          onClick={() => navigate(dnaReturnPath)}
          aria-label="Close comparison and return to full DNA report"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
        >
          <X size={15} />
        </button>
      </nav>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-emerald-400">
            <BarChart3 size={12} />
            Hyderabad investment comparison
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-3xl sm:text-5xl font-extrabold leading-tight text-slate-100">
            Compare three micro-markets before you shortlist a site visit.
          </h1>
          <p className="mt-4 max-w-2xl text-sm sm:text-base font-sans leading-7 text-slate-400">
            Use this as a buyer-side screening view. PlotDNA compares score, price band, growth, verdict, and verification risk, but title, RERA, zoning, access, and latest pricing still need independent checks.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Area selectors">
          {selectedAreas.map((area, index) => (
            <label key={`selector-${index}`} className="block rounded-2xl border border-white/5 glass-panel-light px-3 py-3">
              <span className="block text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">
                Area {index + 1}
              </span>
              <select
                value={area.slug}
                onChange={event => updateSelection(index, event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#080a16] px-3 py-2 text-sm font-sans text-slate-100 outline-none focus:border-emerald-500/50"
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

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-label="Area comparison">
          {selectedAreas.map((area, index) => {
            const verdict = getInvestmentReportSummary(area)
            const color = getScoreColor(area.score)

            return (
              <article key={`comparison-${index}`} className="rounded-2xl border border-white/5 glass-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">
                      {area.category}
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-extrabold text-slate-100">{area.name}</h2>
                  </div>
                  <div className="rounded-2xl border px-3 py-2 text-center" style={{ borderColor: `${color}55`, color }}>
                    <p className="font-display text-2xl font-extrabold leading-none">{area.score}</p>
                    <p className="mt-1 text-[9px] font-sans font-bold uppercase tracking-[0.12em]">DNA</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/[0.03] px-3 py-2">
                    <p className="text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">Price</p>
                    <p className="mt-1 text-xs font-sans font-bold leading-snug text-slate-200">{area.priceRange}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] px-3 py-2">
                    <p className="text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">YoY</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-display font-bold" style={{ color }}>
                      <TrendingUp size={12} />
                      +{area.yoy}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} style={{ color }} />
                    <p className="text-[10px] font-sans font-bold uppercase tracking-[0.12em]" style={{ color }}>
                      {verdict.verdict}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-sans font-bold text-slate-200">{verdict.bestFor}</p>
                  <p className="mt-2 text-xs font-sans leading-relaxed text-slate-400">{verdict.mainRisk}</p>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/5 px-3 py-3 text-amber-100">
                  <Shield size={13} className="mt-0.5 flex-shrink-0 text-amber-400" />
                  <p className="text-[11px] font-sans leading-relaxed">{verdict.nextVerification}</p>
                </div>

                <Link
                  to={`/area/${area.slug}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs font-sans font-bold text-slate-200 hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  Open full area report
                </Link>
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}
