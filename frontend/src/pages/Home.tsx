import { AnimatePresence } from 'framer-motion'
import { Search, MapPin } from 'lucide-react'
import { useAppStore } from '@/store'
import { hyderabadAreas } from '@/data/hyderabad'
import { getScoreColor } from '@/lib/utils'
import MapView from '@/components/map/MapView'
import ScoreCard from '@/components/score/ScoreCard'

export default function Home() {
  const { selectedArea, setSelectedArea } = useAppStore()

  const sorted = [...hyderabadAreas].sort((a, b) => b.score - a.score)

  return (
    <div className="flex flex-col h-screen bg-[#050508] overflow-hidden">

      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-5 h-13 flex-shrink-0 z-[1001]"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(5,5,10,0.95)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00e676, #00b36b)', boxShadow: '0 0 12px #00e67640' }}
          >
            <span className="text-black font-display font-black text-xs">P</span>
          </div>
          <span className="font-display font-bold text-[#e8e8f0] tracking-tight">PlotDNA</span>
          <span className="text-[#2a2a3e] mx-1 font-mono text-sm">|</span>
          <span className="text-xs font-mono text-[#555566] uppercase tracking-widest flex items-center gap-1">
            <MapPin size={10} className="text-[#00e676]" />
            Hyderabad
          </span>
        </div>

        {/* Search hint */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono text-[#444455]"
          style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
        >
          <Search size={12} />
          <span>Search a plot or area…</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-mono text-[#444455] uppercase tracking-wider">Micro-markets</p>
            <p className="text-sm font-mono font-bold text-[#e8e8f0]">{hyderabadAreas.length}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono text-[#444455] uppercase tracking-wider">Avg DNA</p>
            <p className="text-sm font-mono font-bold text-[#22c55e]">
              {Math.round(hyderabadAreas.reduce((s, a) => s + a.score, 0) / hyderabadAreas.length)}
            </p>
          </div>
        </div>
      </header>

      {/* ── Main: Map + overlays ── */}
      <div className="relative flex-1 overflow-hidden">

        {/* Map */}
        <div className="absolute inset-0 z-0">
          <MapView />
        </div>

        {/* ── Left sidebar: Area list ── */}
        <div
          className="absolute top-4 left-4 bottom-4 w-64 z-[999] flex flex-col rounded-xl overflow-hidden"
          style={{
            background: 'rgba(5,5,10,0.88)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] font-mono text-[#444455] uppercase tracking-widest">Ranked by DNA Score</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sorted.map((area, idx) => {
              const color = getScoreColor(area.score)
              const isSelected = selectedArea?.slug === area.slug
              return (
                <button
                  key={area.slug}
                  onClick={() => setSelectedArea(isSelected ? null : area)}
                  className="w-full text-left px-4 py-3 transition-all"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: isSelected ? `${color}10` : 'transparent',
                    borderLeft: isSelected ? `2px solid ${color}` : '2px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Rank */}
                    <span className="text-[10px] font-mono text-[#333344] w-4 text-right flex-shrink-0">
                      {idx + 1}
                    </span>

                    {/* Name + category */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-mono truncate ${isSelected ? 'text-[#e8e8f0]' : 'text-[#aaaabc]'}`}>
                        {area.name}
                      </p>
                      <p className="text-[10px] text-[#444455] font-mono uppercase tracking-wide">
                        {area.category}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0 text-right">
                      <span className="text-sm font-mono font-bold" style={{ color }}>
                        {area.score}
                      </span>
                      {/* Mini bar */}
                      <div className="w-10 h-0.5 bg-[#1a1a2e] rounded-full mt-1 ml-auto">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${area.score}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Right: Score panel (slides in) ── */}
        <AnimatePresence>
          {selectedArea && (
            <ScoreCard
              area={selectedArea}
              onClose={() => setSelectedArea(null)}
            />
          )}
        </AnimatePresence>

        {/* ── Legend (bottom) ── */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-5 px-5 py-2.5 rounded-full z-[999]"
          style={{
            background: 'rgba(5,5,10,0.88)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {[
            { color: '#ef4444', label: 'High Risk', range: '0–40' },
            { color: '#f59e0b', label: 'Moderate', range: '41–65' },
            { color: '#22c55e', label: 'Good Growth', range: '66–85' },
            { color: '#10b981', label: 'Goldzone', range: '86–100' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: `${item.color}40`, border: `1.5px solid ${item.color}` }}
              />
              <span className="text-[10px] font-mono text-[#666680]">{item.label}</span>
              <span className="text-[10px] font-mono text-[#333344]">{item.range}</span>
            </div>
          ))}
        </div>

        {/* Click hint */}
        <div
          className="absolute bottom-4 right-4 text-[10px] font-mono text-[#333344] z-[999]"
          style={{ display: selectedArea ? 'none' : 'block' }}
        >
          Click a zone to inspect · Double-click for full analysis
        </div>
      </div>
    </div>
  )
}
