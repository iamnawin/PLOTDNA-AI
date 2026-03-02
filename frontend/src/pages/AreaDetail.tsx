import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, MapPin, Building2, Zap } from 'lucide-react'
import { hyderabadAreas } from '@/data/hyderabad'
import { getScoreColor, getScoreLabel, SIGNAL_LABELS, SIGNAL_WEIGHTS } from '@/lib/utils'
import ScoreBadge from '@/components/ui/ScoreBadge'
import SignalBar from '@/components/ui/SignalBar'
import SatelliteCompare from '@/components/ui/SatelliteCompare'

export default function AreaDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const area = hyderabadAreas.find((a) => a.slug === slug)

  if (!area) {
    return (
      <div className="h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#444455] font-mono text-sm">Area not found</p>
          <button onClick={() => navigate('/')} className="mt-4 text-xs font-mono text-[#22c55e] underline">
            Back to map
          </button>
        </div>
      </div>
    )
  }

  const color = getScoreColor(area.score)
  const label = getScoreLabel(area.score)
  const r = 70
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference - (area.score / 100) * circumference
  const signals = Object.entries(area.signals) as [keyof typeof area.signals, number][]

  // Nearby areas (same category or adjacent scores)
  const nearby = hyderabadAreas
    .filter((a) => a.slug !== area.slug && Math.abs(a.score - area.score) <= 15)
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-[#050508] text-[#e8e8f0]">

      {/* ── Nav bar ── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 h-13"
        style={{ background: 'rgba(5,5,10,0.96)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#666680] hover:text-[#e8e8f0] transition-colors text-sm font-mono"
        >
          <ArrowLeft size={15} />
          Back to Map
        </button>

        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00e676, #00b36b)' }}
          >
            <span className="text-black font-black text-[10px]">P</span>
          </div>
          <span className="font-display font-bold text-[#e8e8f0] text-sm">PlotDNA</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-[#555566]">
          <MapPin size={11} className="text-[#00e676]" />
          Hyderabad, Telangana
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12"
        >
          {/* Score ring */}
          <div className="relative flex-shrink-0">
            <svg width={180} height={180} viewBox="0 0 180 180">
              <circle cx={90} cy={90} r={r} fill="none" stroke="#1a1a2e" strokeWidth={10} />
              <motion.circle
                cx={90}
                cy={90}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                transform="rotate(-90 90 90)"
                style={{ filter: `drop-shadow(0 0 12px ${color}60)` }}
              />
              <text x={90} y={82} textAnchor="middle" fill={color}
                style={{ fontSize: 44, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>
                {area.score}
              </text>
              <text x={90} y={102} textAnchor="middle" fill="#555566"
                style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: 2 }}>
                DNA SCORE
              </text>
            </svg>
          </div>

          {/* Info */}
          <div className="flex-1">
            <ScoreBadge score={area.score} size="lg" />
            <h1 className="font-display text-4xl font-black text-[#e8e8f0] mt-3 leading-tight">
              {area.name}
            </h1>
            <p className="text-[#555566] font-mono text-sm mt-1">{area.category} · Hyderabad</p>

            <div
              className="mt-6 p-4 rounded-xl"
              style={{ background: `${color}08`, border: `1px solid ${color}20` }}
            >
              <p className="text-2xl font-mono font-bold" style={{ color }}>{label}</p>
              <p className="text-xs font-mono text-[#666680] mt-1">Investment outlook for this micro-market</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div
                className="p-3 rounded-lg text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp size={12} style={{ color }} />
                  <span className="text-[10px] font-mono text-[#555566] uppercase">YoY Growth</span>
                </div>
                <p className="text-lg font-mono font-bold" style={{ color }}>+{area.yoy}%</p>
              </div>
              <div
                className="p-3 rounded-lg text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Building2 size={12} className="text-[#555566]" />
                  <span className="text-[10px] font-mono text-[#555566] uppercase">Price Range</span>
                </div>
                <p className="text-xs font-mono font-bold text-[#aaaabc]">{area.priceRange}</p>
              </div>
              <div
                className="p-3 rounded-lg text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap size={12} className="text-[#f59e0b]" />
                  <span className="text-[10px] font-mono text-[#555566] uppercase">Signal</span>
                </div>
                <p className="text-sm font-mono font-bold text-[#f59e0b]">
                  {signals.reduce((best, [, v]) => v > best ? v : best, 0)}
                  <span className="text-[10px] text-[#444455] ml-0.5">peak</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Signal breakdown ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-10"
        >
          <h2 className="text-xs font-mono text-[#444455] uppercase tracking-widest mb-5">
            DNA Signal Breakdown
          </h2>
          <div
            className="rounded-xl p-6 space-y-5"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            {signals.map(([key, val], i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
              >
                <SignalBar
                  label={SIGNAL_LABELS[key] ?? key}
                  value={val}
                  weight={SIGNAL_WEIGHTS[key] ?? 0}
                />
              </motion.div>
            ))}
          </div>
          <p className="text-[10px] font-mono text-[#333344] mt-3">
            Weighted formula: Infrastructure (25%) + Population (20%) + Satellite (20%) + RERA (15%) + Employment (10%) + Price (5%) + Govt Scheme (5%)
          </p>
        </motion.section>

        {/* ── Satellite Growth ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <SatelliteCompare area={area} />
        </motion.section>

        {/* ── Key Highlights ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-10"
        >
          <h2 className="text-xs font-mono text-[#444455] uppercase tracking-widest mb-5">Key Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {area.highlights.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <p className="text-sm text-[#888899]">{h}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── Nearby areas ── */}
        {nearby.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-xs font-mono text-[#444455] uppercase tracking-widest mb-5">Similar Zones to Compare</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {nearby.map((a) => {
                const c = getScoreColor(a.score)
                return (
                  <button
                    key={a.slug}
                    onClick={() => navigate(`/area/${a.slug}`)}
                    className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <p className="text-xs font-mono text-[#aaaabc] truncate">{a.name}</p>
                    <p className="text-2xl font-mono font-bold mt-1" style={{ color: c }}>{a.score}</p>
                    <p className="text-[10px] font-mono" style={{ color: c }}>{getScoreLabel(a.score)}</p>
                  </button>
                )
              })}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}
