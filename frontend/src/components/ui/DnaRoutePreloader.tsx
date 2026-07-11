import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const DNA_STEPS = [
  {
    label: 'Finding the area...',
    insight: 'Reading location and nearby market signals.',
    pct: 34,
  },
  {
    label: 'Checking money risk...',
    insight: 'Checking price, growth, access, and risk signals.',
    pct: 68,
  },
  {
    label: 'Preparing verdict...',
    insight: 'Opening your PlotDNA result.',
    pct: 100,
  },
]

const STEP_READ_MS = 420
const COMPLETE_DELAY_MS = 120

interface Props {
  active: boolean
  onComplete: () => void
}

export default function DnaRoutePreloader({ active, onComplete }: Props) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!active) return

    let currentStep = 0
    let completionTimer: number | null = null
    const interval = window.setInterval(() => {
      currentStep += 1
      if (currentStep >= DNA_STEPS.length) {
        window.clearInterval(interval)
        completionTimer = window.setTimeout(onComplete, COMPLETE_DELAY_MS)
        return
      }
      setStep(currentStep)
    }, STEP_READ_MS)

    return () => {
      window.clearInterval(interval)
      if (completionTimer !== null) window.clearTimeout(completionTimer)
    }
  }, [active, onComplete])

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="dna-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(5, 7, 20, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 420, height: 420, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', width: 64, height: 80, marginBottom: 32 }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <motion.div
                key={i}
                animate={{
                  x: [0, 18, 0, -18, 0],
                  opacity: [0.25, 1, 0.25],
                  scale: [0.7, 1.1, 0.7],
                }}
                transition={{
                  duration: 1.4,
                  delay: i * 0.18,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'absolute',
                  top: i * 12,
                  left: 24,
                  width: 16, height: 16, borderRadius: '50%',
                  background: i % 2 === 0 ? '#10b981' : '#3b82f6',
                  boxShadow: i % 2 === 0
                    ? '0 0 12px rgba(16,185,129,0.6)'
                    : '0 0 12px rgba(59,130,246,0.6)',
                  display: 'block',
                }}
              />
            ))}
            <div style={{
              position: 'absolute', left: 31, top: 4, width: 2, height: 72,
              background: 'linear-gradient(to bottom, transparent, rgba(16,185,129,0.3), transparent)',
            }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <img
              src="/plotdna-logo.png"
              alt="PlotDNA"
              className="w-8 h-8 rounded-xl object-cover"
              style={{ boxShadow: '0 0 24px rgba(16,185,129,0.5)' }}
            />
            <span className="font-display" style={{ fontSize: 16, fontWeight: 700, color: '#e8e8f0', letterSpacing: '-0.02em' }}>PlotDNA</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              style={{ fontSize: 13, color: '#10b981', marginBottom: 20, textAlign: 'center', minHeight: 20, fontWeight: 500 }}
            >
              {DNA_STEPS[step]?.label}
            </motion.p>
          </AnimatePresence>

          <div style={{
            width: 240, height: 3, borderRadius: 99,
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
            marginBottom: 14,
          }}>
            <motion.div
              animate={{ width: `${DNA_STEPS[step]?.pct ?? 0}%` }}
              transition={{ duration: 0.38, ease: 'easeOut' }}
              style={{
                height: '100%', borderRadius: 99,
                background: 'linear-gradient(90deg, #059669, #10b981)',
                boxShadow: '0 0 8px rgba(16,185,129,0.5)',
              }}
            />
          </div>

          <p style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.1em' }}>
            <span className="font-display font-bold">{DNA_STEPS[step]?.pct ?? 0}%</span>{' - '}Preparing buyer verdict
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={`insight-${step}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              style={{
                maxWidth: 440,
                marginTop: 18,
                padding: '0 24px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: 13,
                lineHeight: 1.6,
                letterSpacing: '-0.01em',
              }}
            >
              {DNA_STEPS[step]?.insight}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
