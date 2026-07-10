import { Link } from 'react-router-dom'
import { Search, ShieldCheck, IndianRupee, Map, Scale, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { buildAreaStoryPath, type AreaStoryStep } from './areaStoryNav'

const TAB_ICON: Record<'check' | 'verdict' | 'money' | 'map' | 'compare' | 'pass', LucideIcon> = {
  check: Search,
  verdict: ShieldCheck,
  money: IndianRupee,
  map: Map,
  compare: Scale,
  pass: FileText,
}

const TAB_LABEL: Record<'check' | 'verdict' | 'money' | 'map' | 'compare' | 'pass', string> = {
  check: 'Check',
  verdict: 'Verdict',
  money: 'Money',
  map: 'Map',
  compare: 'Compare',
  pass: 'Pass',
}

const TAB_ORDER: Array<'check' | 'verdict' | 'money' | 'map' | 'compare' | 'pass'> = [
  'check', 'verdict', 'money', 'map', 'compare', 'pass',
]

interface AreaStoryTabBarProps {
  slug: string
  activeStep: AreaStoryStep
}

export default function AreaStoryTabBar({ slug, activeStep }: AreaStoryTabBarProps) {
  return (
    <nav
      aria-label="PlotDNA area story navigation"
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto grid max-w-[640px] grid-cols-6 gap-1 rounded-2xl border border-white/10 bg-slate-950/92 p-2 shadow-[0_18px_44px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:static sm:mb-4 sm:mt-0 sm:shadow-none sm:backdrop-blur-none"
    >
      {TAB_ORDER.map(step => {
        const Icon = TAB_ICON[step]
        const isActive = step === activeStep
        const to = step === 'check' ? '/map' : buildAreaStoryPath(slug, step)
        return (
          <Link
            key={step}
            to={to}
            className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-sans font-black transition-colors ${
              isActive ? 'bg-emerald-400/14 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon size={15} />
            {TAB_LABEL[step]}
          </Link>
        )
      })}
    </nav>
  )
}
