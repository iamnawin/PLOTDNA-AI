import { useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import createGlobe from 'cobe'
import { Activity, Globe, MapPin } from 'lucide-react'
import { CITY_LIST } from '@/data/cities'
import type { LocalityFallbackResult } from '@/lib/plotAnalysis'

interface Props {
  citySlug: string
  cityName: string
  cityCenter: [number, number]
  fallback: LocalityFallbackResult | null
  coords: [number, number] | null
}

interface FocusTone {
  coreHex: string
  text: string
  softCss: string
  glowCss: string
  baseColor: [number, number, number]
  markerColor: [number, number, number]
  glowColor: [number, number, number]
  arcColor: [number, number, number]
}

function getCoverageMessage(fallback: LocalityFallbackResult | null, cityName: string) {
  if (!fallback) return `Exploring ${cityName} through a premium intelligence surface.`
  if (fallback.tier === 'exact_locality') return `Exact locality context is available for ${fallback.displayLabel}.`
  if (fallback.tier === 'nearby_micro_market') return `${fallback.displayLabel} is being used as an approximate nearby market context.`
  if (fallback.tier === 'city_zone_cluster') return `${fallback.displayLabel} is available as broad regional context only.`
  return 'Coverage limited in this region.'
}

function getFocusTone(fallback: LocalityFallbackResult | null): FocusTone {
  if (!fallback || fallback.tier === 'exact_locality') {
    return {
      coreHex: '#00e676',
      glowCss: 'rgba(0,230,118,0.34)',
      softCss: 'rgba(0,230,118,0.16)',
      text: '#00e676',
      baseColor: [0.05, 0.16, 0.16],
      markerColor: [0, 0.9, 0.46],
      glowColor: [0.08, 0.72, 0.4],
      arcColor: [0.34, 0.96, 0.62],
    }
  }
  if (fallback.tier === 'nearby_micro_market') {
    return {
      coreHex: '#7CFFB0',
      glowCss: 'rgba(124,255,176,0.3)',
      softCss: 'rgba(124,255,176,0.15)',
      text: '#7CFFB0',
      baseColor: [0.06, 0.16, 0.17],
      markerColor: [0.49, 1, 0.69],
      glowColor: [0.16, 0.68, 0.48],
      arcColor: [0.62, 1, 0.78],
    }
  }
  if (fallback.tier === 'city_zone_cluster') {
    return {
      coreHex: '#f59e0b',
      glowCss: 'rgba(245,158,11,0.28)',
      softCss: 'rgba(245,158,11,0.14)',
      text: '#f5b84d',
      baseColor: [0.09, 0.15, 0.16],
      markerColor: [0.96, 0.62, 0.04],
      glowColor: [0.64, 0.4, 0.08],
      arcColor: [1, 0.78, 0.22],
    }
  }
  return {
    coreHex: '#ef4444',
    glowCss: 'rgba(239,68,68,0.26)',
    softCss: 'rgba(239,68,68,0.12)',
    text: '#f87171',
    baseColor: [0.1, 0.14, 0.16],
    markerColor: [0.94, 0.27, 0.27],
    glowColor: [0.52, 0.16, 0.16],
    arcColor: [0.98, 0.48, 0.48],
  }
}

function orientationForLocation([lat, lng]: [number, number]) {
  const latRad = (lat * Math.PI) / 180
  const lngRad = (lng * Math.PI) / 180

  return {
    phi: Math.PI / 2 - lngRad,
    theta: latRad,
  }
}

export default function GlobeView({ citySlug, cityName, cityCenter, fallback, coords }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const focusPoint = coords ?? cityCenter
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

  const focusOrientation = useMemo(
    () => orientationForLocation(focusPoint),
    [focusPoint],
  )

  const networkPoints = useMemo(
    () => CITY_LIST.slice(0, 6).map(city => ({ slug: city.slug, center: city.center })),
    [],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let globe: { destroy: () => void } | null = null
    let phi = focusOrientation.phi
    let theta = focusOrientation.theta
    let time = 0

    const buildArcs = () => {
      const activeCity = networkPoints.find(point => point.slug === citySlug)?.center ?? cityCenter
      return networkPoints
        .filter(point => point.slug !== citySlug)
        .slice(0, 4)
        .map(point => ({
          from: activeCity,
          to: point.center,
          color: tone.arcColor,
        }))
    }

    const buildMarkers = (focusPulse: number) => {
      const networkMarkers = networkPoints.map(point => ({
        location: point.center,
        size: point.slug === citySlug ? 0.11 : 0.045,
        color: point.slug === citySlug ? tone.markerColor : [0.38, 0.48, 0.48] as [number, number, number],
      }))

      return [
        ...networkMarkers,
        {
          location: focusPoint,
          size: focusPulse,
          color: tone.markerColor,
        },
      ]
    }

    const renderGlobe = () => {
      const size = canvas.offsetWidth
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2)

      globe?.destroy()
      globe = createGlobe(canvas, {
        devicePixelRatio,
        width: size * devicePixelRatio,
        height: size * devicePixelRatio,
        phi: focusOrientation.phi,
        theta: focusOrientation.theta,
        dark: 1,
        diffuse: 1.45,
        scale: 1,
        mapSamples: 18000,
        mapBrightness: 2.8,
        mapBaseBrightness: 0.08,
        baseColor: tone.baseColor,
        markerColor: tone.markerColor,
        glowColor: tone.glowColor,
        markers: buildMarkers(0.08),
        arcs: buildArcs(),
        arcColor: tone.arcColor,
        arcWidth: 0.55,
        arcHeight: 0.18,
        markerElevation: 0.12,
        opacity: 0.98,
        onRender: (state: {
          phi: number
          theta: number
          markers: ReturnType<typeof buildMarkers>
          arcWidth: number
        }) => {
          time += 1
          const driftPhi = focusOrientation.phi + Math.sin(time * 0.004) * 0.12
          const driftTheta = focusOrientation.theta + Math.cos(time * 0.0032) * 0.03

          phi += (driftPhi - phi) * 0.06
          theta += (driftTheta - theta) * 0.06

          state.phi = phi
          state.theta = theta
          state.markers = buildMarkers(0.075 + (1 + Math.sin(time * 0.08)) * 0.018)
          state.arcWidth = 0.48 + (1 + Math.sin(time * 0.045)) * 0.04
        },
      } as never)
    }

    const resizeObserver = new ResizeObserver(renderGlobe)
    resizeObserver.observe(canvas)
    renderGlobe()

    return () => {
      resizeObserver.disconnect()
      globe?.destroy()
    }
  }, [cityCenter, citySlug, focusOrientation.phi, focusOrientation.theta, focusPoint, networkPoints, tone])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 50% 46%, ${tone.softCss}, transparent 16%),
            radial-gradient(circle at 50% 52%, rgba(10,18,26,0.74), rgba(5,5,10,0.96) 60%),
            linear-gradient(180deg, rgba(0,230,118,0.025), rgba(5,5,10,0.94))
          `,
        }}
      />

      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.9, 1, 0.94] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${tone.softCss}, transparent 22%)`,
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative" style={{ width: 'min(74vw, 820px)', height: 'min(74vw, 820px)' }}>
          <div
            className="absolute left-1/2 top-[77%] -translate-x-1/2 rounded-full"
            style={{
              width: '70%',
              height: '12%',
              background: 'radial-gradient(circle, rgba(0,0,0,0.52), rgba(0,0,0,0.04) 72%)',
              filter: 'blur(22px)',
            }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ y: [0, -4, 0, 3, 0], rotate: [0, 0.6, 0, -0.5, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '84%', height: '84%' }}
          >
            <div
              className="absolute inset-[-5%] rounded-full"
              style={{
                background: `radial-gradient(circle, ${tone.glowCss} 0%, rgba(0,0,0,0) 62%)`,
                filter: 'blur(28px)',
              }}
            />

            <div
              className="absolute inset-[-1.5%] rounded-full"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: `
                  inset 0 0 28px rgba(255,255,255,0.04),
                  inset 0 -30px 90px rgba(0,0,0,0.42),
                  0 24px 80px rgba(0,0,0,0.4)
                `,
              }}
            />

            <div
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(circle at 28% 24%, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 16%, rgba(0,0,0,0) 34%),
                  radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 60%, ${tone.softCss} 70%, rgba(255,255,255,0.03) 74%, rgba(0,0,0,0) 78%)
                `,
              }}
            >
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            </div>

            <motion.div
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '50%',
                width: '22%',
                height: '22%',
                marginLeft: '-11%',
                marginTop: '-11%',
                background: `radial-gradient(circle, ${tone.softCss}, rgba(0,0,0,0) 68%)`,
                filter: 'blur(12px)',
              }}
              animate={{ opacity: [0.18, 0.3, 0.18], scale: [0.96, 1.05, 0.96] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
            />
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
        <div className="flex items-center gap-2 mb-2 mt-4">
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
