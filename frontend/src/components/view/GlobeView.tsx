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
    left: `${24 + lngRatio * 48}%`,
    top: `${22 + latRatio * 50}%`,
  }
}

function getCoverageMessage(fallback: LocalityFallbackResult | null, cityName: string) {
  if (!fallback) {
    return `Exploring ${cityName} through a premium intelligence surface.`
  }
  if (fallback.tier === 'exact_locality') {
    return `Exact locality context is available for ${fallback.displayLabel}.`
  }
  if (fallback.tier === 'nearby_micro_market') {
    return `${fallback.displayLabel} is being used as an approximate nearby market context.`
  }
  if (fallback.tier === 'city_zone_cluster') {
    return `${fallback.displayLabel} is available as broad regional context only.`
  }
  return 'Coverage limited in this region.'
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

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 50% 45%, rgba(0,230,118,0.12), transparent 28%),
            radial-gradient(circle at 50% 50%, rgba(10,18,22,0.78), rgba(5,5,10,0.96) 66%),
            linear-gradient(180deg, rgba(0,230,118,0.03), rgba(5,5,10,0.92))
          `,
        }}
      />

      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 540,
            height: 540,
            background: 'radial-gradient(circle at 38% 32%, rgba(0,230,118,0.22), rgba(13,22,28,0.88) 42%, rgba(5,5,10,0.9) 72%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 0 80px rgba(0,230,118,0.12), inset 0 0 48px rgba(255,255,255,0.04)',
          }}
        />

        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 620,
            height: 620,
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        />

        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 700,
            height: 700,
            border: '1px solid rgba(0,230,118,0.08)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        />

        <motion.div
          className="absolute rounded-full"
          style={{
            ...projected,
            width: 12,
            height: 12,
            background: '#00e676',
            boxShadow: '0 0 16px rgba(0,230,118,0.75)',
          }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute rounded-full"
          style={{
            ...projected,
            width: 34,
            height: 34,
            marginLeft: -11,
            marginTop: -11,
            border: '1px solid rgba(0,230,118,0.42)',
          }}
          animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.3, 0.75, 0.3] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="absolute left-5 top-5 z-[2] max-w-[280px] rounded-2xl px-4 py-3" style={{
        background: 'rgba(5,5,10,0.82)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div className="flex items-center gap-2 mb-2">
          <Globe size={12} className="text-[#00e676]" />
          <p className="text-[10px] font-mono text-[#00e676] uppercase tracking-[0.16em]">
            Globe Intelligence View
          </p>
        </div>
        <p className="text-sm font-mono text-[#e8e8f0] leading-relaxed">
          Premium regional storytelling for the current PlotDNA context.
        </p>
      </div>

      <div className="absolute left-5 bottom-5 z-[2] max-w-[320px] rounded-2xl px-4 py-3" style={{
        background: 'rgba(5,5,10,0.82)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={12} className="text-[#00e676]" />
          <p className="text-[10px] font-mono text-[#444455] uppercase tracking-[0.16em]">
            Focus Region
          </p>
        </div>
        <p className="text-[13px] font-mono text-[#e8e8f0] mb-1">{focusLabel}</p>
        <p className="text-[10px] font-mono text-[#666680]">{precisionLabel}</p>
      </div>

      <div className="absolute right-5 bottom-5 z-[2] max-w-[320px] rounded-2xl px-4 py-3" style={{
        background: 'rgba(5,5,10,0.82)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div className="flex items-center gap-2 mb-2">
          <Activity size={12} className="text-[#00e676]" />
          <p className="text-[10px] font-mono text-[#444455] uppercase tracking-[0.16em]">
            Coverage Status
          </p>
        </div>
        <p className="text-[12px] font-mono text-[#aaaabc] leading-relaxed">
          {coverageMessage}
        </p>
        {citySlug === 'hyderabad' && (
          <p className="text-[10px] font-mono text-[#00e676] mt-2">
            Hyderabad remains the primary supported intelligence region.
          </p>
        )}
      </div>
    </div>
  )
}
