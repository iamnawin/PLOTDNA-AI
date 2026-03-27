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

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

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

export type MapLinkResolutionReason = 'ok' | 'backend_unreachable' | 'invalid_link'

export interface MapLinkResolutionResult {
  coords: [number, number] | null
  reason: MapLinkResolutionReason
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
      { signal: AbortSignal.timeout(12_000) },
    )
    if (!res.ok) return { coords: null, reason: 'invalid_link' }
    const data = await res.json()
    if (typeof data.lat === 'number' && typeof data.lng === 'number')
      return { coords: [data.lat, data.lng], reason: 'ok' }
    return { coords: null, reason: 'invalid_link' }
  } catch {
    return { coords: null, reason: 'backend_unreachable' }
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
