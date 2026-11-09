import { describe, it, expect } from 'vitest'
import {
  reviewFunnel,
  newInvestigation,
  nextMove,
  emptyMetrics,
} from './focused-journey'
import { createProfileDefaults } from './validation'
import type { FocusedInvestigation } from './focused-types'
const profile = {
  ...createProfileDefaults('America/New_York'),
  id: 'p',
  version: 1,
  updatedAt: '2026-01-01',
  businessType: 'ecommerce' as const,
}
function example(): FocusedInvestigation {
  return {
    ...newInvestigation(profile, new Date('2026-11-09T12:00:00Z')),
    id: 'i',
    profileId: 'p',
    profileSnapshot: profile,
    revision: 1,
    createdAt: '2026-11-09T12:00:00Z',
    updatedAt: '2026-11-09T12:00:00Z',
    stage: 'planned',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-07',
    comparable: true,
    metrics: { ...emptyMetrics(), checkouts: 100, orders: 20 },
    plan: {
      change: 'Show delivery cost earlier',
      reviewDate: '2026-10-15',
      successRule: 'Compare completion',
      guardrail: 'Keep pricing fixed',
    },
    checkin: {
      periodStart: '2026-10-08',
      periodEnd: '2026-10-14',
      source: 'Store report',
      comparable: true,
      metrics: { ...emptyMetrics(), checkouts: 80, orders: 20 },
      changed: 'No price changes',
      notes: '',
    },
  }
}
describe('follow-up with an immutable baseline', () => {
  it('compares rates rather than inventing growth from unchanged purchase counts', () => {
    const r = reviewFunnel(example())
    expect(r.before).toBe(20)
    expect(r.after).toBe(25)
    expect(r.changePoints).toBe(5)
    expect(r.notes.join(' ')).toContain('not evidence')
  })
  it('refuses mismatched periods, populations, unknowns and zero denominators', () => {
    for (const change of [
      { periodStart: '2026-10-07' },
      { periodEnd: '2026-10-15' },
      { comparable: false },
      { metrics: { ...emptyMetrics(), checkouts: 0, orders: 0 } },
      { metrics: { ...emptyMetrics(), checkouts: null, orders: 0 } },
    ]) {
      const item = example()
      Object.assign(item.checkin!, change)
      expect(reviewFunnel(item).available).toBe(false)
    }
  })
  it('keeps unknown data empty and identifies the saved review date in the business timezone', () => {
    expect(newInvestigation(profile).metrics.orders).toBeNull()
    expect(nextMove(example(), new Date('2026-10-14T12:00:00Z'))).toContain(
      '2026-10-15',
    )
    expect(nextMove(example(), new Date('2026-10-16T12:00:00Z'))).toContain(
      'due',
    )
  })
})
