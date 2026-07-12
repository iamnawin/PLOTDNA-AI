import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, ArrowRight } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { useAppStore } from '@/store'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import MapView from '@/components/map/MapView'
import SatelliteCompare from '@/components/ui/SatelliteCompare'
import { buildAreaStoryPath } from '../areaStoryNav'

interface MapProofScreenProps {
  area: MicroMarket
}

const LEGEND_ITEMS = [
  { color: '#10b981', label: 'Details checked', description: 'Good area details are available' },
  { color: '#f59e0b', label: 'Expansion coverage', description: 'Growth potential area' },
  { color: '#94a3b8', label: 'Data pending zone', description: 'Insufficient data' },
]

export default function MapProofScreen({ area }: MapProofScreenProps) {
  const setSelectedArea = useAppStore(state => state.setSelectedArea)
  const searchCoords = useAppStore(state => state.searchCoords)
  const scoreColor = getScoreColor(area.score)
  const scoreLabel = getScoreLabel(area.score)

  useEffect(() => {
    setSelectedArea(area)
  }, [area, setSelectedArea])

  return (
    <div>
      <header className="mb-4">
        <p className="font-display text-xl font-black leading-tight text-slate-50">Map Proof</p>
        <p className="mt-1 text-xs text-slate-500">Only {area.name} is shown — nothing else on the map.</p>
      </header>

      <div className="mb-4 h-[360px] overflow-hidden rounded-2xl border border-white/10 sm:h-[440px]">
        <MapView isolateSlug={area.slug} />
      </div>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <SatelliteCompare area={area} coords={searchCoords ?? undefined} />
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {LEGEND_ITEMS.map(item => (
            <div key={item.label} className="flex items-start gap-2">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
              <div>
                <p className="text-xs font-sans font-bold text-slate-200">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2">
          <Star size={14} className="text-emerald-300" />
          <p className="text-sm font-sans font-black text-slate-100">Why this matters</p>
        </div>
        <ul className="space-y-1.5">
          {(area.highlights ?? []).slice(0, 3).map((highlight, i) => (
            <li key={i} className="text-xs text-slate-400">{highlight}</li>
          ))}
        </ul>
      </section>

      <section
        className="mb-6 flex items-center gap-2 rounded-xl border px-4 py-3"
        style={{ borderColor: `${scoreColor}30`, background: `${scoreColor}0c` }}
      >
        <p className="text-xs text-slate-300">
          Map supports verdict: <span className="font-sans font-black" style={{ color: scoreColor }}>{scoreLabel}</span>
        </p>
      </section>

      <Link
        to={buildAreaStoryPath(area.slug, 'details')}
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-sans font-black text-slate-950"
        style={{ background: `linear-gradient(90deg, ${scoreColor}, #38bdf8)` }}
      >
        Read Area Story
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}
