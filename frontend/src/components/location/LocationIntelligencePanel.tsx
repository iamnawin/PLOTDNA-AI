import { X } from 'lucide-react'
import type { LocationIntelligence } from '@/lib/landIdentity/types'

interface Props {
  intelligence: LocationIntelligence | null
  open: boolean
  onClose?: () => void
  onOpenSurveyResolver?: () => void
}

function valueOrFallback(value: string | number | undefined | null, fallback = 'Not available') {
  return value === undefined || value === null || value === '' ? fallback : String(value)
}

function coordinates(intelligence: LocationIntelligence) {
  if (typeof intelligence.lat !== 'number' || typeof intelligence.lng !== 'number') {
    return 'Exact pin not selected yet.'
  }
  return `${intelligence.lat.toFixed(6)}, ${intelligence.lng.toFixed(6)}`
}

export default function LocationIntelligencePanel({ intelligence, open, onClose, onOpenSurveyResolver }: Props) {
  if (!open || !intelligence) return null

  const rows = [
    ['Input type', intelligence.inputType.replaceAll('_', ' ')],
    ['Input value', valueOrFallback(intelligence.inputValue)],
    ['Exact pin', coordinates(intelligence)],
    ['Address', valueOrFallback(intelligence.reverseGeocodedAddress)],
  ]

  return (
    <aside
      aria-label="Location Intelligence"
      className="fixed inset-x-0 bottom-0 z-[1300] max-h-[82dvh] overflow-y-auto rounded-t-2xl border border-white/10 bg-[#070910]/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-slate-100 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-h-[calc(100dvh-2rem)] sm:w-[min(440px,calc(100vw-2rem))] sm:rounded-2xl sm:p-5"
    >
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-3 flex items-start justify-between gap-3 border-b border-white/10 bg-[#070910]/95 px-4 py-4 backdrop-blur-xl sm:static sm:m-0 sm:mb-4 sm:border-b-0 sm:bg-transparent sm:p-0">
        <div>
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-emerald-400">Location Intelligence</p>
          <h2 className="mt-1 text-xl font-display font-bold">Land context</h2>
          <p className="mt-1 text-xs text-slate-500 sm:hidden">Summary first. Open details only when needed.</p>
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="Close Location Intelligence"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-slate-400 transition-colors hover:text-slate-100"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <section className="space-y-2 border-t border-white/10 py-4 sm:border-t">
        <h3 className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-slate-400">Location Summary</h3>
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[104px_1fr] gap-3 text-sm sm:flex sm:justify-between sm:gap-4">
            <span className="text-slate-500">{label}</span>
            <span className="min-w-0 break-words text-right font-mono text-slate-200">{value}</span>
          </div>
        ))}
      </section>

      <section className="space-y-2 border-t border-white/10 py-4">
        <h3 className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-slate-400">Survey Number Status</h3>
        <p className="text-sm text-slate-300">{intelligence.survey.message}</p>
        <p className="text-xs text-slate-500">Status: {intelligence.survey.status.replaceAll('_', ' ')}</p>
      </section>

      <section className="space-y-2 border-t border-white/10 py-4">
        <h3 className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-slate-400">Risk Flags</h3>
        {intelligence.riskFlags.length > 0 ? (
          <ul className="space-y-1 text-sm text-amber-300">
            {intelligence.riskFlags.map(flag => <li key={flag}>{flag}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No risk flags checked yet.</p>
        )}
      </section>

      <details className="border-t border-white/10 py-4">
        <summary className="cursor-pointer list-none text-xs font-sans font-bold uppercase tracking-[0.14em] text-slate-400">
          More location context
        </summary>
        <div className="mt-4 space-y-5">
          <section className="space-y-2">
            <h3 className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-slate-400">Coverage Context</h3>
            <p className="text-sm text-slate-300">
              Inside Coverage: {intelligence.insideCoverage === undefined ? 'Not checked' : intelligence.insideCoverage ? 'Yes' : 'No'}
            </p>
            <p className="text-sm text-slate-500">
              Flagship Region: {valueOrFallback(intelligence.flagshipRegion, 'Not matched yet')}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-slate-400">Matched Micro-Zone</h3>
            {intelligence.matchedMicroZone ? (
              <p className="text-sm text-slate-300">
                {intelligence.matchedMicroZone.name} / {intelligence.matchedMicroZone.confidence} confidence
              </p>
            ) : (
              <p className="text-sm text-slate-500">No micro-zone match selected yet.</p>
            )}
            <p className="text-sm text-slate-500">Nearest locality: {valueOrFallback(intelligence.nearestLocality)}</p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-slate-400">Approval Signals</h3>
              <p className="mt-2 text-sm text-slate-300">Approval signal not checked yet.</p>
            </div>
            <div>
              <h3 className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-slate-400">Infrastructure Readiness</h3>
              <p className="mt-2 text-sm text-slate-300">{intelligence.infrastructure.status.replaceAll('_', ' ')}</p>
            </div>
            <div>
              <h3 className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-slate-400">Development History</h3>
              <p className="mt-2 text-sm text-slate-300">{intelligence.developmentHistory.trend ?? 'unknown'}</p>
            </div>
            <div>
              <h3 className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-slate-400">Ownership & Documentation</h3>
              <p className="mt-2 text-sm text-slate-300">Documentation confidence requires verified records.</p>
            </div>
          </section>
        </div>
      </details>

      <section className="border-t border-white/10 pt-4">
        <h3 className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-slate-400">Next Actions</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {['Check Survey Details', 'Check Approval Signals', 'Check Infrastructure', 'Upload Document', 'Save Location'].map(action => (
            <button
              key={action}
              type="button"
              onClick={action === 'Check Survey Details' ? onOpenSurveyResolver : undefined}
              className="rounded-lg border border-white/10 px-3 py-2 text-left text-xs font-sans font-bold text-slate-300 transition-colors hover:border-white/20 hover:text-slate-100"
            >
              {action}
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}
