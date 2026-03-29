import { Globe, Map } from 'lucide-react'

export type ViewMode = 'map' | 'globe'

interface Props {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

const OPTIONS: Array<{ mode: ViewMode; label: string; Icon: typeof Map }> = [
  { mode: 'map', label: 'Map', Icon: Map },
  { mode: 'globe', label: 'Globe', Icon: Globe },
]

export default function ViewModeToggle({ mode, onChange }: Props) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl"
      style={{
        background: 'rgba(5,5,10,0.92)',
        backdropFilter: 'blur(22px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      {OPTIONS.map(({ mode: optionMode, label, Icon }) => {
        const active = mode === optionMode
        return (
          <button
            key={optionMode}
            onClick={() => onChange(optionMode)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all duration-200"
            style={{
              background: active ? 'rgba(0,230,118,0.12)' : 'transparent',
              border: active ? '1px solid rgba(0,230,118,0.3)' : '1px solid transparent',
              boxShadow: active ? '0 0 14px rgba(0,230,118,0.16)' : 'none',
            }}
          >
            <Icon size={12} style={{ color: active ? '#00e676' : '#666680' }} />
            <span
              className="text-[10px] font-mono uppercase tracking-[0.14em]"
              style={{ color: active ? '#00e676' : '#888899' }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
