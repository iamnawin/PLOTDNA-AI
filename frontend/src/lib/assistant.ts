import { BASE_URL } from '@/lib/api'

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantContext {
  page: 'map' | 'area' | 'brochure' | 'landing'
  citySlug?: string | null
  cityName?: string | null
  areaSlug?: string | null
  areaName?: string | null
  coords?: [number, number] | null
  resolutionTier?: string | null
  resolutionLabel?: string | null
  summary?: string | null
}

export interface AssistantRequest {
  question: string
  context?: AssistantContext
  history?: AssistantMessage[]
}

export interface AssistantResponse {
  answer: string
  sources: string[]
  followups: string[]
  source: 'gemini' | 'nvidia' | 'fallback'
  model?: string | null
  last_updated: string
}

export async function askPlotDNA(request: AssistantRequest): Promise<AssistantResponse | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(40_000),
    })
    if (!res.ok) return null
    return (await res.json()) as AssistantResponse
  } catch {
    return null
  }
}
