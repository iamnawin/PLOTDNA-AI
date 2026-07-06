import { ShieldAlert } from 'lucide-react'
import type { DNARiskModel, SignalSeverity } from '@/lib/locationDnaViewModel'

const SEVERITY_COLOR: Record<SignalSeverity, string> = {
  good: '#22c55e',
  neutral: '#f59e0b',
  watch: '#ef4444',
  unknown: '#64748b',
}

export default function RiskCheckSection({ risks }: { risks: DNARiskModel[] }) {
  return (
    <section aria-label="Risk check" className="mb-8 rounded-2xl glass-panel p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert size={12} className="text-slate-400" />
        <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">Risk Check</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {risks.map(risk => {
          const color = SEVERITY_COLOR[risk.severity]
          return (
            <div
              key={risk.label}
              className="rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <p className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-500">{risk.label}</p>
              <p className="mt-1 text-xs font-sans font-bold" style={{ color }}>
                {risk.status}
              </p>
              <p className="mt-1.5 text-[11px] font-sans leading-relaxed text-slate-400">{risk.description}</p>
            </div>
          )
        })}
      </div>
      <p className="mt-4 text-[10px] font-sans leading-relaxed text-slate-500">
        PlotDNA provides area-level location intelligence. It does not replace official legal, survey, title, or approval
        verification.
      </p>
    </section>
  )
}
