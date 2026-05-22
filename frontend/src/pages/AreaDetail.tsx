import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, TrendingUp, Building2, Zap, Download, ExternalLink, FileText,
  Hammer, Users, Globe, Shield, Briefcase, Landmark, Lock, AlertTriangle,
  Navigation, ShoppingBag, Package, Film, Leaf, Sparkles,
  HardHat, Train, Car, Home, Building, Plane, Factory, Wifi,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import jsPDF from 'jspdf'
import { useAppStore } from '@/store'
import { CITIES, getAllAreas, getCityForArea } from '@/data/cities'
import type { MicroMarket } from '@/types'
import { getScoreColor, getScoreLabel, SIGNAL_LABELS, SIGNAL_WEIGHTS } from '@/lib/utils'
import { getGrowthMilestones, getOutlook } from '@/lib/plotAnalysis'
import { getAreaSources, SOURCE_TYPE_COLOR, SOURCE_TYPE_LABEL } from '@/lib/areaSources'
import { getAlternativeAreas, getRecommendationGoalMeta } from '@/lib/recommendations'
import type { Livability, Signals } from '@/types'
import ScoreBadge from '@/components/ui/ScoreBadge'
import SatelliteCompare from '@/components/ui/SatelliteCompare'
import VerdictCard from '@/components/ui/VerdictCard'
import NewsSection from '@/components/ui/NewsSection'
import MarketPulseCard from '@/components/ui/MarketPulseCard'
import AVMCard from '@/components/ui/AVMCard'
import AssistantDock from '@/components/ui/AssistantDock'

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

// ── PDF generator ─────────────────────────────────────────────────────────────
function generatePDF(area: MicroMarket) {
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
  doc.text(`Area DNA Analysis Report  ·  ${area.category}`, margin + 16, 23)

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

  const signalEntries = Object.entries(area.signals) as [string, number][]
  signalEntries.forEach(([key, val]) => {
    const slabel = SIGNAL_LABELS[key as keyof typeof SIGNAL_LABELS] ?? key
    const weight = SIGNAL_WEIGHTS[key as keyof typeof SIGNAL_WEIGHTS] ?? 0
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

  area.highlights.forEach((h: string) => {
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
  doc.text('Data reflects area-level signals only. Always verify RERA registration before purchasing.', W - margin, 292, { align: 'right' })

  doc.save(`PlotDNA_${area.name.replace(/\s+/g, '_')}_Report.pdf`)
}

// ─────────────────────────────────────────────────────────────────────────────

import { BASE_URL } from '@/lib/api'

export default function AreaDetail() {
  const { slug } = useParams<{ slug: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { searchCoords, recommendationGoal } = useAppStore()
  const area = getAllAreas().find((a) => a.slug === slug)
  const fallbackContext = (location.state as AreaDetailLocationState | null)?.fallbackContext

  const contactInputRef = useRef<HTMLInputElement>(null)
  
  // Lead Gating Modal state with 2 free checks soft paywall
  const [isLocked, setIsLocked] = useState(() => {
    if (localStorage.getItem('plotdna_unlocked') === 'true') {
      return false
    }
    try {
      const stored = localStorage.getItem('plotdna_viewed_slugs')
      const slugs = stored ? JSON.parse(stored) : []
      if (slug && slugs.includes(slug)) {
        return false
      }
      if (slugs.length < 2) {
        return false
      }
      return true
    } catch {
      return true
    }
  })
  
  const [contactInput, setContactInput] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Manage viewed area slugs tracker effect
  useEffect(() => {
    if (localStorage.getItem('plotdna_unlocked') === 'true') {
      setIsLocked(false)
      return
    }

    try {
      const stored = localStorage.getItem('plotdna_viewed_slugs')
      const slugs: string[] = stored ? JSON.parse(stored) : []
      
      if (slug) {
        if (slugs.includes(slug)) {
          setIsLocked(false)
        } else if (slugs.length < 2) {
          const nextSlugs = [...slugs, slug]
          localStorage.setItem('plotdna_viewed_slugs', JSON.stringify(nextSlugs))
          setIsLocked(false)
        } else {
          setIsLocked(true)
        }
      }
    } catch {
      setIsLocked(true)
    }
  }, [slug])

  const validateContact = (val: string) => {
    const trimmed = val.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailRegex.test(trimmed)) return true
    
    // Clean all non-digit characters
    const digits = trimmed.replace(/\D/g, '')
    
    let coreDigits = digits
    if (digits.length === 12 && digits.startsWith('91')) {
      coreDigits = digits.slice(2)
    } else if (digits.length === 11 && digits.startsWith('0')) {
      coreDigits = digits.slice(1)
    }
    
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(coreDigits)
  }

  const handleUnlock = async () => {
    if (!validateContact(contactInput)) return
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const response = await fetch(`${BASE_URL}/api/utils/collect-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contactInput.trim() })
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to submit contact. Please try again.')
      }
      localStorage.setItem('plotdna_unlocked', 'true')
      setIsLocked(false)
    } catch (err) {
      if (err instanceof TypeError) {
        console.warn("Backend offline or CORS issue, unlocking locally:", err)
        localStorage.setItem('plotdna_unlocked', 'true')
        setIsLocked(false)
        return
      }
      const msg = err instanceof Error ? err.message : 'An error occurred. Please try again.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

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
            <div className={isLocked ? "blur-md select-none pointer-events-none transition-all duration-500" : "transition-all duration-500"}>
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

            {/* Frosted glass modal gating overlay */}
            {isLocked && (
              <div className="absolute inset-x-0 top-0 z-30 flex flex-col items-center justify-start pt-16 px-4 bg-slate-950/80 backdrop-blur-xl rounded-3xl min-h-[500px]">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, type: 'spring', damping: 20 }}
                  className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.1)] relative">
                      <Lock className="text-emerald-400 w-6 h-6" />
                      <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 animate-ping opacity-75" />
                    </div>

                    <h3 className="text-xl sm:text-2xl font-display font-extrabold text-slate-100 mb-2 leading-tight">
                      Unlock District Report
                    </h3>
                    <p className="text-xs font-sans text-slate-400 max-w-sm mb-6 leading-relaxed">
                      Unlock land yield profiles, infrastructure corridor maps, and scraped RERA registration updates for this district.
                    </p>

                    <div className="w-full space-y-4">
                      <div className="relative">
                        <input
                          ref={contactInputRef}
                          type="text"
                          placeholder="Email or Indian Phone Number"
                          value={contactInput}
                          onChange={(e) => {
                            const val = e.target.value
                            setContactInput(val)
                            setIsValid(validateContact(val))
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && isValid && !isSubmitting) {
                              handleUnlock()
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-2xl bg-slate-950/80 border text-slate-100 font-sans text-sm outline-none transition-all duration-300 ${
                            contactInput
                              ? isValid
                                ? 'border-emerald-500/50 focus:border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                                : 'border-red-500/50 focus:border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                              : 'border-slate-800 focus:border-emerald-500/50'
                          }`}
                        />
                        
                        {contactInput && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                            {isValid ? (
                              <span className="text-[10px] font-sans font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Valid
                              </span>
                            ) : (
                              <span className="text-[10px] font-sans font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                Invalid
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {errorMessage && (
                        <p className="text-[11px] font-sans text-red-400 text-left bg-red-500/5 border border-red-500/10 px-3 py-2 rounded-xl">
                          {errorMessage}
                        </p>
                      )}

                      <button
                        onClick={handleUnlock}
                        disabled={!isValid || isSubmitting}
                        className={`w-full py-3 rounded-2xl font-sans font-bold text-sm transition-all duration-300 ${
                          isValid && !isSubmitting
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:scale-[1.02]'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isSubmitting ? 'Unlocking...' : 'Unlock Now'}
                      </button>
                    </div>

                    <p className="text-[10px] font-sans text-slate-500 mt-6 leading-relaxed max-w-xs">
                      Zero spam guarantee. We hate annoying real estate broker calls as much as you do. We promise to keep your contact info safe and locked in our digital vault. Pinky swear! 🤙
                    </p>
                  </div>
                </motion.div>
              </div>
            )}
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
              if (isLocked) {
                contactInputRef.current?.focus()
                contactInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              } else {
                generatePDF(area)
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans transition-all glass-panel-light hover:bg-white/10"
            style={{ color, border: `1px solid ${color}40` }}
          >
            <Download size={12} style={{ color }} />
            <span className="hidden sm:inline">Download PDF</span>
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

            <div
              className="mt-6 p-4 rounded-2xl glass-panel relative overflow-hidden"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <p className="text-xl font-display font-extrabold" style={{ color }}>{label}</p>
              <p className="text-xs font-sans text-slate-400 mt-1">Investment outlook for this micro-market</p>
            </div>

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
          <div className={isLocked ? "blur-md select-none pointer-events-none transition-all duration-500" : "transition-all duration-500"}>
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

              {/* Signal card grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SIGNAL_CONFIG.map(({ key, icon: Icon, label }, i) => {
                  const val = area.signals[key]
                  const weight = SIGNAL_WEIGHTS[key] ?? 0
                  const tier = getSignalTier(val ?? 0)
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                      className="rounded-2xl p-3.5 glass-panel-light"
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${tier.color}18` }}
                          >
                            <Icon size={13} style={{ color: tier.color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-sans font-bold text-slate-100 truncate leading-tight">
                              {label}
                            </p>
                            <p className="text-[9px] font-sans font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                              {tier.label}
                            </p>
                          </div>
                        </div>
                        <span className="text-xl font-display font-bold leading-none" style={{ color: tier.color }}>
                          {val}
                        </span>
                      </div>

                      <div className="h-[6px] rounded-full overflow-hidden bg-slate-950/50">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: tier.color, boxShadow: `0 0 6px ${tier.color}50` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${val}%` }}
                          transition={{ duration: 1.2, delay: 0.3 + i * 0.06, ease: 'easeOut' }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span
                          className="text-[9px] font-sans text-slate-500 font-medium"
                        >
                          Weight
                        </span>
                        <span
                          className="text-[9px] font-sans font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${tier.color}12`, color: tier.color, border: `1px solid ${tier.color}28` }}
                        >
                          {weight}% wt
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {LIVABILITY_CONFIG.map(({ key, icon: Icon, label, description }, i) => {
                    const val = area.livability![key]
                    const tier = getSignalTier(val)
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 + i * 0.07 }}
                        className="rounded-2xl p-3.5 glass-panel-light"
                      >
                        <div className="flex items-center justify-between gap-3 mb-3.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: `${tier.color}15`, border: `1px solid ${tier.color}28` }}
                            >
                              <Icon size={13} style={{ color: tier.color }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-sans font-bold text-slate-100 truncate leading-tight">
                                {label}
                              </p>
                              <p className="text-[9px] font-sans text-slate-400 mt-0.5 leading-tight">
                                {description}
                              </p>
                            </div>
                          </div>
                          <p className="text-xl font-display font-bold leading-none" style={{ color: tier.color }}>{val}</p>
                        </div>

                        <div className="h-[6px] rounded-full overflow-hidden bg-slate-950/50">
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

            {/* ── Automated Valuation (AVM) ── */}
            <AVMCard areaSlug={area.slug} country="india" accentColor={color} />

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
                    return (
                      <button
                        key={nearArea.slug}
                        onClick={() => navigate(`/area/${nearArea.slug}`)}
                        className="w-full text-left rounded-2xl p-4 transition-all duration-300 cursor-pointer glass-panel glass-panel-hover"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-sans font-bold text-slate-100 truncate">
                              {nearArea.name}
                            </p>
                            <p className="text-[10px] font-sans text-slate-400 mt-0.5">
                              {nearArea.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className="text-[9px] font-sans font-bold px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                            >
                              {matchScore}% match
                            </span>
                            <span
                              className="text-[11px] font-display font-bold px-2 py-0.5 rounded-full"
                              style={{ background: `${nearColor}15`, color: nearColor, border: `1px solid ${nearColor}28` }}
                            >
                              {nearArea.score}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] font-sans text-slate-400 mt-1 leading-relaxed">
                          <span className="font-bold text-slate-300">{reasons[0]?.label}:</span> {reasons[0]?.value}
                        </p>
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

          {/* Frosted glass modal gating overlay */}
          {isLocked && (
            <div className="absolute inset-x-0 top-0 z-30 flex flex-col items-center justify-start pt-16 px-4 bg-slate-950/80 backdrop-blur-xl rounded-3xl min-h-[500px]">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: 'spring', damping: 20 }}
                className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden"
              >
                {/* Visual gradient light behind lock */}
                <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.1)] relative">
                    <Lock className="text-emerald-400 w-6 h-6" />
                    <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 animate-ping opacity-75" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-display font-extrabold text-slate-100 mb-2 leading-tight">
                    Unlock Full DNA Report
                  </h3>
                  <p className="text-xs font-sans text-slate-400 max-w-sm mb-6 leading-relaxed">
                    PlotDNA parses satellite imagery, growth signals, and active projects so you can verify land quality instantly.
                  </p>

                  <div className="w-full space-y-4">
                    <div className="relative">
                      <input
                        ref={contactInputRef}
                        type="text"
                        placeholder="Email or Phone Number"
                        value={contactInput}
                        onChange={(e) => {
                          const val = e.target.value
                          setContactInput(val)
                          setIsValid(validateContact(val))
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && isValid && !isSubmitting) {
                            handleUnlock()
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-2xl bg-slate-950/80 border text-slate-100 font-sans text-sm outline-none transition-all duration-300 ${
                          contactInput
                            ? isValid
                              ? 'border-emerald-500/50 focus:border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                              : 'border-red-500/50 focus:border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                            : 'border-slate-800 focus:border-emerald-500/50'
                        }`}
                      />
                      
                      {contactInput && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                          {isValid ? (
                            <span className="text-[10px] font-sans font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Valid
                            </span>
                          ) : (
                            <span className="text-[10px] font-sans font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              Invalid
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {errorMessage && (
                      <p className="text-[11px] font-sans text-red-400 text-left bg-red-500/5 border border-red-500/10 px-3 py-2 rounded-xl">
                        {errorMessage}
                      </p>
                    )}

                    <button
                      onClick={handleUnlock}
                      disabled={!isValid || isSubmitting}
                      className={`w-full py-3 rounded-2xl font-sans font-bold text-sm transition-all duration-300 ${
                        isValid && !isSubmitting
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:scale-[1.02]'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting ? 'Unlocking...' : 'Unlock Now'}
                    </button>
                  </div>

                  {/* Spam disclaimer */}
                  <p className="text-[10px] font-sans text-slate-500 mt-6 leading-relaxed max-w-xs">
                    Zero spam guarantee. We hate annoying real estate broker calls as much as you do. We promise to keep your contact info safe and locked in our digital vault. Pinky swear! 🤙
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <AssistantDock
        key={`assistant-${area.slug}`}
        context={assistantContext}
      />
    </div>
  )
}
