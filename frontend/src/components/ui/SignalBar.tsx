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
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#888899] font-mono uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#555566] font-mono">{weight}%</span>
          <span className="text-sm font-mono font-semibold" style={{ color }}>
            {value}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
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
