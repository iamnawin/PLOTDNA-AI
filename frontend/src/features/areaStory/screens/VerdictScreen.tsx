import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import type { MicroMarket } from '@/types'
import type { CityEntry } from '@/data/cities'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import { getConfidenceMeta } from '@/lib/cityProduction'
import VerdictCard from '@/components/ui/VerdictCard'
import { buildAreaStoryPath } from '../areaStoryNav'

interface VerdictScreenProps {
  area: MicroMarket
  city: CityEntry
}

export default function VerdictScreen({ area, city }: VerdictScreenProps) {
  const scoreColor = getScoreColor(area.score)
  const scoreLabel = getScoreLabel(area.score)
  const confidenceMeta = getConfidenceMeta(area.dataConfidence)

  return (
    <div>
      <header className="mb-5 flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
          style={{ color: scoreColor, borderColor: `${scoreColor}44`, background: `${scoreColor}14` }}
        >
          <ShieldCheck size={20} />
        </span>
        <div>
          <p className="font-display text-xl font-black leading-tight text-slate-50">{area.name}</p>
          <p className="text-xs text-slate-500">{city.meta.name}</p>
        </div>
      </header>

      <section
        className="mb-4 rounded-2xl border p-5"
        style={{ borderColor: `${scoreColor}30`, background: `${scoreColor}0c` }}
      >
        <p className="font-display text-3xl font-black leading-tight" style={{ color: scoreColor }}>
          {scoreLabel}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {area.highlights?.[0] ?? 'This area is being screened against PlotDNA growth, risk, and access signals.'}
        </p>
      </section>

      <VerdictCard citySlug={city.meta.slug} areaSlug={area.slug} />

      <section
        className="mb-6 flex items-center justify-between rounded-2xl border px-4 py-3"
        style={{ borderColor: `${confidenceMeta.tone}30`, background: `${confidenceMeta.tone}0c` }}
      >
        <div>
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.12em]" style={{ color: confidenceMeta.tone }}>
            {confidenceMeta.label} data
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{confidenceMeta.description}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-black" style={{ color: scoreColor }}>{area.score}<span className="text-sm text-slate-500">/100</span></p>
        </div>
      </section>

      <Link
        to={buildAreaStoryPath(area.slug, 'money')}
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-sans font-black text-slate-950"
        style={{ background: `linear-gradient(90deg, ${scoreColor}, #38bdf8)` }}
      >
        See Money View
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}
