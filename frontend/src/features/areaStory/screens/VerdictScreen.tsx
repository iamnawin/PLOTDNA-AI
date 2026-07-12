import { ArrowRight, BookOpen, Download, Map, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { MicroMarket } from '@/types'
import type { CityEntry } from '@/data/cities'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import { getConfidenceMeta } from '@/lib/cityProduction'
import VerdictCard from '@/components/ui/VerdictCard'
import { buildAreaStoryPath } from '../areaStoryNav'
import type { AreaStoryFallbackContext } from '../areaStoryNav'

interface VerdictScreenProps {
  area: MicroMarket
  city: CityEntry
  fallbackContext?: AreaStoryFallbackContext
}

function getBuyerVerdict(area: MicroMarket) {
  if (area.dataConfidence === 'uncovered') return 'Not enough details'
  if (area.score >= 66) return 'Good to shortlist'
  if (area.score >= 41) return 'Check carefully'
  return 'Avoid for now'
}

function getRiskLabel(score: number) {
  if (score >= 66) return 'Low'
  if (score >= 41) return 'Medium'
  return 'High'
}

export default function VerdictScreen({ area, city, fallbackContext }: VerdictScreenProps) {
  const scoreColor = getScoreColor(area.score)
  const scoreLabel = getScoreLabel(area.score)
  const confidenceMeta = getConfidenceMeta(area.dataConfidence)

  return (
    <div>
      <section
        className="mb-4 overflow-hidden rounded-2xl border p-5 sm:p-6"
        style={{ borderColor: `${scoreColor}35`, background: `linear-gradient(145deg, ${scoreColor}12, rgba(15,23,42,0.72))` }}
      >
        <header className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
            style={{ color: scoreColor, borderColor: `${scoreColor}44`, background: `${scoreColor}14` }}
          >
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="font-display text-xl font-black leading-tight text-slate-50">{area.name}</p>
            <p className="text-xs text-slate-400">{city.meta.name}</p>
          </div>
          <span className="ml-auto rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-slate-400">
            {scoreLabel}
          </span>
        </header>

        <p className="mt-5 font-display text-3xl font-black leading-tight sm:text-4xl" style={{ color: scoreColor }}>
          {getBuyerVerdict(area)}
        </p>
        <p className="mt-2 text-sm font-bold text-slate-100">Can consider, but verify before token.</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
          You can consider this area, but don’t rush. First check the road, papers, approval, and price before paying token.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['Score', `${area.score}/100`],
            ['Risk', getRiskLabel(area.score)],
            ['Price', area.priceRange],
            ['Details', confidenceMeta.label],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/8 bg-slate-950/30 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-1 text-xs font-black leading-snug text-slate-100">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {fallbackContext && fallbackContext.tier !== 'exact_locality' && (
        <div className="mb-4 rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3">
          <p className="text-xs font-black text-slate-300">Nearest match used</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            We found the nearest available details for {fallbackContext.displayLabel}. Use this for first checking, but verify your exact plot separately.
          </p>
        </div>
      )}

      <VerdictCard
        citySlug={city.meta.slug}
        areaSlug={area.slug}
        resolutionTier={fallbackContext?.tier ?? 'exact_locality'}
        resolutionLabel={fallbackContext?.displayLabel ?? area.name}
      />

      <section className="mb-5 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
        <h2 className="text-sm font-black text-slate-100">What should I do next?</h2>
        <ol className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
          {['Check the price', 'Check road access', 'Check papers and approval', 'Compare with one nearby area'].map((item, index) => (
            <li key={item} className="flex items-center gap-2 rounded-lg bg-slate-950/25 px-3 py-2">
              <span className="font-black" style={{ color: scoreColor }}>{index + 1}.</span>{item}
            </li>
          ))}
        </ol>
      </section>

      <Link
        to={buildAreaStoryPath(area.slug, 'money')}
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-black text-slate-950"
        style={{ background: `linear-gradient(90deg, ${scoreColor}, #38bdf8)` }}
      >
        See Money View <ArrowRight size={16} />
      </Link>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {[
          { label: 'Map Proof', step: 'map' as const, icon: Map },
          { label: 'Area Story', step: 'details' as const, icon: BookOpen },
          { label: 'Buyer Report', step: 'pass' as const, icon: Download },
        ].map(({ label, step, icon: Icon }) => (
          <Link key={step} to={buildAreaStoryPath(area.slug, step)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.025] px-2 text-center text-[10px] font-black text-slate-300">
            <Icon size={13} /> {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
