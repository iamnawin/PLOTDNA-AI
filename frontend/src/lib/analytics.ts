import { track as trackVercelEvent } from '@vercel/analytics'

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

export type ProductEventName =
  | 'landing_viewed'
  | 'landing_investment_cta_clicked'
  | 'location_selected'
  | 'open_area_started'
  | 'open_area_completed'
  | 'open_area_failed'
  | 'resolver_succeeded'
  | 'resolver_failed'
  | 'area_opened'
  | 'screen_viewed'
  | 'area_pass_generated'
  | 'buyer_report_downloaded'
  | 'feedback_submitted'
  | 'compare_started'
  | 'compare_area_changed'
  | 'comparison_saved'

const BROWSER_ID_KEY = 'plotdna_analytics_id'
const SESSION_ID_KEY = 'plotdna_analytics_session_id'

function randomId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getBrowserId() {
  try {
    const stored = window.localStorage.getItem(BROWSER_ID_KEY)
    if (stored) return stored
    const id = randomId()
    window.localStorage.setItem(BROWSER_ID_KEY, id)
    return id
  } catch {
    return 'storage-disabled'
  }
}

function getSessionId() {
  try {
    const stored = window.sessionStorage.getItem(SESSION_ID_KEY)
    if (stored) return stored
    const id = randomId()
    window.sessionStorage.setItem(SESSION_ID_KEY, id)
    return id
  } catch {
    return 'storage-disabled'
  }
}

const ANALYTICS_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:8000' : 'https://plotdna-api.onrender.com')
).replace(/\/$/, '')

export function trackEvent(name: ProductEventName, payload: AnalyticsPayload = {}) {
  if (typeof window === 'undefined') return

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter((entry): entry is [string, string | number | boolean] => {
      const value = entry[1]
      return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    }),
  )

  const contextualPayload = {
    ...cleanPayload,
    anonymousId: getBrowserId(),
    sessionId: getSessionId(),
  }
  const event = {
    eventId: randomId(),
    name,
    payload: contextualPayload,
    at: new Date().toISOString(),
  }

  if (import.meta.env.DEV) {
    console.info('[analytics]', event)
  }

  window.dispatchEvent(new CustomEvent('plotdna:analytics', { detail: event }))
  trackVercelEvent(name, contextualPayload)

  void fetch(`${ANALYTICS_BASE_URL}/api/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
    keepalive: true,
  }).catch(() => {
    // Analytics must never block core product flows.
  })
}
