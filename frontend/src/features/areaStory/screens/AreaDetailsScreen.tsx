import { Link } from 'react-router-dom'
import { ShieldCheck, TrendingUp, AlertTriangle, Gauge, Scale, MessageSquareText, Database } from 'lucide-react'
import type { MicroMarket } from '@/types'
import { getInvestmentReportSummary, BUYER_DUE_DILIGENCE_CHECKLIST } from '@/lib/investmentReport'
import { getConfidenceMeta } from '@/lib/cityProduction'
import { getScoreColor } from '@/lib/utils'
import { buildAreaStoryPath } from '../areaStoryNav'

interface AreaDetailsScreenProps {
  area: MicroMarket
}

const VERIFY_ITEM_COUNT = 5

export default function AreaDetailsScreen({ area }: AreaDetailsScreenProps) {
  const summary = getInvestmentReportSummary(area)
  const confidenceMeta = getConfidenceMeta(area.dataConfidence)
  const scoreColor = getScoreColor(area.score)
  const verifyItems = BUYER_DUE_DILIGENCE_CHECKLIST.slice(0, VERIFY_ITEM_COUNT)

  return (
    <div>
      <header className="mb-4">
        <p className="font-display text-xl font-black leading-tight text-slate-50">Area Details</p>
        <p className="mt-1 text-xs text-slate-500">{area.name}</p>
      </header>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck size={15} className="text-emerald-300" />
          <p className="text-sm font-sans font-black text-slate-100">What to verify before paying token</p>
        </div>
        <ul className="divide-y divide-white/5">
          {verifyItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 py-2.5 text-xs text-slate-300">
              <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-400/70" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp size={15} className="text-emerald-300" />
          <p className="text-sm font-sans font-black text-slate-100">Why this area may gain value</p>
        </div>
        <p className="text-xs text-slate-400">{summary.mainUpside}</p>
      </section>

      <section className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-4">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-300" />
          <p className="text-sm font-sans font-black text-slate-100">Where you may lose money</p>
        </div>
        <p className="text-xs text-slate-400">{summary.mainRisk}</p>
      </section>

      <section
        className="mb-4 rounded-2xl border px-4 py-3"
        style={{ borderColor: `${confidenceMeta.tone}30`, background: `${confidenceMeta.tone}0c` }}
      >
        <div className="flex items-start gap-2">
          <Gauge size={15} style={{ color: confidenceMeta.tone }} />
          <div>
            <p className="text-xs font-sans font-black text-slate-100">How sure is this result?</p>
            <p className="text-[10px] text-slate-500">{confidenceMeta.label} confidence</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{confidenceMeta.description}</p>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center gap-2"><MessageSquareText size={15} className="text-cyan-300" /><p className="text-sm font-black text-slate-100">Ask the seller or broker</p></div>
        <ul className="space-y-2 text-xs leading-relaxed text-slate-300">
          <li>• Which exact survey number, title chain, and latest EC support this plot?</li>
          <li>• Which approval authority covers the layout, and can I verify the approval number?</li>
          <li>• Which recent registered transaction supports the quoted price?</li>
        </ul>
      </section>

      <section className="mb-6 flex items-start gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
        <Database size={14} className="mt-0.5 shrink-0 text-slate-400" />
        <p className="text-[11px] leading-relaxed text-slate-400">Source note: PlotDNA combines the current locality profile, mapped growth signals, and available project context. Exact plot documents and live transaction evidence require independent verification.</p>
      </section>

      <Link
        to={buildAreaStoryPath(area.slug, 'compare')}
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-sans font-black text-slate-950"
        style={{ background: `linear-gradient(90deg, ${scoreColor}, #38bdf8)` }}
      >
        <Scale size={16} />
        Compare Areas
      </Link>
    </div>
  )
}
