import { motion } from 'framer-motion'
import { X, ArrowRight, TrendingUp } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { getScoreColor, getScoreLabel, SIGNAL_LABELS, SIGNAL_WEIGHTS } from '@/lib/utils'
import ScoreBadge from '@/components/ui/ScoreBadge'
import SignalBar from '@/components/ui/SignalBar'

interface Props {
  area: MicroMarket
  onOpenAreaReport: (slug: string) => void
  onClose: () => void
}

export default function ScoreCard({ area, onOpenAreaReport, onClose }: Props) {
  const color = getScoreColor(area.score)
  const label = getScoreLabel(area.score)

  // SVG ring
  const r = 42
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference - (area.score / 100) * circumference

  const signals = Object.entries(area.signals) as [keyof typeof area.signals, number][]

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="absolute top-0 right-0 h-full w-[100dvw] max-w-full sm:w-[340px] z-[1010] flex flex-col glass-panel"
      style={{
        background: 'rgba(10, 15, 30, 0.85)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-8px 0 32px 0 rgba(0, 0, 0, 0.45)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <p className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest mb-1">Micro-market</p>
          <h2 className="text-[#f8fafc] font-display text-xl font-bold leading-tight">{area.name}</h2>
          <div className="mt-2">
            <ScoreBadge score={area.score} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors mt-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* Score ring */}
      <div className="flex items-center gap-5 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="relative flex-shrink-0">
          <svg width={100} height={100} viewBox="0 0 100 100">
            {/* Track */}
            <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={7} />
            {/* Fill */}
            <motion.circle
              cx={50}
              cy={50}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              transform="rotate(-90 50 50)"
              style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
            />
            {/* Score number */}
            <text x={50} y={46} textAnchor="middle" fill={color}
              style={{ fontSize: 24, fontFamily: 'Sansation, sans-serif', fontWeight: 700 }}>
              {area.score}
            </text>
            <text x={50} y={60} textAnchor="middle" fill="rgba(255,255,255,0.3)"
              style={{ fontSize: 9, fontFamily: 'Inter, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              DNA
            </text>
          </svg>
        </div>

        <div className="flex-1">
          <p className="text-slate-400 text-xs font-sans font-medium mb-1 uppercase tracking-wider">{area.category}</p>
          <p className="text-[#f8fafc] text-lg font-sans font-bold" style={{ color }}>{label}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <TrendingUp size={13} style={{ color }} />
            <span className="text-xs font-display font-semibold" style={{ color }}>
              +{area.yoy}% YoY
            </span>
          </div>
          <p className="text-slate-400 text-xs font-display mt-1">{area.priceRange}</p>
        </div>
      </div>

      {/* Signals */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
        <p className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest mb-1">Signal Breakdown</p>
        {signals.map(([key, val]) => (
          <SignalBar
            key={key}
            label={SIGNAL_LABELS[key] ?? key}
            value={val}
            weight={SIGNAL_WEIGHTS[key] ?? 0}
          />
        ))}

        {/* Highlights */}
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest mb-3">Key Highlights</p>
          <ul className="space-y-2">
            {area.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="mt-0.5 flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: color, marginTop: 6 }} />
                <span className="font-sans">{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => onOpenAreaReport(area.slug)}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-sans font-black uppercase tracking-[0.08em] transition-all duration-200 btn-3d-reflective"
          style={{
            background: `linear-gradient(135deg, ${color}dd 0%, ${color}aa 100%)`,
            borderTop: '1px solid rgba(255,255,255,0.4)',
            borderLeft: '1px solid rgba(255,255,255,0.2)',
            borderRight: '1px solid rgba(0,0,0,0.2)',
            borderBottom: '4px solid rgba(0,0,0,0.45)',
            color: '#ffffff',
            boxShadow: `0 8px 24px rgba(0,0,0,0.35), 0 0 16px ${color}33`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.borderBottomWidth = '6px'
            e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,0,0,0.45), 0 0 24px ${color}4d`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderBottomWidth = '4px'
            e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.35), 0 0 16px ${color}33`
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(2px)'
            e.currentTarget.style.borderBottomWidth = '1px'
            e.currentTarget.style.boxShadow = `0 2px 10px rgba(0,0,0,0.25)`
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderBottomWidth = '4px'
            e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.35), 0 0 16px ${color}33`
          }}
        >
          Open Area DNA Report
          <ArrowRight size={15} />
        </button>
      </div>
    </motion.div>
  )
}
