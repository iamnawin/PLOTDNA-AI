import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, TrendingUp, Building2, Zap, Download, ExternalLink, FileText,
  Hammer, Users, Globe, Shield, Briefcase, Landmark,
  Navigation, ShoppingBag, Package, Film, Leaf,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import jsPDF from 'jspdf'
import { hyderabadAreas } from '@/data/hyderabad'
import { getScoreColor, getScoreLabel, SIGNAL_LABELS, SIGNAL_WEIGHTS } from '@/lib/utils'
import { getGrowthMilestones, getOutlook } from '@/lib/plotAnalysis'
import { getAreaSources, SOURCE_TYPE_COLOR, SOURCE_TYPE_LABEL } from '@/lib/areaSources'
import type { Livability, Signals } from '@/types'
import ScoreBadge from '@/components/ui/ScoreBadge'
import SatelliteCompare from '@/components/ui/SatelliteCompare'

// ── Signal tier helper ─────────────────────────────────────────────────────────
function getSignalTier(v: number) {
  if (v >= 85) return { label: 'Excellent', color: '#10b981' }
  if (v >= 65) return { label: 'Good',      color: '#22c55e' }
  if (v >= 45) return { label: 'Moderate',  color: '#f59e0b' }
  return               { label: 'Weak',      color: '#ef4444' }
}

// ── Signal card configs ────────────────────────────────────────────────────────
const SIGNAL_CONFIG: { key: keyof Signals; icon: LucideIcon; label: string }[] = [
  { key: 'infrastructure', icon: Hammer,     label: 'Infrastructure'    },
  { key: 'population',     icon: Users,      label: 'Population Growth' },
  { key: 'satellite',      icon: Globe,      label: 'Satellite Growth'  },
  { key: 'rera',           icon: Shield,     label: 'RERA Activity'     },
  { key: 'employment',     icon: Briefcase,  label: 'Employment Hub'    },
  { key: 'priceVelocity',  icon: TrendingUp, label: 'Price Velocity'    },
  { key: 'govtScheme',     icon: Landmark,   label: 'Govt Schemes'      },
]

const LIVABILITY_CONFIG: { key: keyof Livability; icon: LucideIcon; label: string; description: string }[] = [
  { key: 'connectivity',  icon: Navigation,  label: 'Connectivity',    description: 'Roads, metro & transit' },
  { key: 'amenities',     icon: ShoppingBag, label: 'Basic Amenities', description: 'Schools, hospitals, shops' },
  { key: 'ecommerce',     icon: Package,     label: 'E-Commerce',      description: 'Delivery accessibility' },
  { key: 'entertainment', icon: Film,        label: 'Entertainment',   description: 'Malls, theaters & dining' },
  { key: 'greenSpaces',   icon: Leaf,        label: 'Green Spaces',    description: 'Parks, lakes & open areas' },
]

// ── PDF generator ─────────────────────────────────────────────────────────────
function generatePDF(area: ReturnType<typeof hyderabadAreas.find> & object) {
  if (!area) return
  const doc     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const color   = getScoreColor(area.score)
  const label   = getScoreLabel(area.score)
  const outlook = getOutlook(area)
  const milestones = getGrowthMilestones(area)
  const sources    = getAreaSources(area.slug)

  // Helper: hex → RGB
  function hexRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return [r, g, b]
  }
  const [cr, cg, cb] = hexRgb(color)

  const W = 210, margin = 14

  // ── Background ──
  doc.setFillColor(5, 5, 10)
  doc.rect(0, 0, W, 297, 'F')

  // ── Header band ──
  doc.setFillColor(cr, cg, cb)
  doc.rect(0, 0, W, 2, 'F')

  // ── Logo + Title ──
  doc.setFillColor(cr, cg, cb)
  doc.roundedRect(margin, 10, 12, 12, 2, 2, 'F')
  doc.setTextColor(5, 5, 10)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('P', margin + 3.8, 18)

  doc.setTextColor(232, 232, 240)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('PlotDNA', margin + 16, 18)

  doc.setTextColor(cr, cg, cb)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Area DNA Analysis Report  ·  Hyderabad, Telangana', margin + 16, 23)

  // Date
  doc.setTextColor(80, 80, 100)
  doc.setFontSize(7)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, W - margin, 18, { align: 'right' })

  // ── Divider ──
  doc.setDrawColor(cr, cg, cb)
  doc.setLineWidth(0.3)
  doc.line(margin, 28, W - margin, 28)

  // ── Area name + score ring ──
  let y = 36

  doc.setTextColor(232, 232, 240)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(area.name, margin, y)

  doc.setTextColor(cr, cg, cb)
  doc.setFontSize(9)
  doc.text(`${area.category}  ·  ${label}`, margin, y + 7)

  // Score badge
  doc.setFillColor(cr, cg, cb)
  doc.setTextColor(5, 5, 10)
  doc.roundedRect(W - margin - 26, y - 10, 26, 18, 3, 3, 'F')
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(`${area.score}`, W - margin - 13, y + 3, { align: 'center' })
  doc.setFontSize(6)
  doc.text('DNA SCORE', W - margin - 13, y + 9, { align: 'center' })

  y += 20

  // Stats row
  const stats = [
    { label: 'YoY Growth', value: `+${area.yoy}%` },
    { label: 'Price Range', value: area.priceRange },
    { label: '5-Yr Outlook', value: outlook.range },
    { label: 'Confidence', value: outlook.confidence },
  ]
  const colW = (W - margin * 2) / stats.length
  stats.forEach(({ label: sl, value }, i) => {
    const x = margin + i * colW
    doc.setFillColor(20, 20, 35)
    doc.roundedRect(x, y, colW - 2, 14, 2, 2, 'F')
    doc.setTextColor(cr, cg, cb)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(value, x + (colW - 2) / 2, y + 7, { align: 'center' })
    doc.setTextColor(80, 80, 100)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text(sl.toUpperCase(), x + (colW - 2) / 2, y + 12, { align: 'center' })
  })

  y += 22

  // ── Signal breakdown ──
  doc.setTextColor(80, 80, 100)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('DNA SIGNAL BREAKDOWN', margin, y)
  y += 5

  const signalEntries = Object.entries(area.signals) as [keyof typeof area.signals, number][]
  signalEntries.forEach(([key, val]) => {
    const slabel = SIGNAL_LABELS[key] ?? key
    const weight = SIGNAL_WEIGHTS[key] ?? 0
    const barMaxW = W - margin * 2 - 45
    const barW    = (val / 100) * barMaxW

    doc.setTextColor(150, 150, 170)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`${slabel} (${weight}%)`, margin, y + 3)

    doc.setFillColor(25, 25, 42)
    doc.roundedRect(margin + 50, y, barMaxW, 4, 1, 1, 'F')
    doc.setFillColor(cr, cg, cb)
    doc.roundedRect(margin + 50, y, barW, 4, 1, 1, 'F')

    doc.setTextColor(cr, cg, cb)
    doc.text(`${val}`, W - margin, y + 3.5, { align: 'right' })

    y += 8
  })

  y += 4

  // ── 15-Year Growth Timeline ──
  doc.setTextColor(80, 80, 100)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('15-YEAR GROWTH TIMELINE', margin, y)
  y += 6

  const msW = (W - margin * 2) / milestones.length
  milestones.forEach((m, i) => {
    const x = margin + i * msW + msW / 2
    const alpha = (i + 1) / milestones.length
    const rr = Math.round(cr * alpha), rg = Math.round(cg * alpha), rb = Math.round(cb * alpha)
    doc.setFillColor(rr, rg, rb)
    doc.circle(x, y, 2.5, 'F')
    doc.setTextColor(150, 150, 170)
    doc.setFontSize(6.5)
    doc.text(String(m.year), x, y + 6, { align: 'center' })
    doc.setFontSize(5.5)
    doc.text(m.label, x, y + 10, { align: 'center', maxWidth: msW - 2 })
  })

  y += 18

  // ── 5-Year Forecast ──
  doc.setFillColor(20, 20, 35)
  doc.roundedRect(margin, y, W - margin * 2, 28, 3, 3, 'F')
  doc.setDrawColor(cr, cg, cb)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, y, W - margin * 2, 28, 3, 3, 'S')

  doc.setTextColor(cr, cg, cb)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('5-YEAR FORECAST', margin + 4, y + 7)

  doc.setTextColor(232, 232, 240)
  doc.setFontSize(12)
  doc.text(outlook.range, margin + 4, y + 15)

  doc.setTextColor(150, 150, 170)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(outlook.headline, W - margin * 2 - 8)
  doc.text(lines, margin + 4, y + 22)

  y += 36

  // ── Key Highlights ──
  doc.setTextColor(80, 80, 100)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('KEY HIGHLIGHTS', margin, y)
  y += 5

  area.highlights.forEach(h => {
    doc.setFillColor(cr, cg, cb)
    doc.circle(margin + 1.5, y + 1, 1, 'F')
    doc.setTextColor(150, 150, 170)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    const hlines = doc.splitTextToSize(h, W - margin * 2 - 8)
    doc.text(hlines, margin + 5, y + 2)
    y += hlines.length * 5 + 2
  })

  y += 4

  // ── Sources ──
  if (y < 255) {
    doc.setTextColor(80, 80, 100)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('SOURCES & REFERENCES', margin, y)
    y += 5
    sources.slice(0, 5).forEach(s => {
      doc.setFillColor(30, 30, 50)
      doc.roundedRect(margin, y, W - margin * 2, 7, 1, 1, 'F')
      doc.setTextColor(150, 150, 170)
      doc.setFontSize(6.5)
      doc.text(s.title, margin + 4, y + 4.5)
      doc.setTextColor(100, 140, 200)
      doc.text(s.url, W - margin - 2, y + 4.5, { align: 'right' })
      y += 9
    })
  }

  // ── Footer ──
  doc.setDrawColor(cr, cg, cb)
  doc.setLineWidth(0.3)
  doc.line(margin, 287, W - margin, 287)
  doc.setTextColor(60, 60, 80)
  doc.setFontSize(6)
  doc.text('PlotDNA — AI-powered real estate intelligence for India  ·  plotdna.in', margin, 292)
  doc.text('Data reflects area-level signals only. Always verify RERA before purchasing.  ·  rera.telangana.gov.in', W - margin, 292, { align: 'right' })

  doc.save(`PlotDNA_${area.name.replace(/\s+/g, '_')}_Report.pdf`)
}

// ─────────────────────────────────────────────────────────────────────────────

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
  const sources = getAreaSources(area.slug)

  // Nearby areas (similar score range)
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

        {/* Download PDF button */}
        <button
          onClick={() => generatePDF(area)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all"
          style={{
            background: `${color}12`,
            border: `1px solid ${color}30`,
            color,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = `${color}22` }}
          onMouseLeave={(e) => { e.currentTarget.style.background = `${color}12` }}
        >
          <Download size={12} />
          Download PDF Report
        </button>
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
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-mono text-[#444455] uppercase tracking-widest">
              DNA Signal Breakdown
            </h2>
            <span
              className="text-[8px] font-mono text-[#333344] px-2 py-1 rounded"
              style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              Weighted composite
            </span>
          </div>

          {/* Signal card grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SIGNAL_CONFIG.map(({ key, icon: Icon, label }, i) => {
              const val = area.signals[key]
              const weight = SIGNAL_WEIGHTS[key] ?? 0
              const tier = getSignalTier(val)
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${tier.color}18` }}
                    >
                      <Icon size={14} style={{ color: tier.color }} />
                    </div>
                    <span className="text-2xl font-mono font-bold" style={{ color: tier.color }}>
                      {val}
                    </span>
                  </div>

                  <p className="text-[10px] font-mono text-[#888899] leading-snug mb-2.5">{label}</p>

                  {/* Animated fill bar */}
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1a2e' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: tier.color, boxShadow: `0 0 6px ${tier.color}50` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 1.2, delay: 0.3 + i * 0.06, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span
                      className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: `${tier.color}12`, color: tier.color, border: `1px solid ${tier.color}28` }}
                    >
                      {tier.label}
                    </span>
                    <span className="text-[8px] font-mono text-[#333344]">{weight}% wt</span>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <p className="text-[10px] font-mono text-[#333344] mt-3">
            Weighted formula: Infrastructure (25%) + Population (20%) + Satellite (20%) + RERA (15%) + Employment (10%) + Price (5%) + Govt Scheme (5%)
          </p>
        </motion.section>

        {/* ── Livability Index ── */}
        {area.livability && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xs font-mono text-[#444455] uppercase tracking-widest">
                Livability Index
              </h2>
              <span
                className="text-[8px] font-mono text-[#444455] px-2 py-0.5 rounded-full"
                style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                not in DNA score
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {LIVABILITY_CONFIG.map(({ key, icon: Icon, label, description }, i) => {
                const val = area.livability![key]
                const tier = getSignalTier(val)
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.07 }}
                    className="p-4 rounded-xl text-center"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full mx-auto flex items-center justify-center mb-2"
                      style={{ background: `${tier.color}15`, border: `1px solid ${tier.color}28` }}
                    >
                      <Icon size={15} style={{ color: tier.color }} />
                    </div>

                    <p className="text-xl font-mono font-bold mb-1" style={{ color: tier.color }}>{val}</p>
                    <p className="text-[9px] font-mono text-[#888899] mb-0.5">{label}</p>
                    <p className="text-[8px] font-mono text-[#444455]">{description}</p>

                    {/* Mini bar */}
                    <div className="h-1 rounded-full overflow-hidden mt-2.5" style={{ background: '#1a1a2e' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: tier.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${val}%` }}
                        transition={{ duration: 1, delay: 0.45 + i * 0.07 }}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.section>
        )}

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

        {/* ── Sources & Citations ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-5">
            <FileText size={11} className="text-[#555566]" />
            <h2 className="text-xs font-mono text-[#444455] uppercase tracking-widest">
              Sources &amp; References
            </h2>
          </div>
          <div className="space-y-2">
            {sources.map((s, i) => {
              const tc = SOURCE_TYPE_COLOR[s.type]
              const tl = SOURCE_TYPE_LABEL[s.type]
              return (
                <button
                  key={i}
                  onClick={() => window.open(s.url, '_blank', 'noopener,noreferrer')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl group transition-all duration-150 text-left cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = `${tc}25` }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
                >
                  {/* Type badge */}
                  <span
                    className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ background: `${tc}15`, color: tc, border: `1px solid ${tc}25` }}
                  >
                    {tl}
                  </span>

                  <span className="flex-1 text-[12px] font-mono text-[#888899] group-hover:text-[#ccccdd] transition-colors">
                    {s.title}
                  </span>

                  <ExternalLink
                    size={11}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: tc }}
                  />
                </button>
              )
            })}
          </div>
          <p className="text-[9px] font-mono text-[#2a2a3e] mt-3">
            Links open in a new tab · Always verify independently before making investment decisions
          </p>
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
