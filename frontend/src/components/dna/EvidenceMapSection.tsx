import { ArrowRight, MapPin } from 'lucide-react'
import type { DNAMapEvidenceModel } from '@/lib/locationDnaViewModel'

interface Props {
  mapEvidence: DNAMapEvidenceModel
  onOpenMap: () => void
}

export default function EvidenceMapSection({ mapEvidence, onOpenMap }: Props) {
  return (
    <section aria-label="Evidence map" className="mb-8 rounded-2xl glass-panel p-5">
      <div className="mb-2 flex items-center gap-2">
        <MapPin size={12} className="text-slate-400" />
        <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">Evidence Map</h2>
      </div>
      <p className="text-xs font-sans leading-relaxed text-slate-400">
        This map shows the zone used for the {mapEvidence.areaName} Location DNA analysis in {mapEvidence.cityName}.
      </p>
      <p className="mt-2 text-[11px] font-sans leading-relaxed text-slate-500">{mapEvidence.note}</p>
      <button
        type="button"
        onClick={onOpenMap}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-sans font-bold glass-panel-light text-slate-200 transition-colors hover:bg-white/10"
      >
        Open Evidence Map <ArrowRight size={12} />
      </button>
    </section>
  )
}
