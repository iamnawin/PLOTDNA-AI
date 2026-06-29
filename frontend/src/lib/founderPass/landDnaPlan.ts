import type { EntitlementsResponse } from '@/lib/entitlements'

export type FounderPassPaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded'
export type LandDnaPlan = 'free' | 'founder'

export const landDnaPlanConfig = {
  free: {
    card_limit: 1,
    requires_email: true,
    can_save_cards: false,
    can_compare_areas: false,
    can_use_watchlist: false,
  },
  founder: {
    card_limit: 100,
    requires_email: true,
    can_save_cards: true,
    can_compare_areas: true,
    can_use_watchlist: true,
  },
} as const

export interface LandDnaAccessState {
  plan: LandDnaPlan
  paymentStatus: FounderPassPaymentStatus
  cardLimit: number
  upgradeRequired: boolean
  cta: string
}

export function getLandDnaAccessState(entitlements: EntitlementsResponse | null): LandDnaAccessState {
  const founderActive = entitlements?.subscription_active === true
  const plan: LandDnaPlan = founderActive ? 'founder' : 'free'
  const config = landDnaPlanConfig[plan]

  return {
    plan,
    paymentStatus: founderActive ? 'paid' : 'unpaid',
    cardLimit: config.card_limit,
    upgradeRequired: !founderActive,
    cta: founderActive
      ? 'Founder Pass active'
      : 'Check one area free. Unlock the city for Rs 99.',
  }
}
