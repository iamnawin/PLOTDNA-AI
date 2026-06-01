type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

export function trackEvent(name: string, payload: AnalyticsPayload = {}) {
  if (typeof window === 'undefined') return

  const event = {
    name,
    payload,
    at: new Date().toISOString(),
  }

  if (import.meta.env.DEV) {
    console.info('[analytics]', event)
  }

  window.dispatchEvent(new CustomEvent('plotdna:analytics', { detail: event }))
}
