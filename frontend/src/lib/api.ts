/**
 * PlotDNA backend API client.
 *
 * VITE_API_URL env var controls the backend base URL:
 *   - Local dev:   http://localhost:8000  (default)
 *   - Production:  https://your-render-url.onrender.com
 *
 * All calls are fire-and-forget safe — every function returns null on failure
 * so the frontend degrades gracefully to static data.
 */

import type { LocalityResolution } from '@/lib/location/contracts'
import { getAccessToken, type EntitlementsResponse } from '@/lib/entitlements'
import type { CityMeta, MicroMarket } from '@/types'

export const BASE_URL = (
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:8000' : 'https://plotdna-api.onrender.com')
).replace(/\/$/, '')

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LiveSignals {
  infrastructure: number
  population:     number
  satellite:      number
  rera:           number
  employment:     number
  priceVelocity:  number
  govtScheme:     number
}

export interface LiveDNAResult {
  score:        number
  signals:      LiveSignals
  highlights:   string[]
  confidence:   'High' | 'Medium' | 'Low'
  freshness:    'live' | 'cached'
  osm_counts:   Record<string, number>
  data_sources: string[]
  coverage_note: string
  scored_at:    string
}

export type MapLinkResolutionReason = 'ok' | 'backend_unreachable' | 'invalid_link' | 'timeout'

export interface MapLinkResolutionResult {
  coords: [number, number] | null
  reason: MapLinkResolutionReason
  detail?: string
}

export interface BackendAreaList {
  city: CityMeta & { state?: string }
  areas: MicroMarket[]
}

export interface CustomReportLeadPayload {
  name: string
  email: string
  phone: string
  citySlug: string
  cityName: string
  areaSlug: string
  areaName: string
  budgetRange?: string
  timeline?: string
  packageInterest?: string
  notes?: string
  source?: string
}

export interface CustomReportLeadResponse {
  status: 'success'
  leadId: string
  leadType: 'email' | 'phone'
  paymentStatus: 'pending'
  message: string
}

export interface SelfConfirmPaymentResponse {
  leadId: string
  paymentStatus: 'paid'
  paidAt: string
  entitlements: EntitlementsResponse
}

function formatApiErrorMessage(errorBody: unknown, fallback = 'Could not submit request. Please try again.') {
  if (!errorBody || typeof errorBody !== 'object') return fallback

  const detail = (errorBody as { detail?: unknown }).detail
  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    const messages = detail
      .map((issue) => {
        if (!issue || typeof issue !== 'object') return null
        const item = issue as { loc?: unknown; msg?: unknown }
        const message = typeof item.msg === 'string' ? item.msg : null
        if (!message) return null
        const loc = Array.isArray(item.loc) ? item.loc : []
        const field = loc.length ? String(loc[loc.length - 1]) : ''
        return field ? `${field}: ${message}` : message
      })
      .filter((message): message is string => Boolean(message))

    return messages.length ? messages.join(' ') : fallback
  }

  if (detail && typeof detail === 'object') {
    const message = (detail as { message?: unknown; msg?: unknown }).message ?? (detail as { msg?: unknown }).msg
    if (typeof message === 'string') return message
  }

  return fallback
}

function isAbortTimeoutError(error: unknown) {
  return error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')
}

// ── Map link resolution ───────────────────────────────────────────────────────

/**
 * Resolve a short map URL (maps.app.goo.gl, etc.) via the backend proxy.
 * Returns [lat, lng] or null if resolution fails.
 */
export async function resolveMapLink(url: string): Promise<MapLinkResolutionResult> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/utils/resolve-map-link?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(30_000) },
    )
    if (!res.ok) {
      let detail: string | undefined
      try {
        const data = await res.json() as { detail?: string }
        detail = typeof data.detail === 'string' ? data.detail : undefined
      } catch {
        detail = undefined
      }
      return {
        coords: null,
        reason: res.status === 504 ? 'timeout' : 'invalid_link',
        detail,
      }
    }
    const data = await res.json()
    if (typeof data.lat === 'number' && typeof data.lng === 'number')
      return { coords: [data.lat, data.lng], reason: 'ok' }
    return {
      coords: null,
      reason: 'invalid_link',
      detail: 'Coordinates were missing in the resolver response.',
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        coords: null,
        reason: 'timeout',
        detail: 'Timed out waiting for the backend to expand this short map link. Try again in a few seconds or paste the full map URL.',
      }
    }
    return {
      coords: null,
      reason: 'backend_unreachable',
      detail: 'Could not reach the backend resolver. Check VITE_API_URL or backend availability.',
    }
  }
}

// ── Brochure analysis ─────────────────────────────────────────────────────────

export interface BrochureResult {
  lat:        number
  lng:        number
  address:    string
  locality:   string
  city:       string
  confidence: string
}

/**
 * Upload a real estate brochure (PDF or image) and extract the location.
 * Backend uses Gemini Vision + Nominatim geocoding.
 * Returns coordinates + address context, or null on failure.
 */
export async function analyzeBrochure(file: File): Promise<BrochureResult | null> {
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/api/utils/analyze-brochure`, {
      method: 'POST',
      body:   form,
      signal: AbortSignal.timeout(45_000),
    })
    if (!res.ok) return null
    return (await res.json()) as BrochureResult
  } catch {
    return null
  }
}

// ── Coordinate analysis ───────────────────────────────────────────────────────

/**
 * Fetch a live DNA score for any coordinate via the backend pipeline.
 * Uses Overpass API (OpenStreetMap) — no API key required.
 *
 * Returns null if:
 *   - Backend is unreachable (local dev without backend running)
 *   - Request times out (>45s — allows for Render cold-start)
 *   - Any server error
 *
 * Callers should fall back to static nearest-area data when null.
 */
export async function analyzeCoordinate(
  lat: number,
  lng: number,
): Promise<LiveDNAResult | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/score/analyze`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ lat, lng }),
      signal:  AbortSignal.timeout(45_000), // Render free tier cold-start can take 30-50s
    })
    if (!res.ok) return null
    return (await res.json()) as LiveDNAResult
  } catch {
    return null
  }
}

// ── Location resolution ──

/**
 * Resolve coordinates to the most specific geographical coverage tier.
 */
export async function resolveLocation(
  lat: number,
  lng: number,
  locality?: string,
  city?: string,
): Promise<LocalityResolution | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/utils/resolve`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ lat, lng, locality, city }),
      signal:  AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    return (await res.json()) as LocalityResolution
  } catch {
    return null
  }
}

// ── Backend-owned area catalog ──

export async function fetchBackendAreas(citySlug = 'hyderabad'): Promise<BackendAreaList | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/areas/?city=${encodeURIComponent(citySlug)}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    return (await res.json()) as BackendAreaList
  } catch {
    return null
  }
}

export async function fetchBackendArea(citySlug: string, areaSlug: string): Promise<MicroMarket | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/areas/${encodeURIComponent(citySlug)}/${encodeURIComponent(areaSlug)}`,
      { signal: AbortSignal.timeout(10_000) },
    )
    if (!res.ok) return null
    return (await res.json()) as MicroMarket
  } catch {
    return null
  }
}

export async function submitCustomReportLead(
  payload: CustomReportLeadPayload,
): Promise<CustomReportLeadResponse> {
  let res: Response
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    try {
      headers.Authorization = `Bearer ${await getAccessToken()}`
    } catch {
      // Lead capture should still work if anonymous session creation is unavailable.
    }

    res = await fetch(`${BASE_URL}/api/leads/custom-report`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })
  } catch (error) {
    if (isAbortTimeoutError(error)) {
      throw new Error('Lead capture timed out. You can still prepare the preview brief, and we will retry capture when the backend is responsive.')
    }
    throw new Error('Could not reach lead capture. Please try again.')
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({})) as unknown
    throw new Error(formatApiErrorMessage(errorBody))
  }

  return (await res.json()) as CustomReportLeadResponse
}

export async function recoverCustomReportPayment(
  payload: {
    name: string
    email: string
    phone: string
    packageInterest: string
    paymentReference: string
  },
): Promise<SelfConfirmPaymentResponse> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}/api/leads/custom-report/recover-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAccessToken()}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })
  } catch (error) {
    if (isAbortTimeoutError(error)) {
      throw new Error('Payment recovery timed out. Please try again.')
    }
    throw new Error('Could not recover paid access. Please try again.')
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({})) as unknown
    throw new Error(formatApiErrorMessage(errorBody, 'Could not find a paid access record for these details.'))
  }

  return (await res.json()) as SelfConfirmPaymentResponse
}
