import { Link } from 'react-router-dom'
import { House, ShieldCheck, IndianRupee, Map, Scale, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { buildAreaStoryPath, type AreaStoryStep } from './areaStoryNav'

const TAB_ICON: Record<'check' | 'verdict' | 'money' | 'map' | 'compare' | 'pass', LucideIcon> = {
  check: House,
  verdict: ShieldCheck,
  money: IndianRupee,
  map: Map,
  compare: Scale,
  pass: FileText,
}

const TAB_LABEL: Record<'check' | 'verdict' | 'money' | 'map' | 'compare' | 'pass', string> = {
  check: 'Home',
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
      className="fixed inset-x-0 bottom-0 z-40 mx-auto grid h-[calc(4.25rem+env(safe-area-inset-bottom))] max-w-[640px] grid-cols-6 gap-0 border-t border-white/10 bg-slate-950/96 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:static sm:mb-4 sm:h-auto sm:rounded-xl sm:border sm:p-1 sm:backdrop-blur-none"
    >
      {TAB_ORDER.map(step => {
        const Icon = TAB_ICON[step]
        const isActive = step === activeStep
        const to = step === 'check' ? '/' : buildAreaStoryPath(slug, step)
        return (
          <Link
            key={step}
            to={to}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-0.5 py-2 text-[9px] font-sans font-bold transition-colors active:bg-white/[0.06] ${
              isActive ? 'bg-emerald-400/14 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon size={16} strokeWidth={1.8} />
            {TAB_LABEL[step]}
          </Link>
        )
      })}
    </nav>
  )
}
