import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowLeft, TrendingUp, Building2, Zap, Download, ExternalLink, FileText,
  Hammer, Users, Globe, Shield, Briefcase, Landmark, AlertTriangle,
  Navigation, ShoppingBag, Package, Film, Leaf, Sparkles,
  HardHat, Train, Car, Home, Building, Plane, Factory, Wifi,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import jsPDF from 'jspdf'
import { useAppStore } from '@/store'
import { CITIES, getAllAreas, getCityForArea } from '@/data/cities'
import type { MicroMarket } from '@/types'
import { getScoreColor, getScoreLabel, SIGNAL_WEIGHTS } from '@/lib/utils'
import { getGrowthMilestones, getOutlook } from '@/lib/plotAnalysis'
import { getAreaSources, SOURCE_TYPE_COLOR, SOURCE_TYPE_LABEL } from '@/lib/areaSources'
import { getAlternativeAreas, getRecommendationGoalMeta } from '@/lib/recommendations'
import { getConfidenceMeta } from '@/lib/cityProduction'
import { BUYER_DUE_DILIGENCE_CHECKLIST, getInvestmentReportSummary } from '@/lib/investmentReport'
import { buildCustomBuyerVerificationBrief, type BuyerBriefInput } from '@/lib/customBuyerBrief'
import { trackEvent } from '@/lib/analytics'
import { getReportPaymentLink, openReportPaymentLink, type ReportPackage } from '@/lib/paymentLinks'
import { checkReportAccess } from '@/lib/entitlements'
import { HYDERABAD_VERIFIED_PRIORITY_SET } from '@/data/hyderabadPriority'
import type { Livability, Signals } from '@/types'
import ScoreBadge from '@/components/ui/ScoreBadge'
import SatelliteCompare from '@/components/ui/SatelliteCompare'
import VerdictCard from '@/components/ui/VerdictCard'
import NewsSection from '@/components/ui/NewsSection'
import MarketPulseCard from '@/components/ui/MarketPulseCard'
import AVMCard from '@/components/ui/AVMCard'
import AssistantDock from '@/components/ui/AssistantDock'
import CustomReportLeadModal from '@/components/ui/CustomReportLeadModal'

interface AreaDetailLocationState {
  fallbackContext?: {
    tier: 'exact_locality' | 'nearby_micro_market' | 'city_zone_cluster' | 'regional' | 'uncovered'
    displayLabel: string
    precisionLabel: 'exact' | 'approximate' | 'broad' | 'none'
    coords?: [number, number]
    districtSlug?: string | null
    districtName?: string | null
    stateSlug?: string | null
  }
}

// ── Active project helpers ──────────────────────────────────────────────────────
const PROJECT_TYPE_COLOR: Record<string, string> = {
  metro: '#3b82f6', highway: '#f97316', flyover: '#fb923c',
  it_park: '#8b5cf6', residential: '#14b8a6', commercial: '#a855f7',
  hospital: '#ef4444', airport: '#0ea5e9', industrial: '#eab308',
  infrastructure: '#64748b',
}

const PROJECT_TYPE_ICON: Record<string, LucideIcon> = {
  metro: Train, highway: Car, flyover: Car, it_park: Wifi,
  residential: Home, commercial: Building, hospital: Building2,
  airport: Plane, industrial: Factory, infrastructure: HardHat,
}

const PROJECT_TYPE_LABEL: Record<string, string> = {
  metro: 'Metro', highway: 'Highway', flyover: 'Flyover', it_park: 'IT Park',
  residential: 'Residential', commercial: 'Commercial', hospital: 'Hospital',
  airport: 'Airport', industrial: 'Industrial', infrastructure: 'Infrastructure',
}

const STATUS_COLOR: Record<string, string> = {
  planning: '#64748b', approved: '#f59e0b',
  under_construction: '#3b82f6', near_completion: '#10b981',
}
const STATUS_LABEL: Record<string, string> = {
  planning: 'Planning', approved: 'Approved',
  under_construction: 'Under Construction', near_completion: 'Near Completion',
}

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

type TrendHorizon = 'past5' | 'now' | 'next5' | 'next10'
type SignalGraphMode = 'timeline' | 'mix'

const TREND_HORIZONS: { key: TrendHorizon; label: string }[] = [
  { key: 'past5', label: '5Y Back' },
  { key: 'now', label: 'Now' },
  { key: 'next5', label: '+5Y' },
  { key: 'next10', label: '+10Y' },
]

function clampScore(v: number) {
  return Math.max(5, Math.min(98, Math.round(v)))
}

function buildTrendValue(current: number, yoy: number, horizon: TrendHorizon, slower = false) {
  const factor = slower ? 0.26 : 0.42
  const movement = Math.max(5, Math.min(18, yoy * factor))
  const headroom = Math.max(0.35, (100 - current) / 100)

  if (horizon === 'past5') return clampScore(current - movement)
  if (horizon === 'next5') return clampScore(current + movement * 0.65 * headroom)
  if (horizon === 'next10') return clampScore(current + movement * 1.05 * headroom)
  return clampScore(current)
}

function SignalTrendPanel({ area, accentColor }: { area: MicroMarket; accentColor: string }) {
  const [active, setActive] = useState<TrendHorizon>('now')
  const [mode, setMode] = useState<SignalGraphMode>('timeline')
  const selectedLabel = TREND_HORIZONS.find(h => h.key === active)?.label ?? 'Now'
  const chartData = SIGNAL_CONFIG.map(({ key, label }) => {
    const current = area.signals[key] ?? 0
    return {
      key,
      label: label.replace('Population Growth', 'Population').replace('Satellite Growth', 'Satellite').replace('Employment Hub', 'Jobs').replace('Govt Schemes', 'Govt'),
      past5: buildTrendValue(current, area.yoy, 'past5'),
      now: buildTrendValue(current, area.yoy, 'now'),
      next5: buildTrendValue(current, area.yoy, 'next5'),
      next10: buildTrendValue(current, area.yoy, 'next10'),
      weight: SIGNAL_WEIGHTS[key] ?? 0,
    }
  })
  const average = Math.round(chartData.reduce((sum, item) => sum + Number(item[active]), 0) / chartData.length)
  const strongest = chartData.reduce((best, item) => Number(item[active]) > Number(best[active]) ? item : best, chartData[0])

  return (
    <div className="rounded-2xl glass-panel-light p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[11px] font-sans font-bold text-slate-200">Modeled signal trend</p>
          <p className="text-[9px] font-sans text-slate-500 mt-0.5">Derived from current score, signal weights, YoY velocity, and local growth stage.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full p-1 bg-slate-950/50 border border-white/5">
            {(['timeline', 'mix'] as SignalGraphMode[]).map(graphMode => {
              const isActive = mode === graphMode
              return (
                <button
                  key={graphMode}
                  onClick={() => setMode(graphMode)}
                  className="px-2.5 py-1 rounded-full text-[9px] font-sans font-bold transition-all"
                  style={{
                    background: isActive ? 'rgba(56,189,248,0.14)' : 'transparent',
                    color: isActive ? '#38bdf8' : '#64748b',
                    border: isActive ? '1px solid rgba(56,189,248,0.32)' : '1px solid transparent',
                  }}
                >
                  {graphMode === 'timeline' ? 'Timeline' : 'Score Mix'}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-1 rounded-full p-1 bg-slate-950/50 border border-white/5">
            {TREND_HORIZONS.map(horizon => {
              const isActive = active === horizon.key
              return (
                <button
                  key={horizon.key}
                  onClick={() => setActive(horizon.key)}
                  className="px-2.5 py-1 rounded-full text-[9px] font-sans font-bold transition-all"
                  style={{
                    background: isActive ? `${accentColor}22` : 'transparent',
                    color: isActive ? accentColor : '#64748b',
                    border: isActive ? `1px solid ${accentColor}40` : '1px solid transparent',
                  }}
                >
                  {horizon.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_190px] gap-4">
        <div className="h-[260px] rounded-2xl bg-slate-950/35 border border-white/5 p-3">
          <ResponsiveContainer width="100%" height="100%">
            {mode === 'timeline' ? (
              <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 6, left: -12 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(5,8,16,0.96)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e2e8f0' }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
                />
                <Line type="monotone" dataKey="past5" name="5Y Back" stroke="#64748b" strokeWidth={1.5} dot={false} opacity={active === 'past5' ? 1 : 0.35} />
                <Line type="monotone" dataKey="now" name="Now" stroke={accentColor} strokeWidth={active === 'now' ? 3 : 2} dot={{ r: active === 'now' ? 4 : 2 }} opacity={active === 'now' ? 1 : 0.55} />
                <Line type="monotone" dataKey="next5" name="+5Y" stroke="#38bdf8" strokeWidth={active === 'next5' ? 3 : 1.8} strokeDasharray="5 4" dot={false} opacity={active === 'next5' ? 1 : 0.45} />
                <Line type="monotone" dataKey="next10" name="+10Y" stroke="#a78bfa" strokeWidth={active === 'next10' ? 3 : 1.8} strokeDasharray="3 5" dot={false} opacity={active === 'next10' ? 1 : 0.42} />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 12, right: 12, bottom: 6, left: -12 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(5,8,16,0.96)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e2e8f0' }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
                />
                <Bar dataKey={active} name={`${selectedLabel} score`} radius={[6, 6, 0, 0]} fill={accentColor} />
                <Bar dataKey="weight" name="DNA weight" radius={[6, 6, 0, 0]} fill="#38bdf8" opacity={0.72} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          <div className="rounded-2xl p-3 bg-slate-950/35 border border-white/5">
            <p className="text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">{selectedLabel} Avg</p>
            <p className="text-3xl font-display font-black mt-1" style={{ color: accentColor }}>{average}</p>
            <p className="text-[10px] font-sans text-slate-500 mt-1">Composite signal strength</p>
          </div>
          <div className="rounded-2xl p-3 bg-slate-950/35 border border-white/5">
            <p className="text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">Strongest</p>
            <p className="text-sm font-sans font-bold text-slate-100 mt-1">{strongest?.label}</p>
            <p className="text-2xl font-display font-black mt-1" style={{ color: accentColor }}>{strongest ? strongest[active] : 0}</p>
            <p className="text-[9px] font-sans text-slate-500 mt-1">
              {mode === 'timeline' ? 'Trendline shows direction over time.' : 'Score Mix compares strength vs DNA weight.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function LivabilityTrendPanel({ livability, yoy }: { livability: Livability; yoy: number }) {
  const [active, setActive] = useState<TrendHorizon>('now')
  const chartData = LIVABILITY_CONFIG.map(({ key, label }) => {
    const current = livability[key]
    return {
      label,
      past5: buildTrendValue(current, yoy, 'past5', true),
      now: buildTrendValue(current, yoy, 'now', true),
      next5: buildTrendValue(current, yoy, 'next5', true),
      next10: buildTrendValue(current, yoy, 'next10', true),
    }
  })

  return (
    <div className="rounded-2xl glass-panel-light p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-[11px] font-sans text-slate-400">Livability moves slower than investment signals, so forecasts are intentionally conservative.</p>
        <div className="flex items-center gap-1 rounded-full p-1 bg-slate-950/50 border border-white/5">
          {TREND_HORIZONS.map(horizon => {
            const isActive = active === horizon.key
            return (
              <button
                key={horizon.key}
                onClick={() => setActive(horizon.key)}
                className="px-2.5 py-1 rounded-full text-[9px] font-sans font-bold transition-all"
                style={{
                  background: isActive ? 'rgba(16,185,129,0.16)' : 'transparent',
                  color: isActive ? '#10b981' : '#64748b',
                  border: isActive ? '1px solid rgba(16,185,129,0.35)' : '1px solid transparent',
                }}
              >
                {horizon.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="space-y-3">
        {LIVABILITY_CONFIG.map(({ key, icon: Icon, label, description }) => {
          const item = chartData.find(row => row.label === label)!
          const value = item[active]
          const tier = getSignalTier(value)
          return (
            <div key={key} className="grid grid-cols-[minmax(116px,180px)_1fr_42px] items-center gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${tier.color}15`, border: `1px solid ${tier.color}28` }}>
                  <Icon size={13} style={{ color: tier.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-sans font-bold text-slate-100 truncate">{label}</p>
                  <p className="text-[9px] font-sans text-slate-500 truncate">{description}</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-950/60 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ width: `${value}%`, background: `linear-gradient(90deg, ${tier.color}80, ${tier.color})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <p className="text-lg font-display font-black text-right" style={{ color: tier.color }}>{value}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

async function loadPdfAsset(path: string) {
  try {
    const response = await fetch(path)
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ── PDF generator ─────────────────────────────────────────────────────────────
async function generatePDF(area: MicroMarket) {
  if (!area) return
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  const margin = 14
  const color = getScoreColor(area.score)
  const scoreLabel = getScoreLabel(area.score)
  const outlook = getOutlook(area)
  const milestones = getGrowthMilestones(area)
  const sources = getAreaSources(area.slug)
  const city = getCityForArea(area.slug)
  const confidence = getConfidenceMeta(area.dataConfidence)
  const generated = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const logoDataUrl = await loadPdfAsset('/plotdna-logo.png')

  function hexRgb(hex: string): [number, number, number] {
    const normalized = hex.replace('#', '')
    return [
      parseInt(normalized.slice(0, 2), 16),
      parseInt(normalized.slice(2, 4), 16),
      parseInt(normalized.slice(4, 6), 16),
    ]
  }

  const [cr, cg, cb] = hexRgb(color)
  let y = 0

  const setText = (r: number, g: number, b: number, size: number, style: 'normal' | 'bold' = 'normal') => {
    doc.setTextColor(r, g, b)
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
  }

  const watermark = () => {
    setText(226, 232, 240, 38, 'bold')
    doc.text('PlotDNA', pageW / 2, 158, { align: 'center', angle: -28 })
    setText(220, 252, 231, 8, 'bold')
    doc.text('AI-POWERED REAL ESTATE INTELLIGENCE', pageW / 2, 169, { align: 'center', angle: -28 })
  }

  const header = (title = 'PlotDNA Area Intelligence Report') => {
    doc.setFillColor(248, 250, 252)
    doc.rect(0, 0, pageW, pageH, 'F')
    watermark()
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageW, 30, 'F')
    doc.setFillColor(cr, cg, cb)
    doc.rect(0, 0, pageW, 1.8, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, 30, pageW - margin, 30)

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', margin, 7, 13, 13)
    } else {
      doc.setFillColor(cr, cg, cb)
      doc.roundedRect(margin, 7, 13, 13, 3, 3, 'F')
      setText(255, 255, 255, 10, 'bold')
      doc.text('P', margin + 6.5, 15.8, { align: 'center' })
    }

    setText(15, 23, 42, 15, 'bold')
    doc.text('PlotDNA', margin + 17, 15.5)
    setText(71, 85, 105, 7)
    doc.text(title, margin + 17, 21)
    setText(100, 116, 139, 7)
    doc.text(`Generated ${generated}`, pageW - margin, 15.5, { align: 'right' })
    y = 40
  }

  const footer = (page: number) => {
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, 284, pageW - margin, 284)
    setText(100, 116, 139, 6.5)
    doc.text('PlotDNA screening report. Verify title, RERA, zoning, access, utilities, and latest comps before purchase.', margin, 290)
    doc.text(`Page ${page}`, pageW - margin, 290, { align: 'right' })
  }

  const section = (label: string) => {
    setText(15, 23, 42, 9, 'bold')
    doc.text(label.toUpperCase(), margin, y)
    doc.setDrawColor(cr, cg, cb)
    doc.setLineWidth(0.5)
    doc.line(margin, y + 2.5, pageW - margin, y + 2.5)
    y += 8
  }

  const card = (x: number, top: number, w: number, h: number, label: string, value: string, note?: string) => {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x, top, w, h, 3, 3, 'FD')
    setText(100, 116, 139, 6.5, 'bold')
    doc.text(label.toUpperCase(), x + 4, top + 6)
    setText(15, 23, 42, 13, 'bold')
    doc.text(doc.splitTextToSize(value, w - 8), x + 4, top + 14)
    if (note) {
      setText(100, 116, 139, 6.2)
      doc.text(doc.splitTextToSize(note, w - 8), x + 4, top + h - 5)
    }
  }

  header()

  setText(15, 23, 42, 23, 'bold')
  doc.text(area.name, margin, y)
  setText(71, 85, 105, 8)
  doc.text(`${city?.meta.name ?? 'India'} / ${area.category} / ${scoreLabel}`, margin, y + 7)

  doc.setFillColor(cr, cg, cb)
  doc.roundedRect(pageW - margin - 35, y - 8, 35, 24, 4, 4, 'F')
  setText(255, 255, 255, 25, 'bold')
  doc.text(String(area.score), pageW - margin - 17.5, y + 6, { align: 'center' })
  setText(236, 253, 245, 6.5, 'bold')
  doc.text('DNA SCORE', pageW - margin - 17.5, y + 13, { align: 'center' })
  y += 26

  const col = (pageW - margin * 2 - 6) / 4
  card(margin, y, col, 24, 'YoY velocity', `+${area.yoy}%`, 'Current market momentum')
  card(margin + col + 2, y, col, 24, 'Price range', area.priceRange, 'Local market band')
  card(margin + (col + 2) * 2, y, col, 24, '5Y outlook', outlook.range, outlook.confidence)
  card(margin + (col + 2) * 3, y, col, 24, 'Coverage', confidence.label, 'Production data status')
  y += 34

  section('Investment read')
  setText(15, 23, 42, 12, 'bold')
  doc.text(outlook.headline, margin, y)
  y += 7
  setText(71, 85, 105, 8)
  const executiveLines = doc.splitTextToSize(
    `${area.name} currently screens as ${scoreLabel.toLowerCase()} with a ${area.score}/100 DNA score. The model blends infrastructure, population, satellite growth, RERA activity, employment, price velocity, and government scheme signals. Use this page to shortlist, then verify project-level legal and ground data before committing capital.`,
    pageW - margin * 2,
  )
  doc.text(executiveLines, margin, y)
  y += executiveLines.length * 4.3 + 8

  section('DNA signal table')
  const tableX = margin
  const tableW = pageW - margin * 2
  const signalEntries = SIGNAL_CONFIG.map(({ key, label: signalLabel }) => ({
    key,
    label: signalLabel,
    value: area.signals[key] ?? 0,
    weight: SIGNAL_WEIGHTS[key] ?? 0,
  }))
  signalEntries.forEach((signal, index) => {
    const rowY = y + index * 9
    const tier = getSignalTier(signal.value)
    doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252)
    doc.rect(tableX, rowY - 5, tableW, 8, 'F')
    setText(30, 41, 59, 7.5, 'bold')
    doc.text(signal.label, tableX + 3, rowY)
    setText(100, 116, 139, 7)
    doc.text(`${signal.weight}% weight`, tableX + 58, rowY)
    doc.setFillColor(226, 232, 240)
    doc.roundedRect(tableX + 88, rowY - 3.5, 58, 3, 1, 1, 'F')
    const [tr, tg, tb] = hexRgb(tier.color)
    doc.setFillColor(tr, tg, tb)
    doc.roundedRect(tableX + 88, rowY - 3.5, signal.value * 0.58, 3, 1, 1, 'F')
    setText(tr, tg, tb, 8, 'bold')
    doc.text(`${signal.value}`, tableX + 153, rowY)
    setText(71, 85, 105, 7)
    doc.text(tier.label, pageW - margin, rowY, { align: 'right' })
  })
  y += signalEntries.length * 9 + 8

  section('Growth timeline')
  const lineY = y + 8
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.7)
  doc.line(margin + 8, lineY, pageW - margin - 8, lineY)
  milestones.forEach((milestone, index) => {
    const x = margin + 8 + index * ((pageW - margin * 2 - 16) / Math.max(1, milestones.length - 1))
    doc.setFillColor(cr, cg, cb)
    doc.circle(x, lineY, 2.3, 'F')
    setText(15, 23, 42, 7, 'bold')
    doc.text(String(milestone.year), x, lineY + 8, { align: 'center' })
    setText(100, 116, 139, 6)
    doc.text(doc.splitTextToSize(milestone.label, 30), x, lineY + 13, { align: 'center' })
  })
  y += 34

  section('Key highlights')
  area.highlights.slice(0, 6).forEach(highlight => {
    setText(cr, cg, cb, 9, 'bold')
    doc.text('-', margin, y)
    setText(51, 65, 85, 8)
    const lines = doc.splitTextToSize(highlight, pageW - margin * 2 - 5)
    doc.text(lines, margin + 5, y)
    y += lines.length * 4.2 + 2
  })
  footer(1)

  doc.addPage()
  header('Due diligence notes and data points')

  section('Livability index')
  const livabilityRows = LIVABILITY_CONFIG.map(({ key, label: livabilityLabel, description }) => ({
    label: livabilityLabel,
    description,
    value: area.livability?.[key] ?? 0,
  }))
  livabilityRows.forEach((row, index) => {
    const rowY = y + index * 10
    const tier = getSignalTier(row.value)
    const [tr, tg, tb] = hexRgb(tier.color)
    setText(30, 41, 59, 7.5, 'bold')
    doc.text(row.label, margin, rowY)
    setText(100, 116, 139, 6.5)
    doc.text(row.description, margin + 45, rowY)
    doc.setFillColor(226, 232, 240)
    doc.roundedRect(pageW - margin - 70, rowY - 3.5, 48, 3, 1, 1, 'F')
    doc.setFillColor(tr, tg, tb)
    doc.roundedRect(pageW - margin - 70, rowY - 3.5, row.value * 0.48, 3, 1, 1, 'F')
    setText(tr, tg, tb, 8, 'bold')
    doc.text(String(row.value), pageW - margin, rowY, { align: 'right' })
  })
  y += livabilityRows.length * 10 + 8

  section('Active project signals')
  if (area.activeProjects?.length) {
    area.activeProjects.slice(0, 6).forEach(project => {
      setText(30, 41, 59, 8, 'bold')
      doc.text(project.name, margin, y)
      setText(100, 116, 139, 6.8)
      doc.text(`${PROJECT_TYPE_LABEL[project.type] ?? project.type} / ${STATUS_LABEL[project.status] ?? project.status} / ETA ${project.expectedCompletion}`, margin, y + 4.5)
      y += 10
    })
  } else {
    setText(100, 116, 139, 8)
    doc.text('No active project feed is attached to this micro-market yet.', margin, y)
    y += 10
  }

  section('Buyer notes')
  const notes = [
    'Screen the location first, then inspect the exact plot entrance, road width, drainage, utilities, nearby industrial use, and flood history.',
    'For plotted land, verify title chain, conversion permissions, RERA applicability, zoning, survey number, and encumbrance certificate independently.',
    'Forecasts are modelled from available area-level signals. They are useful for comparison, not a guaranteed return estimate.',
    'For Hyderabad flagship zones, use exact coordinates wherever possible because one micro-market can contain very different street-level outcomes.',
  ]
  notes.forEach(note => {
    setText(cr, cg, cb, 9, 'bold')
    doc.text('-', margin, y)
    setText(51, 65, 85, 8)
    const lines = doc.splitTextToSize(note, pageW - margin * 2 - 5)
    doc.text(lines, margin + 5, y)
    y += lines.length * 4.2 + 2
  })
  y += 3

  section('Sources')
  if (sources.length) {
    sources.slice(0, 8).forEach((source, index) => {
      setText(30, 41, 59, 7.2, 'bold')
      doc.text(`${index + 1}. ${source.title}`, margin, y)
      setText(37, 99, 235, 6.2)
      doc.text(doc.splitTextToSize(source.url, pageW - margin * 2), margin, y + 4)
      y += 10
    })
  } else {
    setText(100, 116, 139, 8)
    doc.text('No public source links are attached to this report yet.', margin, y)
  }
  footer(2)

  doc.save(`PlotDNA_${area.name.replace(/\s+/g, '_')}_Report.pdf`)
}

async function generateCustomBuyerBriefPDF(area: MicroMarket, input: BuyerBriefInput = {}) {
  if (!area) return
  const brief = buildCustomBuyerVerificationBrief(area, input)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  const margin = 14
  const color = getScoreColor(area.score)
  const generated = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const logoDataUrl = await loadPdfAsset('/plotdna-logo.png')

  function hexRgb(hex: string): [number, number, number] {
    const normalized = hex.replace('#', '')
    return [
      parseInt(normalized.slice(0, 2), 16),
      parseInt(normalized.slice(2, 4), 16),
      parseInt(normalized.slice(4, 6), 16),
    ]
  }

  const [cr, cg, cb] = hexRgb(color)
  let y = 0
  let page = 1

  const setText = (r: number, g: number, b: number, size: number, style: 'normal' | 'bold' = 'normal') => {
    doc.setTextColor(r, g, b)
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
  }

  const header = () => {
    doc.setFillColor(248, 250, 252)
    doc.rect(0, 0, pageW, pageH, 'F')
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageW, 30, 'F')
    doc.setFillColor(5, 150, 105)
    doc.rect(0, 0, pageW, 1.8, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, 30, pageW - margin, 30)

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', margin, 7, 13, 13)
    } else {
      doc.setFillColor(5, 150, 105)
      doc.roundedRect(margin, 7, 13, 13, 3, 3, 'F')
      setText(255, 255, 255, 10, 'bold')
      doc.text('P', margin + 6.5, 15.8, { align: 'center' })
    }

    setText(15, 23, 42, 15, 'bold')
    doc.text('PlotDNA', margin + 17, 15.5)
    setText(71, 85, 105, 7)
    doc.text(brief.title, margin + 17, 21)
    setText(100, 116, 139, 7)
    doc.text(`Generated ${generated}`, pageW - margin, 15.5, { align: 'right' })
    y = 42
  }

  const footer = () => {
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, 284, pageW - margin, 284)
    setText(100, 116, 139, 6.3)
    doc.text('Custom buyer verification brief. Not legal due diligence or investment advice.', margin, 290)
    doc.text(`Page ${page}`, pageW - margin, 290, { align: 'right' })
  }

  const ensureSpace = (height: number) => {
    if (y + height <= 276) return
    footer()
    doc.addPage()
    page += 1
    header()
  }

  const writeWrapped = (text: string, x: number, width: number, lineHeight = 4.3) => {
    const lines = doc.splitTextToSize(text, width)
    doc.text(lines, x, y)
    y += lines.length * lineHeight
  }

  const section = (title: string) => {
    ensureSpace(18)
    setText(15, 23, 42, 9, 'bold')
    doc.text(title.toUpperCase(), margin, y)
    doc.setDrawColor(5, 150, 105)
    doc.setLineWidth(0.45)
    doc.line(margin, y + 2.5, pageW - margin, y + 2.5)
    y += 8
  }

  header()

  setText(15, 23, 42, 22, 'bold')
  doc.text(area.name, margin, y)
  y += 8
  setText(71, 85, 105, 8)
  doc.text(`${brief.audience} / ${brief.areaLine}`, margin, y)

  doc.setFillColor(cr, cg, cb)
  doc.roundedRect(pageW - margin - 36, y - 14, 36, 25, 4, 4, 'F')
  setText(255, 255, 255, 24, 'bold')
  doc.text(String(area.score), pageW - margin - 18, y - 1, { align: 'center' })
  setText(236, 253, 245, 6.2, 'bold')
  doc.text('DNA SCORE', pageW - margin - 18, y + 6, { align: 'center' })
  y += 16

  doc.setFillColor(236, 253, 245)
  doc.setDrawColor(167, 243, 208)
  doc.roundedRect(margin, y, pageW - margin * 2, 34, 3, 3, 'FD')
  y += 8
  setText(6, 95, 70, 11, 'bold')
  doc.text('What this Rs 499 brief adds', margin + 5, y)
  y += 6
  setText(51, 65, 85, 8)
  writeWrapped(
    `${brief.positioning} It converts the area score into project-level questions, document checks, price sanity, and next actions using the buyer context shared at request time.`,
    margin + 5,
    pageW - margin * 2 - 10,
    4.2,
  )
  y += 8

  section('Decision snapshot')
  const snapshotRows = [brief.scoreLine, brief.priceLine, `Main location signal: ${area.highlights?.[0] ?? 'available area-level signals'}`]
  snapshotRows.forEach(row => {
    ensureSpace(8)
    setText(5, 150, 105, 8, 'bold')
    doc.text('-', margin, y)
    setText(51, 65, 85, 8)
    writeWrapped(row, margin + 5, pageW - margin * 2 - 5)
    y += 1.5
  })

  brief.sections.forEach(briefSection => {
    section(briefSection.title)
    briefSection.items.forEach(item => {
      ensureSpace(12)
      setText(5, 150, 105, 8, 'bold')
      doc.text('-', margin, y)
      setText(51, 65, 85, 8)
      writeWrapped(item, margin + 5, pageW - margin * 2 - 5)
      y += 1.5
    })
  })

  section('Important boundary')
  setText(71, 85, 105, 8)
  writeWrapped(brief.disclaimer, margin, pageW - margin * 2)
  footer()

  doc.save(`PlotDNA_${area.name.replace(/\s+/g, '_')}_Custom_Buyer_Verification_Brief.pdf`)
}

// ─────────────────────────────────────────────────────────────────────────────

import { fetchBackendArea } from '@/lib/api'

export default function AreaDetail() {
  const { slug } = useParams<{ slug: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { searchCoords, recommendationGoal } = useAppStore()
  const staticArea = getAllAreas().find((a) => a.slug === slug)
  const [backendArea, setBackendArea] = useState<MicroMarket | null>(null)
  const area = backendArea ?? staticArea
  const fallbackContext = (location.state as AreaDetailLocationState | null)?.fallbackContext
  const staticCityEntry = staticArea ? getCityForArea(staticArea.slug) : undefined
  const staticCitySlug = staticCityEntry
    ? Object.entries(CITIES).find(([, v]) => v === staticCityEntry)?.[0] ?? 'hyderabad'
    : 'hyderabad'
  const [customReportOpen, setCustomReportOpen] = useState(false)
  const [selectedReportPackage, setSelectedReportPackage] = useState<ReportPackage>('custom_due_diligence_499')
  const [selectedReportSource, setSelectedReportSource] = useState('area_report_summary')
  const [selectedReportPaymentRequired, setSelectedReportPaymentRequired] = useState(true)
  const [checkingReportPackage, setCheckingReportPackage] = useState<ReportPackage | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadBackendArea() {
      if (!slug || staticCitySlug === 'dubai') {
        setBackendArea(null)
        return
      }

      const nextArea = await fetchBackendArea(staticCitySlug, slug)
      if (!cancelled) {
        setBackendArea(nextArea)
      }
    }

    void loadBackendArea()

    return () => {
      cancelled = true
    }
  }, [slug, staticCitySlug])

  useEffect(() => {
    if (!area) return
    trackEvent('area_report_preview_viewed', {
      citySlug: staticCitySlug,
      areaSlug: area.slug,
      dataConfidence: area.dataConfidence ?? 'estimated',
    })
    trackEvent('pricing_viewed', {
      citySlug: staticCitySlug,
      areaSlug: area.slug,
      source: 'area_report',
      dataConfidence: area.dataConfidence ?? 'estimated',
    })
  }, [area, staticCitySlug])
  const isRegionalFallback = fallbackContext?.tier === 'regional' || slug === 'warangal'

  if (isRegionalFallback) {
    const districtName = fallbackContext?.districtName || 'Warangal'
    const stateName = fallbackContext?.stateSlug === 'telangana' ? 'Telangana' : 'India'
    const districtSlug = fallbackContext?.districtSlug || 'warangal'
    const coords = fallbackContext?.coords ?? searchCoords ?? [17.9689, 79.5941]

    // Find nearby or alternative micro-markets
    const allMicroMarkets = getAllAreas()
    // List 4 top areas as alternatives
    const alternatives = allMicroMarkets.slice(0, 4)

    const r = 70
    const circumference = 2 * Math.PI * r

    const assistantContext = {
      page: 'area' as const,
      citySlug: 'regional',
      cityName: districtName,
      areaSlug: districtSlug,
      areaName: `${districtName} District`,
      coords,
      resolutionTier: 'regional' as const,
      resolutionLabel: `${districtName} District Fallback`,
      summary: `Regional Fallback Dashboard for ${districtName} District, ${stateName}.`,
    }

    return (
      <div className="min-h-screen body text-slate-100 bg-[#060814]">
        {/* ── Nav bar ── */}
        <nav className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 h-13 glass-panel border-b border-white/5">
          <button
            onClick={() => navigate('/map')}
            className="flex items-center gap-2 text-[#94a3b8] hover:text-slate-100 transition-colors text-sm font-sans flex-shrink-0"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back to Map</span>
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/plotdna-logo.png" alt="PlotDNA" className="w-6 h-6 rounded-lg object-cover flex-shrink-0" />
            <span className="font-display font-bold text-slate-100 text-sm">PlotDNA</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/brochure')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans transition-all glass-panel-light hover:bg-[#6366f120] text-[#818cf8]"
              style={{ border: '1px solid rgba(99, 102, 241, 0.2)' }}
            >
              <Sparkles size={11} className="text-[#818cf8]" />
              Brochure AI
            </button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12"
          >
            {/* Circular icon */}
            <div className="relative flex-shrink-0">
              <svg width={180} height={180} viewBox="0 0 180 180">
                <circle cx={90} cy={90} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={10} />
                <motion.circle
                  cx={90} cy={90} r={r} fill="none" stroke="#f59e0b" strokeWidth={10} strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference - 0.45 * circumference }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  transform="rotate(-90 90 90)"
                  style={{ filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.25))' }}
                />
                <text x={90} y={85} textAnchor="middle" fill="#f59e0b"
                  style={{ fontSize: 24, fontFamily: "var(--font-display)", fontWeight: 700 }}>
                  REGIONAL
                </text>
                <text x={90} y={105} textAnchor="middle" fill="#64748b"
                  style={{ fontSize: 9, fontFamily: "var(--font-sans)", fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  TIER 3 REGION
                </text>
              </svg>
            </div>

            {/* District info */}
            <div className="flex-1 w-full text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle size={11} /> Regional Fallback Active
              </span>
              <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-100 mt-3 leading-tight tracking-tight">
                {districtName} District
              </h1>
              <p className="text-slate-400 font-sans text-base mt-2">{stateName}, India</p>

              <div className="mt-6 p-4 rounded-2xl glass-panel relative overflow-hidden" style={{ borderLeft: '4px solid #f59e0b' }}>
                <p className="text-lg font-display font-extrabold text-amber-400">Plot-Exact Analysis Offline</p>
                <p className="text-xs font-sans text-slate-400 mt-1">
                  High-resolution satellite overlays are currently limited to Tier 1 and Tier 2 growth zones. PlotDNA provides macro-level indicators for this region.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="p-3 rounded-2xl text-center glass-panel-light">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp size={12} className="text-amber-400" />
                    <span className="text-[9px] font-sans font-semibold text-slate-400 uppercase tracking-wider">Growth Corridor</span>
                  </div>
                  <p className="text-base font-display font-bold text-amber-400">8.4% YoY</p>
                </div>
                <div className="p-3 rounded-2xl text-center glass-panel-light">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Building2 size={12} className="text-slate-400" />
                    <span className="text-[9px] font-sans font-semibold text-slate-400 uppercase tracking-wider">Average Price</span>
                  </div>
                  <p className="text-xs font-display font-bold text-slate-200 mt-1 leading-snug">₹15k - ₹28k/sq.yd</p>
                </div>
                <div className="p-3 rounded-2xl text-center glass-panel-light">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Shield size={12} className="text-emerald-500" />
                    <span className="text-[9px] font-sans font-semibold text-slate-400 uppercase tracking-wider">RERA Corridor</span>
                  </div>
                  <p className="text-sm font-display font-bold text-emerald-500 mt-0.5">State Approved</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="relative mt-8">
            <div className="transition-all duration-500">
              {/* Region Context Card */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-10 p-6 rounded-3xl glass-panel border border-white/5 relative overflow-hidden"
              >
                <h2 className="text-sm font-sans font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={14} className="text-amber-400" /> Regional Intelligence & Context
                </h2>
                <div className="space-y-4 text-sm text-slate-300 font-sans leading-relaxed">
                  <p>
                    This coordinate lies in <strong>{districtName}</strong> district, classified as a <strong>Tier 3 Regional corridor</strong>. Because high-density polygon maps are not active here, localized DNA composite metrics (infrastructure, employment hubs, RERA density) default to district-wide indicators.
                  </p>
                  <p>
                    <strong>Investment Verdict:</strong> The region possesses stable, organic growth driven by public road infrastructure extensions and state-highway expansions. However, standard commercial/IT hubs are minimal compared to adjacent Tier 2 growth corridors.
                  </p>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Key Regional Indicators:</p>
                    <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1.5">
                      <li>Infrastructure Pipeline: State Highway masterplan expansions are approved.</li>
                      <li>Scoring Tier: Standard Watch Corridor (Organic long-term yield profile).</li>
                      <li>Due Diligence: Strongly recommended to verify site layouts manually with the local municipal board (e.g. KUDA in Warangal).</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* RERA Project Database Card */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mb-10 p-6 rounded-3xl glass-panel border border-white/5"
              >
                <h2 className="text-sm font-sans font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Shield size={14} className="text-emerald-400" /> District RERA Pipeline Status
                </h2>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Landmark className="text-emerald-400 w-8 h-8" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-base font-sans font-bold text-slate-100">State RERA Scraper Sync</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Active layouts inside the district are mapped under the {stateName} RERA regulatory framework. Scraped RERA densities indicates a stable growth in land layout approvals over the last 12 months.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-sans font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ACTIVE PIPELINE
                  </span>
                </div>
              </motion.div>

              {/* Covered alternatives */}
              <motion.section
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-10"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Globe size={14} className="text-[#3b82f6]" />
                  <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">
                    Recommended High-Density Corridors
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {alternatives.map((altArea) => {
                    const altColor = getScoreColor(altArea.score)
                    return (
                      <button
                        key={altArea.slug}
                        onClick={() => navigate(`/area/${altArea.slug}`)}
                        className="w-full text-left rounded-2xl p-4 transition-all duration-300 cursor-pointer glass-panel glass-panel-hover"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="text-sm font-sans font-bold text-slate-100 truncate">{altArea.name}</p>
                            <p className="text-[10px] font-sans text-slate-400 mt-0.5">{altArea.category}</p>
                          </div>
                          <span
                            className="text-[11px] font-display font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${altColor}15`, color: altColor, border: `1px solid ${altColor}28` }}
                          >
                            {altArea.score}
                          </span>
                        </div>
                        <p className="text-[10px] font-sans text-slate-400 mt-2 leading-relaxed italic">
                          Click to view fully mapped high-density spatial reports with satellite comparisons.
                        </p>
                      </button>
                    )
                  })}
                </div>
              </motion.section>
            </div>

            {/* Regional browsing stays open. */}
          </div>
        </div>

        <AssistantDock key={`assistant-regional-${districtSlug}`} context={assistantContext} />
      </div>
    )
  }

  if (!area) {
    return (
      <div className="h-[100dvh] flex items-center justify-center body">
        <div className="text-center p-6 glass-panel rounded-2xl max-w-sm mx-4">
          <p className="text-slate-400 font-sans text-sm">Area not found</p>
          <button onClick={() => navigate('/map')} className="mt-4 text-xs font-sans text-emerald-400 hover:text-emerald-300 transition-colors underline cursor-pointer">
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

  // City context — drives sources, verdict, news, nearby zones, and city label
  const cityEntry = getCityForArea(area.slug)
  const citySlug = cityEntry
    ? Object.entries(CITIES).find(([, v]) => v === cityEntry)?.[0] ?? 'hyderabad'
    : 'hyderabad'
  const cityName = cityEntry?.meta.name ?? 'India'

  const sources = getAreaSources(area.slug, citySlug)
  const displayedConfidence = citySlug === 'hyderabad' && HYDERABAD_VERIFIED_PRIORITY_SET.has(area.slug)
    ? 'verified'
    : area.dataConfidence
  const confidenceMeta = getConfidenceMeta(displayedConfidence)
  const reportSummary = getInvestmentReportSummary({
    ...area,
    dataConfidence: displayedConfidence,
  })
  const dataBasis = [
    'Catalog profile',
    'OSM proximity signals where available',
    'RERA/proxy activity',
    area.dataAsOf ?? 'Current cycle',
    `${confidenceMeta.label} confidence`,
  ]
  const compareSlugs = [area.slug, 'adibatla', 'tukkuguda', 'kokapet']
    .filter((slug, index, slugs) => slugs.indexOf(slug) === index)
    .slice(0, 3)
  const openCustomReportRequest = async (packageInterest: ReportPackage, source: string) => {
    setSelectedReportPackage(packageInterest)
    setSelectedReportSource(source)
    trackEvent(packageInterest === 'instant_pdf_99' ? 'paid_report_clicked' : 'custom_report_pricing_clicked', {
      citySlug,
      areaSlug: area.slug,
      packageInterest,
      source,
      dataConfidence: displayedConfidence ?? 'estimated',
    })

    if (packageInterest === 'custom_due_diligence_499') {
      setSelectedReportPaymentRequired(false)
      setCustomReportOpen(true)
      trackEvent('custom_buyer_brief_preview_opened', {
        citySlug,
        areaSlug: area.slug,
        packageInterest,
        source,
        dataConfidence: displayedConfidence ?? 'estimated',
      })
      return
    }

    setCheckingReportPackage(packageInterest)

    try {
      const reportAccess = await checkReportAccess(packageInterest)

      trackEvent('report_access_checked', {
        citySlug,
        areaSlug: area.slug,
        packageInterest,
        source,
        canAccess: reportAccess?.canAccess ?? false,
        requiresPayment: reportAccess?.requiresPayment ?? true,
        reason: reportAccess?.reason ?? 'unavailable',
        dataConfidence: displayedConfidence ?? 'estimated',
      })

      if (reportAccess?.canAccess) {
        setSelectedReportPaymentRequired(false)
        trackEvent('report_access_unlocked', {
          citySlug,
          areaSlug: area.slug,
          packageInterest,
          source,
          reason: reportAccess.reason,
          dataConfidence: displayedConfidence ?? 'estimated',
        })

        if (packageInterest === 'instant_pdf_99') {
          void generatePDF(area)
          return
        }

        setCustomReportOpen(true)
        return
      }

      setSelectedReportPaymentRequired(true)

      const openedPaymentLink = openReportPaymentLink(packageInterest)
      trackEvent('payment_link_clicked', {
        citySlug,
        areaSlug: area.slug,
        packageInterest,
        source,
        provider: 'razorpay_payment_link',
        hasConfiguredLink: openedPaymentLink,
        dataConfidence: displayedConfidence ?? 'estimated',
      })

      if (openedPaymentLink) return

      setCustomReportOpen(true)
    } finally {
      setCheckingReportPackage(null)
    }
  }

  // Nearby areas — same city only, ±15 DNA score range
  const nearby = getAlternativeAreas(cityEntry?.areas ?? [], area, recommendationGoal, 4)
  const goalMeta = getRecommendationGoalMeta(recommendationGoal)
  const assistantContext = {
    page: 'area' as const,
    citySlug,
    cityName,
    areaSlug: area.slug,
    areaName: area.name,
    coords: fallbackContext?.coords ?? searchCoords ?? null,
    resolutionTier: fallbackContext?.tier ?? null,
    resolutionLabel: fallbackContext?.displayLabel ?? area.name,
    summary: `${area.name} has a ${area.score}/100 DNA score, ${area.priceRange} price range, and ${area.yoy}% YoY growth.`,
  }

  return (
    <div className="min-h-screen body text-slate-100">

      {/* ── Nav bar ── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 h-13 glass-panel border-b border-white/5"
      >
        <button
          onClick={() => navigate('/map')}
          className="flex items-center gap-2 text-[#94a3b8] hover:text-slate-100 transition-colors text-sm font-sans flex-shrink-0"
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Back to Map</span>
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src="/plotdna-logo.png"
            alt="PlotDNA"
            className="w-6 h-6 rounded-lg object-cover flex-shrink-0"
          />
          <span className="font-display font-bold text-slate-100 text-sm">PlotDNA</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              trackEvent('compare_started', {
                citySlug,
                areaSlug: area.slug,
                source: 'area_nav',
                dataConfidence: displayedConfidence ?? 'estimated',
              })
              navigate(`/compare?areas=${compareSlugs.join(',')}`)
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans transition-all glass-panel-light hover:bg-white/10 text-slate-300"
            style={{ border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <TrendingUp size={11} className="text-emerald-400" />
            Compare
          </button>
          {/* Brochure AI link — hidden on small mobile */}
          <button
            onClick={() => navigate('/brochure')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans transition-all glass-panel-light hover:bg-[#6366f120] text-[#818cf8]"
            style={{ border: '1px solid rgba(99, 102, 241, 0.2)' }}
          >
            <Sparkles size={11} className="text-[#818cf8]" />
            Brochure AI
          </button>

          {/* Download PDF button */}
          <button
            onClick={() => {
              trackEvent('area_pdf_download_clicked', {
                citySlug,
                areaSlug: area.slug,
                dataConfidence: displayedConfidence ?? 'estimated',
              })
              void openCustomReportRequest('instant_pdf_99', 'area_nav_pdf')
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans transition-all glass-panel-light hover:bg-white/10 disabled:opacity-45 disabled:cursor-not-allowed"
            style={{ color, border: `1px solid ${color}40` }}
            title="Get PlotDNA PDF report"
          >
            <Download size={12} style={{ color }} />
            <span className="hidden sm:inline">{checkingReportPackage === 'instant_pdf_99' ? 'Checking...' : 'Get PDF'}</span>
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

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
              <circle cx={90} cy={90} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={10} />
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
                style={{ fontSize: 44, fontFamily: "var(--font-display)", fontWeight: 700 }}>
                {area.score}
              </text>
              <text x={90} y={102} textAnchor="middle" fill="#64748b"
                style={{ fontSize: 10, fontFamily: "var(--font-sans)", fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2 }}>
                DNA SCORE
              </text>
            </svg>
          </div>

          {/* Info */}
          <div className="flex-1 w-full">
            <ScoreBadge score={area.score} size="lg" />
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-100 mt-3 leading-tight tracking-tight">
              {area.name}
            </h1>
            <p className="text-slate-400 font-sans text-sm mt-1.5">{area.category} {" \u00B7 "} {cityName}</p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="glass-panel-light rounded-xl px-3 py-2">
                <p className="text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">Confidence</p>
                <p className="text-[13px] font-sans font-bold mt-0.5" style={{ color: confidenceMeta.tone }}>{confidenceMeta.label}</p>
              </div>
              <div className="glass-panel-light rounded-xl px-3 py-2">
                <p className="text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">Data as of</p>
                <p className="text-[13px] font-sans font-bold text-slate-200 mt-0.5">{area.dataAsOf ?? 'Current cycle'}</p>
              </div>
              <div className="glass-panel-light rounded-xl px-3 py-2">
                <p className="text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">Sources</p>
                <p className="text-[13px] font-sans font-bold text-slate-200 mt-0.5">{sources.length} references</p>
              </div>
            </div>

            <div
              className="mt-6 p-4 rounded-2xl glass-panel relative overflow-hidden"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <p className="text-xl font-display font-extrabold" style={{ color }}>{label}</p>
              <p className="text-xs font-sans text-slate-400 mt-1">Investment outlook for this micro-market</p>
            </div>

            <section
              aria-label="Investment report summary"
              className="mt-4 rounded-2xl glass-panel-light border border-white/5 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-[0.12em]"
                  style={{ color, background: `${color}1f`, border: `1px solid ${color}40` }}
                >
                  {reportSummary.verdict}
                </span>
                <span className="text-[11px] font-sans font-semibold text-slate-300">
                  {reportSummary.bestFor}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">Main upside</p>
                  <p className="mt-1 text-[12px] font-sans leading-relaxed text-slate-300">{reportSummary.mainUpside}</p>
                </div>
                <div>
                  <p className="text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">Main risk</p>
                  <p className="mt-1 text-[12px] font-sans leading-relaxed text-slate-300">{reportSummary.mainRisk}</p>
                </div>
                <div>
                  <p className="text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">Next verification</p>
                  <p className="mt-1 text-[12px] font-sans leading-relaxed text-slate-300">{reportSummary.nextVerification}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {dataBasis.map(item => (
                  <span
                    key={item}
                    className="rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1 text-[10px] font-sans text-slate-400"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <button
                onClick={() => {
                  trackEvent('custom_report_requested', {
                    citySlug,
                    areaSlug: area.slug,
                    dataConfidence: displayedConfidence ?? 'estimated',
                    source: 'area_report_summary',
                  })
                  void openCustomReportRequest('custom_due_diligence_499', 'area_report_summary')
                }}
                disabled={checkingReportPackage === 'custom_due_diligence_499'}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-sans font-bold text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-70 sm:w-auto"
              >
                Preview custom buyer verification brief
              </button>
            </section>

            <section
              aria-label="Investment report options"
              className="mt-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-emerald-300">
                    Investment report options
                  </p>
                  <h2 className="mt-1 font-display text-xl font-extrabold text-slate-100">
                    Convert screening into an action plan
                  </h2>
                </div>
                <p className="max-w-sm text-[11px] font-sans leading-relaxed text-slate-400">
                  Screening intelligence only. Legal title, RERA, zoning, approvals, and quoted pricing still need independent verification.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <article className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-slate-500">
                        Instant screening PDF
                      </p>
                      <p className="mt-1 font-display text-2xl font-extrabold text-slate-100">Rs 99</p>
                    </div>
                    <FileText size={18} className="text-emerald-300" />
                  </div>
                  <p className="mt-3 text-xs font-sans leading-relaxed text-slate-400">
                    Area score, growth signals, risk notes, and buyer checklist for quick shortlisting.
                  </p>
                  <button
                    onClick={() => void openCustomReportRequest('instant_pdf_99', 'area_report_pricing')}
                    disabled={checkingReportPackage === 'instant_pdf_99'}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs font-sans font-bold text-slate-200 hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-70"
                  >
                    {checkingReportPackage === 'instant_pdf_99' ? 'Checking access...' : 'Pay Rs 99'}
                  </button>
                </article>

                <article className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-emerald-300">
                        Custom buyer verification brief
                      </p>
                      <p className="mt-1 font-display text-2xl font-extrabold text-slate-100">Rs 499</p>
                    </div>
                    <Shield size={18} className="text-emerald-300" />
                  </div>
                  <p className="mt-3 text-xs font-sans leading-relaxed text-slate-300">
                    Project-specific buyer brief covering title chain, RERA, approvals, access, seller questions, and current price checks.
                  </p>
                  <button
                    onClick={() => void openCustomReportRequest('custom_due_diligence_499', 'area_report_pricing')}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-3 py-2 text-xs font-sans font-bold text-[#04110b] hover:bg-emerald-400 disabled:opacity-70"
                  >
                    Preview Rs 499 brief
                  </button>
                </article>
              </div>
            </section>

            <CustomReportLeadModal
              open={customReportOpen}
              areaName={area.name}
              cityName={cityName}
              packageInterest={selectedReportPackage}
              payloadBase={{
                citySlug,
                cityName,
                areaSlug: area.slug,
                areaName: area.name,
                source: selectedReportSource,
              }}
              paymentRequired={selectedReportPackage === 'custom_due_diligence_499' ? false : selectedReportPaymentRequired}
              paymentAvailable={selectedReportPaymentRequired && Boolean(getReportPaymentLink(selectedReportPackage))}
              canGenerateBrief={selectedReportPackage === 'custom_due_diligence_499'}
              onProceedToPayment={() => {
                const openedPaymentLink = openReportPaymentLink(selectedReportPackage)
                trackEvent('payment_link_clicked', {
                  citySlug,
                  areaSlug: area.slug,
                  packageInterest: selectedReportPackage,
                  source: selectedReportSource,
                  provider: 'razorpay_payment_link',
                  hasConfiguredLink: openedPaymentLink,
                  dataConfidence: displayedConfidence ?? 'estimated',
                })
              }}
              onGenerateBrief={(input) => {
                void generateCustomBuyerBriefPDF(area, input)
                trackEvent('custom_buyer_brief_downloaded', {
                  citySlug,
                  areaSlug: area.slug,
                  dataConfidence: displayedConfidence ?? 'estimated',
                  source: selectedReportSource,
                  packageInterest: selectedReportPackage,
                })
              }}
              onClose={() => setCustomReportOpen(false)}
              onSubmitted={(leadId, input) => {
                trackEvent('custom_report_lead_submitted', {
                  citySlug,
                  areaSlug: area.slug,
                  dataConfidence: displayedConfidence ?? 'estimated',
                  source: selectedReportSource,
                  packageInterest: selectedReportPackage,
                  leadId,
                  hasBuyerNotes: Boolean(input.notes),
                  hasBuyerBudget: Boolean(input.budgetRange),
                })
              }}
            />

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3 rounded-2xl text-center glass-panel-light">
                <div className="flex items-center justify-center gap-1 mb-1.5">
                  <TrendingUp size={12} style={{ color }} />
                  <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">YoY Growth</span>
                </div>
                <p className="text-lg font-display font-bold" style={{ color }}>+{area.yoy}%</p>
              </div>
              <div className="p-3 rounded-2xl text-center glass-panel-light">
                <div className="flex items-center justify-center gap-1 mb-1.5">
                  <Building2 size={12} className="text-slate-400" />
                  <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">Price Range</span>
                </div>
                <p className="text-xs font-display font-bold text-slate-200 mt-0.5 leading-snug">{area.priceRange}</p>
              </div>
              <div className="p-3 rounded-2xl text-center glass-panel-light">
                <div className="flex items-center justify-center gap-1 mb-1.5">
                  <Zap size={12} className="text-amber-500" />
                  <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">Signal</span>
                </div>
                <p className="text-sm font-display font-bold text-amber-500 mt-0.5">
                  {signals.reduce((best, [, v]) => v > best ? v : best, 0)}
                  <span className="text-[10px] text-slate-400 font-sans ml-0.5">peak</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gated Report Sections Wrapper */}
        <div className="relative mt-8">
          <div className="transition-all duration-500">
            {/* ── AI Verdict ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-10"
            >
              {fallbackContext && fallbackContext.tier !== 'exact_locality' && (
                <div
                  className="px-4 py-3.5 rounded-2xl mb-4 glass-panel border border-amber-500/20 bg-amber-500/5"
                >
                  <p className="text-[10px] font-sans font-bold text-amber-400 uppercase tracking-wider mb-1">
                    Opened From Fallback Match
                  </p>
                  <p className="text-[12px] font-sans text-slate-300 leading-relaxed">
                    {fallbackContext.displayLabel} was used to open this supported area from your searched coordinate.
                    This page shows the exact micro-market analysis for {area.name}, not a plot-exact verdict for the original point.
                  </p>
                </div>
              )}
              <VerdictCard
                citySlug={citySlug}
                areaSlug={area.slug}
                resolutionTier="exact_locality"
                resolutionLabel={area.name}
              />
            </motion.div>

            {/* ── Buyer due diligence ── */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.11 }}
              className="mb-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <Shield size={14} style={{ color }} />
                <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">
                  Buyer Due-Diligence Checklist
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {BUYER_DUE_DILIGENCE_CHECKLIST.map(item => (
                  <div key={item} className="flex items-start gap-2.5 rounded-xl glass-panel-light border border-white/5 px-3 py-2.5">
                    <AlertTriangle size={12} className="mt-0.5 flex-shrink-0 text-amber-400" />
                    <p className="text-[12px] font-sans leading-relaxed text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] font-sans leading-relaxed text-slate-500">
                PlotDNA narrows the area shortlist. These checks still need independent document, site, and professional verification before paying an advance.
              </p>
            </motion.section>

            {/* ── Satellite Growth ── */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mb-10"
            >
              <SatelliteCompare area={area} coords={searchCoords ?? undefined} />
            </motion.section>

            {/* ── Signal breakdown ── */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">
                  DNA Signal Breakdown
                </h2>
                <span
                  className="text-[10px] font-sans text-slate-400 px-2.5 py-0.5 rounded-full glass-panel-light border border-white/5"
                >
                  Weighted composite
                </span>
              </div>

              <SignalTrendPanel area={area} accentColor={color} />

              <p className="text-[11px] font-sans text-slate-500 mt-4 leading-relaxed">
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
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">
                    Livability Index
                  </h2>
                  <span
                    className="text-[10px] font-sans text-slate-400 px-2 py-0.5 rounded-full glass-panel-light border border-white/5"
                  >
                    not in DNA score
                  </span>
                </div>

                <LivabilityTrendPanel livability={area.livability} yoy={area.yoy} />
              </motion.section>
            )}

            {/* ── Automated Valuation (AVM) ── */}
            <AVMCard areaSlug={area.slug} country="india" accentColor={color} />

            {/* ── Key Highlights ── */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mb-10"
            >
              <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider mb-5">Key Highlights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {area.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-2xl glass-panel-light"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <p className="text-sm text-slate-300 font-sans leading-relaxed">{h}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* ── Active Development Pipeline ── */}
            {area.activeProjects && area.activeProjects.length > 0 && (() => {
              const totalInvestment = area.activeProjects
                .filter(p => p.investment)
                .map(p => {
                  const match = p.investment!.replace(/[₹,]/g, '').match(/[\d.]+/)
                  return match ? parseFloat(match[0]) : 0
                })
                .reduce((a, b) => a + b, 0)
              const activeCount = area.activeProjects.filter(
                p => p.status === 'under_construction' || p.status === 'near_completion'
              ).length
              return (
                <motion.section
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.38 }}
                  className="mb-10"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <HardHat size={12} className="text-[#f97316]" />
                      <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">
                        Active Development Pipeline
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeCount > 0 && (
                        <span
                          className="text-[9px] font-sans font-bold px-2 py-0.5 rounded-full"
                          style={{ background: '#3b82f618', color: '#3b82f6', border: '1px solid #3b82f630' }}
                        >
                          {activeCount} ACTIVE
                        </span>
                      )}
                      {totalInvestment > 0 && (
                        <span
                          className="text-[9px] font-sans font-semibold text-slate-400 px-2 py-0.5 rounded-full glass-panel-light border border-white/5"
                        >
                          {"\u20B9"}{totalInvestment.toLocaleString('en-IN')} Cr pipeline
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Project cards */}
                  <div className="space-y-3.5">
                    {area.activeProjects.map((proj, i) => {
                      const tc   = PROJECT_TYPE_COLOR[proj.type]   ?? '#64748b'
                      const sc   = STATUS_COLOR[proj.status]        ?? '#64748b'
                      const sl   = STATUS_LABEL[proj.status]        ?? proj.status
                      const tl   = PROJECT_TYPE_LABEL[proj.type]   ?? proj.type
                      const Icon = PROJECT_TYPE_ICON[proj.type]    ?? HardHat
                      const isPulsing = proj.status === 'under_construction' || proj.status === 'near_completion'
                      return (
                        <motion.div
                          key={proj.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.42 + i * 0.07 }}
                          className="flex items-start gap-4 p-4 rounded-2xl glass-panel-light"
                          style={{
                            borderLeft: `3px solid ${tc}`,
                          }}
                        >
                          {/* Type icon */}
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: `${tc}18` }}
                          >
                            <Icon size={15} style={{ color: tc }} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <p className="text-sm font-sans font-bold text-slate-100 leading-snug">
                                {proj.name}
                              </p>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {isPulsing && (
                                  <span className="relative flex items-center">
                                    <span
                                      className="inline-block w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: sc, boxShadow: `0 0 6px ${sc}` }}
                                    />
                                  </span>
                                )}
                                <span
                                  className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full"
                                  style={{ background: `${sc}15`, color: sc, border: `1px solid ${sc}30` }}
                                >
                                  {sl}
                                </span>
                              </div>
                            </div>

                            {proj.description && (
                              <p className="text-xs font-sans text-slate-400 leading-relaxed mb-2.5">
                                {proj.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3">
                              <span
                                className="text-[9px] font-sans font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: `${tc}12`, color: tc, border: `1px solid ${tc}25` }}
                              >
                                {tl}
                              </span>
                              {proj.investment && (
                                <span className="text-xs font-display font-bold text-slate-100">
                                  {proj.investment}
                                </span>
                              )}
                              {proj.expectedCompletion && (
                                <span className="text-xs font-sans text-slate-400">
                                  ETA {proj.expectedCompletion}
                                </span>
                              )}
                              {proj.developer && (
                                <span className="text-xs font-sans text-slate-500">
                                  {" \u00B7 "} {proj.developer}
                                </span>
                              )}
                              {proj.impact === 'high' && (
                                <span
                                  className="text-[9px] font-sans font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: '#f59e0b12', color: '#f59e0b', border: '1px solid #f59e0b25' }}
                                >
                                  HIGH IMPACT
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.section>
              )
            })()}

            {/* ── What Changed Recently (Live News) ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.38 }}
              className="mb-10"
            >
              <NewsSection citySlug={citySlug} areaSlug={area.slug} areaName={area.name} accentColor={color} />
            </motion.div>

            {/* ── Market Pulse ── */}
            <MarketPulseCard citySlug={citySlug} areaSlug={area.slug} country="india" />

            {/* ── Sources & Citations ── */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-10"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <FileText size={11} className="text-slate-500" />
                <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">
                  Sources &amp; References
                </h2>
              </div>
              <div className="space-y-2">
                {sources.map((s, i) => {
                  const tc = SOURCE_TYPE_COLOR[s.type]
                  const tl = SOURCE_TYPE_LABEL[s.type]
                  return (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl group transition-all duration-300 text-left cursor-pointer glass-panel-light hover:bg-white/5"
                      style={{
                        display: 'flex',
                        textDecoration: 'none',
                      }}
                    >
                      {/* Type badge */}
                      <span
                        className="text-[9px] font-sans font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: `${tc}15`, color: tc, border: `1px solid ${tc}25` }}
                      >
                        {tl}
                      </span>

                      <span className="flex-1 text-xs font-sans text-slate-400 group-hover:text-slate-200 transition-colors truncate">
                        {s.title}
                      </span>

                      <ExternalLink
                        size={11}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: tc }}
                      />
                    </a>
                  )
                })}
              </div>
              <p className="text-[10px] font-sans text-slate-500 mt-3">
                Links open in a new tab {" \u00B7 "} Always verify independently before making investment decisions
              </p>
            </motion.section>

            {/* ── Nearby areas ── */}
            {nearby.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.42 }}
                className="mb-10"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <Globe size={12} className="text-[#3b82f6]" />
                    <h2 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">
                      Alternative Markets ({goalMeta.label})
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {nearby.map(({ area: nearArea, matchScore, reasons, caution }) => {
                    const nearColor = getScoreColor(nearArea.score)
                    const nearTier = getScoreLabel(nearArea.score)
                    const topReason = reasons[0]
                    const secondReason = reasons[1]
                    return (
                      <button
                        key={nearArea.slug}
                        onClick={() => navigate(`/area/${nearArea.slug}`)}
                        className="group relative w-full text-left rounded-2xl p-4 transition-all duration-300 cursor-pointer overflow-hidden"
                        style={{
                          background: `linear-gradient(145deg, ${nearColor}18, rgba(15,23,42,0.82) 38%, rgba(2,6,23,0.92))`,
                          border: `1px solid ${nearColor}38`,
                          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 34px rgba(0,0,0,0.22)`,
                        }}
                      >
                        <div
                          className="absolute inset-x-0 top-0 h-px opacity-80"
                          style={{ background: `linear-gradient(90deg, transparent, ${nearColor}, transparent)` }}
                        />
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <p className="text-[15px] font-display font-black text-slate-50 truncate tracking-tight">
                              {nearArea.name}
                            </p>
                            <p className="text-[10px] font-sans text-slate-400 mt-1">
                              {nearArea.category} · {nearTier}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-slate-500">DNA</span>
                            <span className="text-3xl font-display font-black leading-none" style={{ color: nearColor }}>
                              {nearArea.score}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="rounded-xl px-2.5 py-2 bg-slate-950/35 border border-white/5">
                            <p className="text-[8px] font-sans font-bold uppercase tracking-[0.1em] text-slate-500">Match</p>
                            <p className="text-sm font-display font-black text-sky-300">{matchScore}%</p>
                          </div>
                          <div className="rounded-xl px-2.5 py-2 bg-slate-950/35 border border-white/5">
                            <p className="text-[8px] font-sans font-bold uppercase tracking-[0.1em] text-slate-500">YoY</p>
                            <p className="text-sm font-display font-black text-emerald-300">+{nearArea.yoy}%</p>
                          </div>
                          <div className="rounded-xl px-2.5 py-2 bg-slate-950/35 border border-white/5">
                            <p className="text-[8px] font-sans font-bold uppercase tracking-[0.1em] text-slate-500">Price</p>
                            <p className="text-[10px] font-sans font-bold text-slate-200 truncate">{nearArea.priceRange}</p>
                          </div>
                        </div>

                        {topReason && (
                          <p className="text-[10px] font-sans text-slate-300 mt-1 leading-relaxed">
                            <span className="font-bold" style={{ color: nearColor }}>{topReason.label}:</span> {topReason.value}
                          </p>
                        )}
                        {secondReason && (
                          <p className="text-[10px] font-sans text-slate-400 mt-1 leading-relaxed">
                            <span className="font-bold text-slate-300">{secondReason.label}:</span> {secondReason.value}
                          </p>
                        )}
                        <p className="text-[9px] font-sans text-slate-500 mt-2 leading-relaxed italic">
                          {caution}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </motion.section>
            )}
          </div>

          {/* Area browsing stays open. */}
        </div>
      </div>

      <AssistantDock
        key={`assistant-${area.slug}`}
        context={assistantContext}
      />
    </div>
  )
}

