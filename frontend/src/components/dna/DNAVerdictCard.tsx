import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Scale, Share2 } from 'lucide-react'
import type { LocationDNAViewModel } from '@/lib/locationDnaViewModel'

interface Props {
  viewModel: LocationDNAViewModel
  onViewWhy?: () => void
  onOpenEvidenceMap?: () => void
  onGenerateCard?: () => void
  onCompare?: () => void
}

export default function DNAVerdictCard({ viewModel, onViewWhy, onOpenEvidenceMap, onGenerateCard, onCompare }: Props) {
  const { locationName, dnaScore, verdictZone, verdictColor, bestFor, summary } = viewModel

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 rounded-[1.5rem] glass-panel overflow-hidden"
      style={{ border: `1px solid ${verdictColor}35` }}
      aria-label="Location DNA verdict"
    >
      <div className="px-5 sm:px-7 py-6" style={{ background: `${verdictColor}0d` }}>
        <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-slate-500">{locationName}</p>

        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div>
            <p className="text-5xl font-display font-black leading-none" style={{ color: verdictColor }}>
              {dnaScore}
            </p>
            <p className="text-[10px] font-sans text-slate-500 uppercase tracking-wider mt-1">DNA Score / 100</p>
          </div>
          <span
            className="rounded-full px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wide"
            style={{ color: verdictColor, background: `${verdictColor}18`, border: `1px solid ${verdictColor}45` }}
          >
            {verdictZone}
          </span>
        </div>

        <p className="mt-4 text-sm font-sans text-slate-300 leading-relaxed max-w-2xl">{summary}</p>

        <p className="mt-3 text-xs font-sans text-slate-400">
          <span className="font-bold text-slate-300">Best for:</span> {bestFor}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 px-5 sm:px-7 py-4 border-t border-white/5">
        {onViewWhy && (
          <button
            type="button"
            onClick={onViewWhy}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-sans font-bold glass-panel-light hover:bg-white/10 text-slate-200 transition-colors"
          >
            View Why <ArrowRight size={12} />
          </button>
        )}
        {onOpenEvidenceMap && (
          <button
            type="button"
            onClick={onOpenEvidenceMap}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-sans font-bold glass-panel-light hover:bg-white/10 text-slate-200 transition-colors"
          >
            <MapPin size={12} /> Evidence Map
          </button>
        )}
        {onGenerateCard && (
          <button
            type="button"
            onClick={onGenerateCard}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-sans font-bold glass-panel-light hover:bg-white/10 text-slate-200 transition-colors"
          >
            <Share2 size={12} /> Generate DNA Card
          </button>
        )}
        {onCompare && (
          <button
            type="button"
            onClick={onCompare}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-sans font-bold glass-panel-light hover:bg-white/10 text-slate-200 transition-colors"
          >
            <Scale size={12} /> Compare Area
          </button>
        )}
      </div>
    </motion.section>
  )
}
