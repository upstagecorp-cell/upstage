// Existing text subscription contract. Do not reprice active subscriptions from a marketing preview.
export const PAID_PLANS = {
  focus: { id: 'focus', name: 'Focus', monthlyUsd: 149, packages: 16, assetsPerPackage: 6, description: 'One business. A focused marketing routine.' },
  growth: { id: 'growth', name: 'Growth', monthlyUsd: 299, packages: 48, assetsPerPackage: 12, description: 'More campaigns and message variations for one business.' },
} as const
export type PaidPlanId = keyof typeof PAID_PLANS
export function isPaidPlan(value: unknown): value is PaidPlanId { return value === 'focus' || value === 'growth' }
export interface BillingSummary {
  plan: PaidPlanId | 'free'
  status: string
  packagesUsed: number
  packagesLimit: number
  assetsPerPackage: number
  periodEnd: string | null
  cancelAtPeriodEnd: boolean
  checkoutAvailable: boolean
  portalAvailable: boolean
  emailVerified: boolean
}
