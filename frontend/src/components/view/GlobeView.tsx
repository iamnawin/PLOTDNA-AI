import { motion } from 'framer-motion'
import { Activity, Globe, MapPin } from 'lucide-react'
import type { LocalityFallbackResult } from '@/lib/plotAnalysis'

interface Props {
  citySlug: string
  cityName: string
  cityCenter: [number, number]
  fallback: LocalityFallbackResult | null
  coords: [number, number] | null
}

const INDIA_BOUNDS = {
  latMin: 6,
  latMax: 37,
  lngMin: 68,
  lngMax: 97,
}

function projectIndiaFocus(lat: number, lng: number) {
  const lngRatio = (lng - INDIA_BOUNDS.lngMin) / (INDIA_BOUNDS.lngMax - INDIA_BOUNDS.lngMin)
  const latRatio = 1 - (lat - INDIA_BOUNDS.latMin) / (INDIA_BOUNDS.latMax - INDIA_BOUNDS.latMin)

  return {
    left: `${20 + lngRatio * 46}%`,
    top: `${18 + latRatio * 52}%`,
  }
}

function getCoverageMessage(fallback: LocalityFallbackResult | null, cityName: string) {
  if (!fallback) return `Exploring ${cityName} through a premium intelligence surface.`
  if (fallback.tier === 'exact_locality') return `Exact locality context is available for ${fallback.displayLabel}.`
  if (fallback.tier === 'nearby_micro_market') return `${fallback.displayLabel} is being used as an approximate nearby market context.`
  if (fallback.tier === 'city_zone_cluster') return `${fallback.displayLabel} is available as broad regional context only.`
  return 'Coverage limited in this region.'
}

function getFocusTone(fallback: LocalityFallbackResult | null) {
  if (!fallback || fallback.tier === 'exact_locality') {
    return {
      core: '#00e676',
      glow: 'rgba(0,230,118,0.42)',
      soft: 'rgba(0,230,118,0.18)',
      text: '#00e676',
    }
  }
  if (fallback.tier === 'nearby_micro_market') {
    return {
      core: '#7CFFB0',
      glow: 'rgba(124,255,176,0.34)',
      soft: 'rgba(124,255,176,0.16)',
      text: '#7CFFB0',
    }
  }
  if (fallback.tier === 'city_zone_cluster') {
    return {
      core: '#f59e0b',
      glow: 'rgba(245,158,11,0.36)',
      soft: 'rgba(245,158,11,0.14)',
      text: '#f5b84d',
    }
  }
  return {
    core: '#ef4444',
    glow: 'rgba(239,68,68,0.34)',
    soft: 'rgba(239,68,68,0.14)',
    text: '#f87171',
  }
}

export default function GlobeView({ citySlug, cityName, cityCenter, fallback, coords }: Props) {
  const focusPoint = coords ?? cityCenter
  const projected = projectIndiaFocus(focusPoint[0], focusPoint[1])
  const coverageMessage = getCoverageMessage(fallback, cityName)
  const focusLabel = fallback?.displayLabel ?? `${cityName}, India`
  const precisionLabel =
    fallback?.precisionLabel === 'exact'
      ? 'Exact locality'
      : fallback?.precisionLabel === 'approximate'
        ? 'Approximate locality'
        : fallback?.precisionLabel === 'broad'
          ? 'Broad region'
          : 'City context'
  const tone = getFocusTone(fallback)
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 50% 44%, rgba(0,230,118,0.08), transparent 18%),
            radial-gradient(circle at 52% 50%, rgba(13,22,30,0.9), rgba(5,5,10,0.96) 56%),
            linear-gradient(180deg, rgba(0,230,118,0.035), rgba(5,5,10,0.94))
          `,
        }}
      />

      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.9, 1, 0.92] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: `radial-gradient(circle at 52% 48%, ${tone.soft}, transparent 24%)`,
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative" style={{ width: 'min(66vw, 700px)', height: 'min(66vw, 700px)' }}>
          <div
            className="absolute left-1/2 top-[73%] -translate-x-1/2 rounded-full"
            style={{
              width: '72%',
              height: '11%',
              background: 'radial-gradient(circle, rgba(0,0,0,0.46), rgba(0,0,0,0.02) 72%)',
              filter: 'blur(18px)',
            }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{
              rotate: [0, 1.2, 0, -1.1, 0],
              y: [0, -4, 0, 3, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '78%',
              height: '78%',
              transformStyle: 'preserve-3d',
              perspective: 1600,
            }}
          >
            <div
              className="absolute inset-[-6%] rounded-full"
              style={{
                background: `radial-gradient(circle, ${tone.glow} 0%, rgba(0,0,0,0) 62%)`,
                filter: 'blur(26px)',
                opacity: 0.9,
              }}
            />

            <div
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(circle at 34% 28%, rgba(210,255,233,0.2), rgba(44,78,68,0.16) 18%, rgba(11,23,31,0.1) 32%, rgba(7,10,16,0.92) 72%),
                  radial-gradient(circle at 66% 76%, rgba(6,12,18,0.92), rgba(3,6,10,0.98) 58%),
                  linear-gradient(145deg, rgba(10,20,26,0.96), rgba(5,5,10,0.98))
                `,
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: `
                  inset -30px -40px 80px rgba(0,0,0,0.7),
                  inset 18px 20px 36px rgba(255,255,255,0.05),
                  0 22px 80px rgba(0,0,0,0.46)
                `,
              }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
                style={{
                  opacity: 0.26,
                  background: `
                    repeating-linear-gradient(0deg, transparent 0 24px, rgba(255,255,255,0.055) 24px 25px),
                    repeating-linear-gradient(90deg, transparent 0 28px, rgba(255,255,255,0.03) 28px 29px)
                  `,
                  mixBlendMode: 'screen',
                }}
              />

              <motion.div
                className="absolute inset-0"
                animate={{ rotate: [0, 6, 0, -4, 0] }}
                transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: `
                    radial-gradient(ellipse at 58% 45%, rgba(44,88,76,0.58), transparent 18%),
                    radial-gradient(ellipse at 48% 52%, rgba(18,44,38,0.82), transparent 16%),
                    radial-gradient(ellipse at 62% 58%, rgba(14,34,30,0.66), transparent 14%)
                  `,
                  filter: 'blur(10px)',
                }}
              />

              <motion.div
                className="absolute rounded-[45%]"
                animate={{ x: [0, 6, 0], y: [0, -4, 0], rotate: [18, 20, 18] }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  left: '49%',
                  top: '30%',
                  width: '18%',
                  height: '26%',
                  background: 'linear-gradient(180deg, rgba(109,193,146,0.22), rgba(18,48,38,0.9))',
                  boxShadow: `0 0 22px ${tone.soft}`,
                  filter: 'blur(1px)',
                  transformOrigin: '50% 50%',
                }}
              />

              <motion.div
                className="absolute rounded-[48%]"
                animate={{ x: [0, -4, 0], y: [0, 3, 0], rotate: [-16, -18, -16] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  left: '34%',
                  top: '28%',
                  width: '22%',
                  height: '18%',
                  background: 'linear-gradient(180deg, rgba(92,168,128,0.18), rgba(10,28,24,0.82))',
                  filter: 'blur(2px)',
                }}
              />

              <div
                className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(circle at 28% 25%, rgba(255,255,255,0.16), transparent 14%),
                    radial-gradient(circle at 52% 46%, ${tone.soft}, transparent 12%),
                    radial-gradient(circle at 84% 18%, rgba(255,255,255,0.05), transparent 12%)
                  `,
                  mixBlendMode: 'screen',
                }}
              />

              <motion.div
                className="absolute rounded-full"
                animate={{ x: [-12, 14, -12], y: [-8, 6, -8], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  left: '18%',
                  top: '12%',
                  width: '34%',
                  height: '34%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.18), rgba(255,255,255,0) 72%)',
                  filter: 'blur(10px)',
                }}
              />

              <div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 56%, rgba(149,255,215,0.1) 68%, rgba(255,255,255,0.02) 73%, rgba(0,0,0,0) 78%)',
                }}
              />

              <motion.div
                className="absolute rounded-full"
                style={{
                  ...projected,
                  width: 12,
                  height: 12,
                  marginLeft: -6,
                  marginTop: -6,
                  background: tone.core,
                  boxShadow: `0 0 22px ${tone.core}`,
                }}
                animate={{ scale: [1, 1.36, 1], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />

              <motion.div
                className="absolute rounded-full"
                style={{
                  ...projected,
                  width: 42,
                  height: 42,
                  marginLeft: -21,
                  marginTop: -21,
                  border: `1px solid ${tone.glow}`,
                }}
                animate={{ scale: [0.92, 1.18, 0.92], opacity: [0.24, 0.72, 0.24] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />

              <motion.div
                className="absolute rounded-full"
                style={{
                  ...projected,
                  width: 110,
                  height: 110,
                  marginLeft: -55,
                  marginTop: -55,
                  background: `radial-gradient(circle, ${tone.soft}, rgba(0,0,0,0) 68%)`,
                  filter: 'blur(6px)',
                }}
                animate={{ opacity: [0.2, 0.42, 0.2] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>

        </div>
      </div>

      <div className="absolute z-[2] max-w-[280px] rounded-2xl px-4 py-3" style={{
        left: 'max(28px, calc(50% - 520px))',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'linear-gradient(180deg, rgba(8,12,18,0.88), rgba(5,5,10,0.76))',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 16px 38px rgba(0,0,0,0.34)',
      }}>
        <div className="flex items-center gap-2 mb-2">
          <Globe size={12} style={{ color: tone.text }} />
          <p className="text-[10px] font-mono uppercase tracking-[0.16em]" style={{ color: tone.text }}>
            Globe Intelligence View
          </p>
        </div>
        <p className="text-sm font-mono text-[#e8e8f0] leading-relaxed">
          Premium geospatial storytelling anchored to the active PlotDNA market context.
        </p>
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={12} style={{ color: tone.text }} />
          <p className="text-[10px] font-mono text-[#444455] uppercase tracking-[0.16em]">
            Focus Region
          </p>
        </div>
        <p className="text-[13px] font-mono text-[#e8e8f0] mb-1">{focusLabel}</p>
        <p className="text-[10px] font-mono text-[#666680] mb-3">{precisionLabel}</p>
        <div className="flex items-center gap-2 mb-2">
          <Activity size={12} style={{ color: tone.text }} />
          <p className="text-[10px] font-mono text-[#444455] uppercase tracking-[0.16em]">
            Coverage Status
          </p>
        </div>
        <p className="text-[12px] font-mono text-[#aaaabc] leading-relaxed">
          {coverageMessage}
        </p>
        {citySlug === 'hyderabad' && (
          <p className="text-[10px] font-mono mt-2" style={{ color: tone.text }}>
            Hyderabad is currently the strongest supported intelligence corridor.
          </p>
        )}
      </div>
    </div>
  )
}
