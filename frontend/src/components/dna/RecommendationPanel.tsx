import { ListChecks } from 'lucide-react'
import type { DNARecommendationModel } from '@/lib/locationDnaViewModel'

export default function RecommendationPanel({ recommendation }: { recommendation: DNARecommendationModel }) {
  return (
    <section aria-label="Recommendation" className="mb-8 rounded-2xl glass-panel p-5">
      <div className="flex items-center gap-2 mb-3">
        <ListChecks size={12} className="text-slate-400" />
        <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">What should you do next?</h2>
      </div>
      <p className="text-lg font-display font-bold text-slate-100">{recommendation.headline}</p>
      <p className="mt-1.5 text-xs font-sans text-slate-400 leading-relaxed">{recommendation.why}</p>
      <ol className="mt-4 space-y-2">
        {recommendation.nextSteps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs font-sans text-slate-300">
            <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-slate-300">
              {i + 1}
            </span>
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
