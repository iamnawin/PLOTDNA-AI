import { getScoreColor } from '@/lib/utils'

interface Props {
  label: string
  value: number
  weight: number
  animated?: boolean
}

export default function SignalBar({ label, value, weight, animated = true }: Props) {
  const color = getScoreColor(value)

  return (
    <div className="group rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[11px] text-[#cfd0db] font-sans font-medium tracking-wide leading-tight">
          {label}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[9px] text-[#555566] font-sans">{weight}% wt</span>
          <span className="text-base font-sans font-semibold leading-none" style={{ color }}>
            {value}
          </span>
        </div>
      </div>
      <div className="h-[5px] bg-[#1a1a2e] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${animated ? 'transition-all duration-700 ease-out' : ''}`}
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
          }}
        />
      </div>
    </div>
  )
}
