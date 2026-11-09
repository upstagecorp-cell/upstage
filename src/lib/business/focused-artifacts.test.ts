import { describe, expect, it } from 'vitest'
import {
  buildExperimentMarkdown,
  buildSuggestedChange,
  calculateCosts,
  makeCostCsv,
} from './focused-artifacts'
import { createProfileDefaults } from './validation'
import type {
  FocusedCosts,
  FocusedInput,
  FocusedInvestigation,
} from './focused-types'

const costs: FocusedCosts = {
  price: 40,
  productCost: 12,
  packaging: 1,
  fulfillment: 2,
  shippingCost: 6,
  shippingCharged: 5,
  paymentPercent: 2.9,
  paymentFixed: 0.3,
}

describe('order contribution worksheets', () => {
  it('includes shipping revenue, charges fees on it, and recomputes fees for absorbed shipping', () => {
    const summary = calculateCosts(costs, 'USD')
    expect(summary.complete).toBe(true)
    expect(summary.revenueMinor).toBe(4500)
    expect(summary.feeMinor).toBe(161)
    expect(summary.contributionMinor).toBe(2239)
    expect(summary.freeShippingContributionMinor).toBe(1754)
  })
  it('keeps an unknown cost unavailable while accepting a confirmed zero', () => {
    expect(calculateCosts({ ...costs, packaging: null }, 'USD')).toMatchObject({
      complete: false,
      contributionMinor: null,
      missing: ['Packaging cost'],
    })
    expect(
      calculateCosts({ ...costs, packaging: 0 }, 'USD').contributionMinor,
    ).toBe(2339)
  })
  it('preserves a negative contribution rather than presenting it as profit', () => {
    const summary = calculateCosts(
      { ...costs, price: 1, shippingCharged: 0 },
      'USD',
    )
    expect(summary.contributionMinor).toBe(-2033)
    const csv = makeCostCsv({ ...costs, price: 1, shippingCharged: 0 }, 'USD')!
    expect(csv).toContain('"Order contribution","-20.33","USD"')
    expect(csv).toContain('It is not profit.')
  })
  it('uses zero-decimal currencies without inventing fractional currency units', () => {
    const won = {
      ...costs,
      price: 40000,
      productCost: 12000,
      packaging: 1000,
      fulfillment: 2000,
      shippingCost: 6000,
      shippingCharged: 5000,
      paymentFixed: 300,
    }
    expect(calculateCosts(won, 'KRW')).toMatchObject({
      complete: true,
      revenueMinor: 45000,
      feeMinor: 1605,
      contributionMinor: 22395,
      freeShippingContributionMinor: 17540,
    })
    expect(calculateCosts({ ...won, packaging: 1000.5 }, 'KRW').complete).toBe(
      false,
    )
    expect(
      calculateCosts({ ...costs, productCost: 12.001 }, 'USD').complete,
    ).toBe(false)
  })
  it('rounds an exact half cent once and rejects invalid or unsafe calculations', () => {
    expect(
      calculateCosts(
        {
          ...costs,
          price: 1,
          shippingCharged: 0,
          paymentPercent: 0.5,
          paymentFixed: 0,
        },
        'USD',
      ).feeMinor,
    ).toBe(1)
    for (const bad of [NaN, Infinity, -1, 101])
      expect(
        calculateCosts({ ...costs, paymentPercent: bad }, 'USD').complete,
      ).toBe(false)
    expect(calculateCosts({ ...costs, productCost: -2 }, 'USD').complete).toBe(
      false,
    )
    expect(
      calculateCosts({ ...costs, price: Number.MAX_SAFE_INTEGER }, 'USD')
        .complete,
    ).toBe(false)
    expect(calculateCosts(costs, '=1+1').complete).toBe(false)
  })
  it('exports a complete, explicitly scoped CSV and blocks incomplete or unvalidated cells', () => {
    const csv = makeCostCsv(costs, 'USD')!
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('"Total order revenue","45.00","USD"')
    expect(csv).toContain('"Contribution with free shipping","17.54","USD"')
    expect(csv).toContain('customer acquisition costs are not included')
    expect(makeCostCsv({ ...costs, shippingCost: null }, 'USD')).toBeNull()
    expect(makeCostCsv(costs, '=HYPERLINK("evil")')).toBeNull()
  })
})

describe('downloadable experiment record', () => {
  it('keeps baseline, source, unknown measurements, review plan, and contribution scope together', () => {
    const investigation: FocusedInvestigation = {
      id: 'case-1',
      profileId: 'profile-1',
      revision: 2,
      createdAt: '2026-01-08T00:00:00Z',
      updatedAt: '2026-01-08T00:00:00Z',
      stage: 'planned',
      profileSnapshot: {
        ...createProfileDefaults('America/New_York'),
        id: 'profile-1',
        version: 1,
        name: 'Sample Shop',
        updatedAt: '2026-01-08T00:00:00Z',
      },
      product: 'Notebook',
      channel: 'Website',
      periodStart: '2026-01-01',
      periodEnd: '2026-01-07',
      source: 'Store export',
      comparable: true,
      metrics: {
        visits: 100,
        views: null,
        carts: 20,
        checkouts: 10,
        orders: 2,
        days: 7,
      },
      answers: { shippingTiming: 'checkout' },
      costs,
      plan: {
        change: 'Show shipping before checkout',
        reviewDate: '2026-01-15',
        successRule: 'Review checkout completion with the same definitions',
        guardrail: 'Keep price and shipping charge unchanged',
      },
      checkin: null,
    }
    const markdown = buildExperimentMarkdown(investigation)
    expect(markdown).toContain('Sample Shop')
    expect(markdown).toContain('Source: Store export')
    expect(markdown).toContain('views: Not measured')
    expect(markdown).not.toContain('views: 0')
    expect(markdown).toContain('Show shipping before checkout')
    expect(markdown).toContain('2026-01-15')
    expect(markdown).toContain('Keep price and shipping charge unchanged')
    expect(markdown).toMatch(/Order contribution: USD\s22\.39/)
    expect(markdown).toContain('does not establish causation')
  })
})

describe('editable drafts based on saved business facts', () => {
  const profile = {
    ...createProfileDefaults('America/New_York'),
    id: 'shop-1',
    version: 1,
    name: 'Stationery Shop',
    offering: 'Hardcover notebooks',
    customerType: 'Independent designers',
    updatedAt: '2026-01-08T00:00:00Z',
  }
  const input: FocusedInput = {
    product: 'A5 Notebook',
    channel: 'Store website',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-07',
    source: 'Store event report',
    comparable: true,
    metrics: {
      visits: 100,
      views: null,
      carts: 20,
      checkouts: 10,
      orders: 2,
      days: 7,
    },
    answers: { shippingTiming: 'checkout', shippingMargin: 'positive' },
    costs,
    plan: { change: '', reviewDate: '', successRule: '', guardrail: '' },
    checkin: null,
  }

  it('writes the actual shipping charge with placement and verification steps without inventing delivery promises', () => {
    const draft = buildSuggestedChange(input, profile, 'shipping')!
    expect(draft).toMatch(/Shipping: USD\s5\.00 per order/)
    expect(draft).toContain(
      'beside the product price and in the cart on Store website',
    )
    expect(draft).toContain(
      'Keep the shipping charge and product price unchanged',
    )
    expect(draft).toContain('verify that this exact charge applies')
    expect(draft).not.toMatch(/arrives? in \d|guaranteed|free shipping/i)
    expect(
      buildSuggestedChange(
        { ...input, costs: { ...costs, shippingCharged: null } },
        profile,
        'shipping',
      ),
    ).toBeNull()
    expect(
      buildSuggestedChange(
        { ...input, costs: { ...costs, shippingCharged: 5.001 } },
        profile,
        'shipping',
      ),
    ).toBeNull()
  })

  it('creates an executable measurement plan tied to the actual product, channel, period, and unknown event', () => {
    const draft = buildSuggestedChange(input, profile, 'measurement')!
    for (const value of [
      'A5 Notebook',
      'Store website',
      '2026-01-01 through 2026-01-07',
      'Store event report',
    ])
      expect(draft).toContain(value)
    expect(draft).toContain('Events still needing a reported count: views')
    expect(draft).toContain('same identity and product')
    expect(draft).toContain('exclude test activity from customer counts')
    expect(draft).toMatch(/unique people, deduplicated/i)
    expect(draft).not.toContain('views: 0')
    const costDraft = buildSuggestedChange(input, profile, 'cost')!
    expect(costDraft).toMatch(/Order contribution: USD\s22\.39/)
    expect(costDraft).toContain('It is not profit.')
    expect(
      buildSuggestedChange(
        { ...input, costs: { ...costs, productCost: null } },
        profile,
        'cost',
      ),
    ).toBeNull()
  })
})
