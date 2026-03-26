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

// ── Coordinate analysis ───────────────────────────────────────────────────────

/**
 * Fetch a live DNA score for any coordinate via the backend pipeline.
 * Uses Overpass API (OpenStreetMap) — no API key required.
 *
 * Returns null if:
 *   - Backend is unreachable (local dev without backend running)
 *   - Request times out (>12s)
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
      signal:  AbortSignal.timeout(12_000),
    })
    if (!res.ok) return null
    return (await res.json()) as LiveDNAResult
  } catch {
    return null
  }
}
