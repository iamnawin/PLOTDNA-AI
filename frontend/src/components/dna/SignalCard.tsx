import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { DNASignalCardModel, SignalSeverity } from '@/lib/locationDnaViewModel'

const SEVERITY_COLOR: Record<SignalSeverity, string> = {
  good: '#22c55e',
  neutral: '#f59e0b',
  watch: '#ef4444',
  unknown: '#64748b',
}

function SignalCard({ signal }: { signal: DNASignalCardModel }) {
  const [expanded, setExpanded] = useState(false)
  const color = SEVERITY_COLOR[signal.severity]
  const isLong = signal.description.length > 70

  return (
    <div className="rounded-2xl glass-panel-light p-4" style={{ border: `1px solid ${color}25` }}>
      <button
        type="button"
        onClick={() => isLong && setExpanded(v => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={expanded}
      >
        <div>
          <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500">{signal.label}</p>
          <p className="mt-1 text-sm font-sans font-bold" style={{ color }}>
            {signal.status}
          </p>
        </div>
        {isLong && (
          <ChevronDown
            size={14}
            className={`flex-shrink-0 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      {(expanded || !isLong) && (
        <p className="mt-2 text-xs font-sans leading-relaxed text-slate-400">{signal.description}</p>
      )}
    </div>
  )
}

export function SignalCardList({ signals }: { signals: DNASignalCardModel[] }) {
  return (
    <section aria-label="Key reasons" className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {signals.map(signal => (
        <SignalCard key={signal.key} signal={signal} />
      ))}
    </section>
  )
}

export default SignalCard
