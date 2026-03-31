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
  sidebarExpanded?: boolean
  onCityClick?: (slug: string, center: [number, number]) => void
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

interface GlobeMarker {
  location: [number, number]
  size: number
  color: [number, number, number]
}

interface GlobeArc {
  from: [number, number]
  to: [number, number]
  color: [number, number, number]
}

const INDIA_CENTER: [number, number] = [20.5937, 78.9629]

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
      baseColor: [0.015, 0.08, 0.075],
      markerColor: [0, 0.9, 0.46],
      glowColor: [0.018, 0.22, 0.13],
      arcColor: [0.34, 0.96, 0.62],
    }
  }
  if (fallback.tier === 'nearby_micro_market') {
    return {
      coreHex: '#7CFFB0',
      glowCss: 'rgba(124,255,176,0.3)',
      softCss: 'rgba(124,255,176,0.15)',
      text: '#7CFFB0',
      baseColor: [0.02, 0.085, 0.08],
      markerColor: [0.49, 1, 0.69],
      glowColor: [0.035, 0.2, 0.14],
      arcColor: [0.62, 1, 0.78],
    }
  }
  if (fallback.tier === 'city_zone_cluster') {
    return {
      coreHex: '#f59e0b',
      glowCss: 'rgba(245,158,11,0.28)',
      softCss: 'rgba(245,158,11,0.14)',
      text: '#f5b84d',
      baseColor: [0.035, 0.08, 0.08],
      markerColor: [0.96, 0.62, 0.04],
      glowColor: [0.16, 0.08, 0.015],
      arcColor: [1, 0.78, 0.22],
    }
  }
  return {
    coreHex: '#ef4444',
    glowCss: 'rgba(239,68,68,0.26)',
    softCss: 'rgba(239,68,68,0.12)',
    text: '#f87171',
    baseColor: [0.045, 0.075, 0.08],
    markerColor: [0.94, 0.27, 0.27],
    glowColor: [0.12, 0.05, 0.05],
    arcColor: [0.98, 0.48, 0.48],
  }
}

function orientationForLocation([lat, lng]: [number, number]) {
  const latRad = (lat * Math.PI) / 180
  const lngRad = (lng * Math.PI) / 180

  return {
    phi: (3 * Math.PI) / 2 - lngRad,
    theta: latRad,
  }
}

// Project a geographic (lat, lng) point to canvas screen coordinates given
// the current cobe globe orientation (phi, theta, scale).
// Uses cobe's planet-frame convention: wx=cos(lat)*cos(lng), wy=sin(lat), wz=-cos(lat)*sin(lng)
// then applies inverse globe rotation (Ry(-phi) * Rx(-theta)).
function projectToScreen(
  lat: number,
  lng: number,
  phi: number,
  theta: number,
  scale: number,
  cx: number,
  cy: number,
  canvasShortSide: number,
): { sx: number; sy: number; visible: boolean } {
  const latR = (lat * Math.PI) / 180
  const lngR = (lng * Math.PI) / 180

  const wx = Math.cos(latR) * Math.cos(lngR)
  const wy = Math.sin(latR)
  const wz = -Math.cos(latR) * Math.sin(lngR)

  const cosPhi = Math.cos(phi)
  const sinPhi = Math.sin(phi)
  const v1x = cosPhi * wx + sinPhi * wz
  const v1y = wy
  const v1z = -sinPhi * wx + cosPhi * wz

  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)
  const v2x = v1x
  const v2y = cosT * v1y - sinT * v1z
  const v2z = sinT * v1y + cosT * v1z

  const R = (canvasShortSide / 2) * scale
  return { sx: cx + v2x * R, sy: cy - v2y * R, visible: v2z > 0 }
}

export default function GlobeView({ citySlug, cityName, cityCenter, fallback, coords, sidebarExpanded = false, onCityClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const currentOrientationRef = useRef({ phi: 0, theta: 0, scale: 1 })
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null)
  const pointerRef = useRef({
    phiOffset: 0,
    thetaOffset: 0,
    targetPhiOffset: 0,
    targetThetaOffset: 0,
    hoverMix: 0,
    targetHoverMix: 0,
    scale: 1,
    targetScale: 1,
  })

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
    () => CITY_LIST.map(city => ({ slug: city.slug, center: city.center })),
    [],
  )

  const activeCityCenter = useMemo(
    () => networkPoints.find(point => point.slug === citySlug)?.center ?? cityCenter,
    [cityCenter, citySlug, networkPoints],
  )

  const infoCardStyle = useMemo(() => {
    const leftRailWidth = 204
    const leftRailInset = 20
    const horizontalGap = sidebarExpanded ? 52 : 34
    const reservedLeft = leftRailInset + leftRailWidth + horizontalGap

    return {
      left: reservedLeft,
      top: sidebarExpanded ? '54%' : '50%',
      width: sidebarExpanded
        ? 'min(220px, calc(100vw - 360px))'
        : 'min(248px, calc(100vw - 328px))',
      opacity: sidebarExpanded ? 0.86 : 1,
      background: sidebarExpanded
        ? 'linear-gradient(180deg, rgba(8,12,18,0.78), rgba(5,5,10,0.64))'
        : 'linear-gradient(180deg, rgba(8,12,18,0.84), rgba(5,5,10,0.7))',
      boxShadow: sidebarExpanded
        ? '0 14px 26px rgba(0,0,0,0.24)'
        : '0 16px 32px rgba(0,0,0,0.28)',
    }
  }, [sidebarExpanded])

  const clusterPoints = useMemo<[number, number][]>(
    () => [
      [activeCityCenter[0] + 0.6, activeCityCenter[1] - 0.45],
      [activeCityCenter[0] - 0.42, activeCityCenter[1] + 0.52],
      [activeCityCenter[0] + 0.24, activeCityCenter[1] + 0.72],
    ],
    [activeCityCenter],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let globe: ReturnType<typeof createGlobe> | null = null
    let phi = focusOrientation.phi + 0.22
    let theta = focusOrientation.theta - 0.05
    let time = 0
    let frameId = 0

    const buildArcs = (): GlobeArc[] =>
      networkPoints
        .filter(point => point.slug !== citySlug)
        .slice(0, 4)
        .map(point => ({
          from: activeCityCenter,
          to: point.center,
          color: point.slug === 'hyderabad' || citySlug === 'hyderabad'
            ? tone.arcColor
            : [0.42, 0.66, 0.58],
        }))

    const getFocusInfluence = (location: [number, number]) => {
      const latDistance = location[0] - activeCityCenter[0]
      const lngDistance = (location[1] - activeCityCenter[1]) * Math.cos((activeCityCenter[0] * Math.PI) / 180)
      const radialDistance = Math.sqrt(latDistance * latDistance + lngDistance * lngDistance)
      return Math.max(0, 1 - radialDistance / 7.5)
    }

    const buildMarkers = (focusPulse: number): GlobeMarker[] => {
      const networkMarkers: GlobeMarker[] = networkPoints.map(point => ({
        location: point.center,
        size: point.slug === citySlug ? 0.042 : 0.025 + getFocusInfluence(point.center) * 0.008,
        color: point.slug === citySlug ? tone.markerColor : [0.34, 0.45, 0.45],
      }))

      const contextualMarkers: GlobeMarker[] = [
        {
          location: INDIA_CENTER,
          size: citySlug === 'hyderabad' ? 0.034 : 0.028,
          color: [0.6, 0.78, 0.74],
        },
        {
          location: activeCityCenter,
          size: focusPulse,
          color: [0.24, 0.88, 0.64],
        },
        {
          location: activeCityCenter,
          size: 0.022,
          color: [0.84, 1, 0.92],
        },
        ...clusterPoints.map(location => ({
          location,
          size: 0.016 + getFocusInfluence(location) * 0.008,
          color: [0.42, 0.9, 0.72] as [number, number, number],
        })),
      ]

      if (coords) {
        contextualMarkers.push({
          location: focusPoint,
          size: 0.024,
          color: [0.92, 1, 0.98],
        })
      }

      return [...networkMarkers, ...contextualMarkers]
    }

    const getSize = () => Math.max(Math.min(canvas.offsetWidth, canvas.offsetHeight), 320)

    const updateSize = () => {
      if (!globe) return
      const size = getSize()
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2.5)
      globe.update({
        width: size * devicePixelRatio,
        height: size * devicePixelRatio,
      })
    }

    const animate = () => {
      if (!globe) return

      time += 1 / 60
      const pointer = pointerRef.current
      pointer.hoverMix += (pointer.targetHoverMix - pointer.hoverMix) * 0.12
      pointer.phiOffset += (pointer.targetPhiOffset - pointer.phiOffset) * 0.11
      pointer.thetaOffset += (pointer.targetThetaOffset - pointer.thetaOffset) * 0.11
      pointer.scale += (pointer.targetScale - pointer.scale) * 0.12

      const driftPhi =
        focusOrientation.phi
        + 0.18
        + Math.sin(time * 0.8) * (0.16 + pointer.hoverMix * 0.09)
        + Math.sin(time * 0.18) * 0.05
        + pointer.phiOffset
      const driftTheta =
        focusOrientation.theta * 0.78
        - 0.05
        + Math.cos(time * 0.46) * (0.075 + pointer.hoverMix * 0.045)
        + pointer.thetaOffset

      phi += (driftPhi - phi) * (0.075 + pointer.hoverMix * 0.035)
      theta += (driftTheta - theta) * (0.085 + pointer.hoverMix * 0.035)

      currentOrientationRef.current.phi = phi
      currentOrientationRef.current.theta = theta
      currentOrientationRef.current.scale = pointer.scale

      globe.update({
        phi,
        theta,
        scale: pointer.scale,
        markers: buildMarkers(0.038 + (1 + Math.sin(time * 2.7)) * 0.008),
        arcWidth: 0.72 + (1 + Math.sin(time * 1.4)) * 0.06,
      })

      frameId = window.requestAnimationFrame(animate)
    }

    const renderGlobe = () => {
      const size = Math.max(Math.min(canvas.offsetWidth, canvas.offsetHeight), 320)
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2.5)

      globe?.destroy()
      globe = createGlobe(canvas, {
        devicePixelRatio,
        width: size * devicePixelRatio,
        height: size * devicePixelRatio,
        phi,
        theta,
        dark: 1.08,
        diffuse: 1.78,
        scale: 1,
        mapSamples: 24000,
        mapBrightness: 6.2,
        mapBaseBrightness: 0.04,
        baseColor: tone.baseColor,
        markerColor: tone.markerColor,
        glowColor: tone.glowColor,
        offset: [0, 0.02],
        markers: buildMarkers(0.1),
        arcs: buildArcs(),
        arcColor: tone.arcColor,
        arcWidth: 0.78,
        arcHeight: 0.24,
        markerElevation: 0.2,
        opacity: 1,
      })

      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(animate)
    }

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(canvas)
    renderGlobe()

    return () => {
      resizeObserver.disconnect()
      window.cancelAnimationFrame(frameId)
      globe?.destroy()
    }
  }, [activeCityCenter, citySlug, clusterPoints, coords, focusOrientation.phi, focusOrientation.theta, focusPoint, networkPoints, tone])

  return (
    <div
      className="absolute inset-0 overflow-hidden"
    >
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
        animate={{ opacity: [0.58, 0.74, 0.62] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${tone.softCss}, transparent 30%)`,
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: 'min(80vw, 900px)', height: 'min(80vw, 900px)' }}>
          <div
            className="absolute left-1/2 top-[77%] -translate-x-1/2 rounded-full"
            style={{
              width: '72%',
              height: '12%',
              background: 'radial-gradient(circle, rgba(0,0,0,0.6), rgba(0,0,0,0.05) 72%)',
              filter: 'blur(26px)',
            }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ y: [0, -5, 0], scale: [1, 1.008, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '90%', height: '90%', cursor: 'grab', pointerEvents: 'auto' }}
            onMouseDown={(event) => {
              mouseDownPosRef.current = { x: event.clientX, y: event.clientY }
            }}
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
              const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
              pointerRef.current.targetPhiOffset = normalizedX * 0.2
              pointerRef.current.targetThetaOffset = normalizedY * 0.15
            }}
            onMouseEnter={() => {
              pointerRef.current.targetHoverMix = 1
            }}
            onMouseLeave={() => {
              pointerRef.current.targetPhiOffset = 0
              pointerRef.current.targetThetaOffset = 0
              pointerRef.current.targetHoverMix = 0
            }}
            onWheel={(event) => {
              event.preventDefault()
              const delta = event.deltaY > 0 ? -0.08 : 0.08
              pointerRef.current.targetScale = Math.max(0.82, Math.min(1.24, pointerRef.current.targetScale + delta))
            }}
            onDoubleClick={() => {
              pointerRef.current.targetPhiOffset = 0
              pointerRef.current.targetThetaOffset = 0
              pointerRef.current.targetHoverMix = 1
              pointerRef.current.targetScale = 1.14
            }}
            onClick={(event) => {
              if (!onCityClick || !canvasRef.current) return
              const down = mouseDownPosRef.current
              if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) return

              const rect = canvasRef.current.getBoundingClientRect()
              const clickX = event.clientX - rect.left
              const clickY = event.clientY - rect.top
              const cx = rect.width / 2
              const cy = rect.height / 2
              const shortSide = Math.min(rect.width, rect.height)
              const { phi, theta, scale } = currentOrientationRef.current

              const HIT_RADIUS = 52
              let bestCity: (typeof CITY_LIST)[0] | null = null
              let bestDist = Infinity

              for (const city of CITY_LIST) {
                const { sx, sy, visible } = projectToScreen(
                  city.center[0], city.center[1],
                  phi, theta, scale,
                  cx, cy, shortSide,
                )
                if (!visible) continue
                const dist = Math.hypot(clickX - sx, clickY - sy)
                if (dist < HIT_RADIUS && dist < bestDist) {
                  bestDist = dist
                  bestCity = city
                }
              }

              if (bestCity) onCityClick(bestCity.slug, bestCity.center)
            }}
          >
            <div
              className="absolute inset-[-5%] rounded-full"
              style={{
                background: `radial-gradient(circle, ${tone.glowCss} 0%, rgba(0,0,0,0) 60%)`,
                filter: 'blur(24px)',
              }}
            />

            <div
              className="absolute inset-[-2%] rounded-full"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: `
                  inset 0 0 28px rgba(255,255,255,0.04),
                  inset -28px -48px 148px rgba(0,0,0,0.62),
                  0 26px 92px rgba(0,0,0,0.42)
                `,
              }}
            />

            <div
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(circle at 28% 24%, rgba(255,255,255,0.12), rgba(255,255,255,0.02) 16%, rgba(0,0,0,0) 34%),
                  radial-gradient(circle at 82% 54%, rgba(0,0,0,0.42), rgba(0,0,0,0) 28%),
                  radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 62%, rgba(255,255,255,0.02) 72%, rgba(0,0,0,0) 76%)
                `,
              }}
            >
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            </div>

            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                left: '54%',
                top: '44%',
                width: '24%',
                height: '24%',
                marginLeft: '-12%',
                marginTop: '-12%',
                background: `radial-gradient(circle, rgba(255,255,255,0.075), rgba(255,255,255,0.015) 24%, rgba(0,0,0,0) 72%)`,
                filter: 'blur(8px)',
              }}
              animate={{ opacity: [0.18, 0.28, 0.18], x: [-4, 7, -4], y: [-3, 4, -3] }}
              transition={{ duration: 8.4, repeat: Infinity, ease: 'easeInOut' }}
            />

          </motion.div>
        </div>
      </div>

      <div className="absolute z-[2] rounded-2xl px-4 py-3 hidden md:block" style={{
        ...infoCardStyle,
        transform: 'translateY(-50%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div className="flex items-center gap-2 mb-2">
          <Globe size={12} style={{ color: tone.text }} />
          <p className="text-[10px] font-mono uppercase tracking-[0.16em]" style={{ color: tone.text }}>
            Globe Intelligence View
          </p>
        </div>
        <p className="text-sm font-mono text-[#e8e8f0] leading-relaxed">
          Live geospatial surface tracking the current PlotDNA market context.
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
