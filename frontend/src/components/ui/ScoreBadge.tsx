import { getScoreColor, getScoreLabel } from '@/lib/utils'

interface Props {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export default function ScoreBadge({ score, size = 'md' }: Props) {
  const color = getScoreColor(score)
  const label = getScoreLabel(score)

  const sizeClass = size === 'sm'
    ? 'text-xs px-1.5 py-0.5'
    : size === 'lg'
    ? 'text-sm px-3 py-1'
    : 'text-xs px-2 py-0.5'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-mono font-semibold tracking-wider uppercase ${sizeClass}`}
      style={{
        color,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: 6, height: 6, backgroundColor: color }}
      />
      {label}
    </span>
  )
}
