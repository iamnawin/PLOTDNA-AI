import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose?: () => void
}

const MODES = [
  'I know the survey number',
  'I know the village / mandal',
  'I only know this pin',
  'I know venture/layout name',
  'I have documents',
]

export default function SurveyResolverPanel({ open, onClose }: Props) {
  if (!open) return null

  return (
    <aside
      aria-label="Survey Resolver"
      className="fixed bottom-4 left-4 z-[1200] w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#070910]/95 p-5 text-slate-100 shadow-2xl backdrop-blur-xl"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-cyan-300">Survey Resolver</p>
          <h2 className="mt-1 text-xl font-display font-bold">How do you want to identify the land?</h2>
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="Close Survey Resolver"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-slate-400 transition-colors hover:text-slate-100"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {MODES.map(mode => (
          <button
            key={mode}
            type="button"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm font-sans font-bold text-slate-200"
          >
            {mode}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Survey identity requires cadastral or official record verification. PlotDNA will not confirm a survey number from GPS or area name alone.
      </p>
    </aside>
  )
}
