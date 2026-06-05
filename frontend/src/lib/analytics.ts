import { track as trackVercelEvent } from '@vercel/analytics'

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

const ANALYTICS_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:8000' : 'https://plotdna-api.onrender.com')
).replace(/\/$/, '')

export function trackEvent(name: string, payload: AnalyticsPayload = {}) {
  if (typeof window === 'undefined') return

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter((entry): entry is [string, string | number | boolean] => {
      const value = entry[1]
      return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    }),
  )

  const event = {
    name,
    payload: cleanPayload,
    at: new Date().toISOString(),
  }

  if (import.meta.env.DEV) {
    console.info('[analytics]', event)
  }

  window.dispatchEvent(new CustomEvent('plotdna:analytics', { detail: event }))
  trackVercelEvent(name, cleanPayload)

  void fetch(`${ANALYTICS_BASE_URL}/api/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
    keepalive: true,
  }).catch(() => {
    // Analytics must never block core product flows.
  })
}
