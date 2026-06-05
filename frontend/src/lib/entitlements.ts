import { API_BASE_URL } from '@/lib/runtime'
import type { ReportPackage } from '@/lib/paymentLinks'
const TOKEN_KEY = 'plotdna_access_token'
const USER_ID_KEY = 'plotdna_user_id'
const ENTITLEMENTS_CACHE_KEY = 'plotdna_entitlements'

interface AnonymousAuthResponse {
  user_id: string
  access_token: string
  token_type: string
}

export interface EntitlementsResponse {
  free_remaining: number
  free_limit: number
  subscription_active: boolean
  subscription_expires_at: string | null
  email: string | null
  name: string | null
}

export interface ReportAccessResponse {
  packageInterest: ReportPackage
  canAccess: boolean
  requiresPayment: boolean
  reason: 'admin_allowlist' | 'subscription_active' | 'payment_required'
  email: string | null
}

export type ConsumeResult =
  | { status: 'ok'; entitlements: EntitlementsResponse }
  | { status: 'email_required'; entitlements: EntitlementsResponse | null }
  | { status: 'error'; message: string }

export type AttachEmailResult =
  | { status: 'ok'; entitlements: EntitlementsResponse }
  | { status: 'error'; message: string }

export interface EmailOtpRequestResponse {
  email: string
  status: 'sent'
  expiresAt: string
  resendAfterSeconds: number
  debugOtp?: string | null
}

export interface EmailOtpVerifyResponse {
  email: string
  status: 'verified'
  entitlements: EntitlementsResponse
}

export type EmailOtpRequestResult =
  | { status: 'ok'; otp: EmailOtpRequestResponse }
  | { status: 'error'; message: string }

export type EmailOtpVerifyResult =
  | { status: 'ok'; verification: EmailOtpVerifyResponse }
  | { status: 'error'; message: string }

export interface UserEventPayload {
  eventType: string
  areaSlug?: string | null
  packageInterest?: ReportPackage | string | null
  metadata?: string | null
}

export interface PublicMetricsResponse {
  liveUsers: number
  activeUsersToday: number
}

function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function setStoredToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // ignore storage failures in privacy modes
  }
}

function setStoredUserId(userId: string) {
  try {
    window.localStorage.setItem(USER_ID_KEY, userId)
  } catch {
    // ignore storage failures in privacy modes
  }
}

function rememberEntitlements(entitlements: EntitlementsResponse) {
  try {
    window.localStorage.setItem(ENTITLEMENTS_CACHE_KEY, JSON.stringify(entitlements))
  } catch {
    // ignore storage failures in privacy modes
  }
}

export function getCachedEntitlements(): EntitlementsResponse | null {
  try {
    const raw = window.localStorage.getItem(ENTITLEMENTS_CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as EntitlementsResponse
  } catch {
    return null
  }
}

async function createAnonymousSession(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/anonymous`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    throw new Error('Could not start your PlotDNA session.')
  }
  const payload = await res.json() as AnonymousAuthResponse
  if (!payload.access_token) {
    throw new Error('PlotDNA session token missing.')
  }
  setStoredToken(payload.access_token)
  setStoredUserId(payload.user_id)
  return payload.access_token
}

async function getAccessToken(): Promise<string> {
  const existing = getStoredToken()
  if (existing) return existing
  return createAnonymousSession()
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  let token = await getAccessToken()

  const doFetch = (bearer: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${bearer}`,
      },
    })

  let res = await doFetch(token)
  if (res.status === 401) {
    token = await createAnonymousSession()
    res = await doFetch(token)
  }
  return res
}

export async function getEntitlements(): Promise<EntitlementsResponse | null> {
  try {
    const res = await authedFetch('/api/v1/entitlements')
    if (!res.ok) return null
    const entitlements = await res.json() as EntitlementsResponse
    rememberEntitlements(entitlements)
    return entitlements
  } catch {
    return null
  }
}

export async function checkReportAccess(packageInterest: ReportPackage): Promise<ReportAccessResponse | null> {
  try {
    const params = new URLSearchParams({ packageInterest })
    const res = await authedFetch(`/api/v1/entitlements/report-access?${params.toString()}`)
    if (!res.ok) return null
    return await res.json() as ReportAccessResponse
  } catch {
    return null
  }
}

export async function consumeSearchAccess(): Promise<ConsumeResult> {
  try {
    const res = await authedFetch('/api/v1/entitlements/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (res.ok) {
      const entitlements = await res.json() as EntitlementsResponse
      rememberEntitlements(entitlements)
      return { status: 'ok', entitlements }
    }

    if (res.status === 403) {
      return { status: 'email_required', entitlements: await getEntitlements() }
    }

    return { status: 'error', message: 'Could not verify your search access right now.' }
  } catch {
    return { status: 'error', message: 'Could not reach PlotDNA access service.' }
  }
}

export async function attachEmail(email: string): Promise<AttachEmailResult> {
  try {
    const res = await authedFetch('/api/v1/entitlements/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => null) as { detail?: string } | null
      return { status: 'error', message: payload?.detail ?? 'Could not save your email.' }
    }
    const entitlements = await res.json() as EntitlementsResponse
    rememberEntitlements(entitlements)
    return { status: 'ok', entitlements }
  } catch {
    return { status: 'error', message: 'Could not reach PlotDNA access service.' }
  }
}

export async function requestEmailOtp(name: string, email: string): Promise<EmailOtpRequestResult> {
  try {
    const res = await authedFetch('/api/v1/auth/email-otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => null) as { detail?: string } | null
      return { status: 'error', message: payload?.detail ?? 'Could not send verification code.' }
    }
    return { status: 'ok', otp: await res.json() as EmailOtpRequestResponse }
  } catch {
    return { status: 'error', message: 'Could not reach PlotDNA access service.' }
  }
}

export async function getPublicMetrics(): Promise<PublicMetricsResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/entitlements/public/metrics`)
    if (!res.ok) return null
    return await res.json() as PublicMetricsResponse
  } catch {
    return null
  }
}

export async function verifyEmailOtp(email: string, otp: string): Promise<EmailOtpVerifyResult> {
  try {
    const res = await authedFetch('/api/v1/auth/email-otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => null) as { detail?: string } | null
      return { status: 'error', message: payload?.detail ?? 'Could not verify this code.' }
    }
    const verification = await res.json() as EmailOtpVerifyResponse
    rememberEntitlements(verification.entitlements)
    return { status: 'ok', verification }
  } catch {
    return { status: 'error', message: 'Could not reach PlotDNA access service.' }
  }
}

export async function trackUserEvent(payload: UserEventPayload): Promise<void> {
  try {
    await authedFetch('/api/v1/entitlements/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // User metrics must never block the product flow.
  }
}
