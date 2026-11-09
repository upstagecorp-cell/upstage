import {
  addCalendarDays,
  differenceInCalendarDays,
  getLocalDateKey,
  isDateKey,
} from '@/lib/date-time'
import type { BusinessProfile } from './types'
import type {
  FocusedInput,
  FocusedInvestigation,
  FocusedMetrics,
} from './focused-types'

export const funnelFields = [
  ['visits', 'Store visitors'],
  ['views', 'Product viewers'],
  ['carts', 'Added to cart'],
  ['checkouts', 'Started checkout'],
  ['orders', 'Completed purchases'],
] as const
export function emptyMetrics(days = 7): FocusedMetrics {
  return {
    visits: null,
    views: null,
    carts: null,
    checkouts: null,
    orders: null,
    days,
  }
}
export function newInvestigation(
  profile: BusinessProfile,
  now = new Date(),
): FocusedInput {
  const end = addCalendarDays(getLocalDateKey(now, profile.timeZone), -1)
  return {
    product: profile.offering,
    channel: profile.salesChannels[0] ?? '',
    periodStart: addCalendarDays(end, -6),
    periodEnd: end,
    source: '',
    comparable: false,
    metrics: emptyMetrics(),
    answers: {},
    costs: {
      price: null,
      productCost: null,
      packaging: null,
      fulfillment: null,
      shippingCost: null,
      shippingCharged: null,
      paymentPercent: null,
      paymentFixed: null,
    },
    plan: { change: '', reviewDate: '', successRule: '', guardrail: '' },
    checkin: null,
  }
}
export function periodDays(start: string, end: string): number {
  return isDateKey(start) && isDateKey(end) && end >= start
    ? differenceInCalendarDays(end, start) + 1
    : 0
}
export function nextMove(item: FocusedInvestigation, now = new Date()): string {
  if (item.stage === 'draft')
    return 'Finish your baseline so we can choose the next question.'
  if (item.stage === 'diagnosed')
    return 'Answer the follow-up, then finish one concrete change in the workbench.'
  if (item.stage === 'artifact')
    return 'Choose a review date and a decision rule before using your change.'
  if (item.stage === 'reviewed')
    return 'Review what changed and choose whether to keep, revise, or repeat the experiment.'
  return item.plan.reviewDate <=
    getLocalDateKey(now, item.profileSnapshot.timeZone)
    ? 'Your review is due. Add the next period and compare what changed.'
    : `Use your saved change. Come back on ${item.plan.reviewDate} to review the result.`
}
export interface FunnelReview {
  available: boolean
  reason: string
  before: number | null
  after: number | null
  changePoints: number | null
  notes: string[]
}
export function reviewFunnel(item: FocusedInvestigation): FunnelReview {
  const no = (reason: string): FunnelReview => ({
    available: false,
    reason,
    before: null,
    after: null,
    changePoints: null,
    notes: [],
  })
  const after = item.checkin
  if (!after)
    return no('Add a follow-up period to compare with your saved baseline.')
  if (!item.comparable || !after.comparable)
    return no(
      'Confirm matching channel, population, and funnel definitions for both periods before comparing rates.',
    )
  const beforeDays = periodDays(item.periodStart, item.periodEnd),
    afterDays = periodDays(after.periodStart, after.periodEnd)
  if (
    !beforeDays ||
    beforeDays !== afterDays ||
    after.periodStart <= item.periodEnd
  )
    return no('Use non-overlapping periods with the same number of days.')
  const b = item.metrics,
    a = after.metrics
  if (
    b.checkouts === null ||
    b.orders === null ||
    a.checkouts === null ||
    a.orders === null ||
    b.checkouts <= 0 ||
    a.checkouts <= 0
  )
    return no(
      'Checkout completion needs a measured, positive checkout count and a purchase count for each period.',
    )
  if (b.orders > b.checkouts || a.orders > a.checkouts)
    return no(
      'Purchase counts must belong to their reported checkout population.',
    )
  const before = (b.orders / b.checkouts) * 100,
    afterRate = (a.orders / a.checkouts) * 100
  const notes = [
    'This is a descriptive comparison, not evidence that the change caused the result. Review price, advertising, traffic mix, and seasonality.',
  ]
  if (Math.min(b.orders, a.orders) < 20)
    notes.push(
      'Purchase counts are small. Collect more observations before treating a direction as a reliable trend.',
    )
  if (after.changed.trim())
    notes.push(`Other changes reported: ${after.changed}`)
  return {
    available: true,
    reason: 'Checkout-to-purchase completion, using your reported counts.',
    before,
    after: afterRate,
    changePoints: afterRate - before,
    notes,
  }
}
