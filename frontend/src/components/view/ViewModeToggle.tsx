import { Globe, Map } from 'lucide-react'

export type ViewMode = 'map' | 'globe'

interface Props {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
  variant?: 'panel' | 'dock'
}

const OPTIONS: Array<{ mode: ViewMode; label: string; Icon: typeof Map }> = [
  { mode: 'map', label: 'Map', Icon: Map },
  { mode: 'globe', label: 'Globe', Icon: Globe },
]

export default function ViewModeToggle({ mode, onChange, variant = 'panel' }: Props) {
  const isDock = variant === 'dock'

  return (
    <div
      className={isDock ? 'rounded-xl p-1.5' : 'w-full rounded-2xl p-2'}
      style={{
        background: isDock
          ? 'rgba(255,255,255,0.03)'
          : 'linear-gradient(180deg, rgba(8,12,18,0.9), rgba(5,5,10,0.82))',
        backdropFilter: 'blur(24px)',
        border: isDock ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isDock ? 'inset 0 0 14px rgba(255,255,255,0.02)' : '0 16px 38px rgba(0,0,0,0.34)',
      }}
    >
      {!isDock && (
        <p className="text-[8px] font-mono text-[#444455] uppercase tracking-[0.18em] px-1 mb-2">
          Visual Mode
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ mode: optionMode, label, Icon }) => {
          const active = mode === optionMode
          return (
            <button
              key={optionMode}
              onClick={() => onChange(optionMode)}
              className="flex items-center justify-center gap-2 rounded-xl transition-all duration-200"
              style={{
                padding: isDock ? '9px 12px' : '10px 14px',
                background: active
                  ? 'linear-gradient(180deg, rgba(0,230,118,0.2), rgba(0,230,118,0.08))'
                  : 'rgba(255,255,255,0.03)',
                border: active
                  ? '1px solid rgba(0,230,118,0.34)'
                  : '1px solid rgba(255,255,255,0.05)',
                boxShadow: active
                  ? '0 0 18px rgba(0,230,118,0.18), inset 0 0 18px rgba(0,230,118,0.06)'
                  : 'inset 0 0 14px rgba(255,255,255,0.02)',
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
    </div>
  )
}
