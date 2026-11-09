import type { BusinessProfile } from './types'

export interface FocusedMetrics {
  visits: number | null
  views: number | null
  carts: number | null
  checkouts: number | null
  orders: number | null
  days: number
}
/** All money amounts use the major unit of the investigation profile's currency. */
export interface FocusedCosts {
  price: number | null
  productCost: number | null
  packaging: number | null
  fulfillment: number | null
  shippingCost: number | null
  shippingCharged: number | null
  paymentPercent: number | null
  paymentFixed: number | null
}
export interface FocusedCheckin {
  periodStart: string
  periodEnd: string
  source: string
  comparable: boolean
  metrics: FocusedMetrics
  changed: string
  notes: string
}
export interface FocusedInput {
  product: string
  channel: string
  periodStart: string
  periodEnd: string
  source: string
  comparable: boolean
  metrics: FocusedMetrics
  answers: Record<string, string>
  costs: FocusedCosts
  plan: {
    change: string
    reviewDate: string
    successRule: string
    guardrail: string
  }
  checkin: FocusedCheckin | null
}
export type FocusedIntent =
  | 'draft'
  | 'diagnose'
  | 'artifact'
  | 'plan'
  | 'checkin'
export interface FocusedInvestigation extends FocusedInput {
  id: string
  profileId: string
  profileSnapshot: BusinessProfile
  revision: number
  createdAt: string
  updatedAt: string
  stage: 'draft' | 'diagnosed' | 'artifact' | 'planned' | 'reviewed'
}
export type ProductEventType =
  | 'flow_opened'
  | 'return_visit'
  | 'question_answered'
  | 'diagnosis_completed'
  | 'artifact_completed'
  | 'experiment_started'
  | 'checkin_completed'
export interface ProductEvent {
  id: string
  type: ProductEventType
  investigationId: string | null
  recordedAt: string
  source: 'client' | 'server'
  questionKey?: string
}
export interface FocusedFeedback {
  id: string
  investigationId: string
  rating: 'useful' | 'unclear' | 'not_useful'
  note: string
  recordedAt: string
}
