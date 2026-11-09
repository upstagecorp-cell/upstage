import { describe, expect, it } from 'vitest'
import {
  diagnose,
  diagnoseInput,
  FOCUSED_ANSWER_OPTIONS,
  validateMetrics,
  type Profile,
  type Metrics,
} from './focused-diagnosis'
import { createProfileDefaults } from './validation'
import type { BusinessProfile } from './types'
import type { FocusedInput } from './focused-types'
const profile: Profile = {
  name: 'Linen studio',
  product: 'linen apron',
  customer: 'home cooks',
  price: 42,
  shipping: 7,
  currency: 'USD',
}
const metrics: Metrics = {
  visits: 2400,
  views: 1800,
  carts: 160,
  checkouts: 120,
  orders: 36,
  days: 7,
}
describe('focused ecommerce diagnosis', () => {
  it('keeps missing counts unknown and does not create a zero conversion rate', () => {
    const d = diagnose(profile, {
      visits: null,
      views: null,
      carts: null,
      checkouts: null,
      orders: null,
      days: 7,
    })
    expect(d.artifact).toBe('measurement')
    expect(d.facts).toEqual([])
    expect(d.missing).toHaveLength(6)
    expect(d.key).toBe('measure-funnel')
  })
  it('does not repeat the source question after it is answered', () => {
    const d = diagnose(
      profile,
      {
        visits: null,
        views: null,
        carts: null,
        checkouts: null,
        orders: null,
        days: 7,
      },
      { measurementSource: 'store' },
    )
    expect(d.question).toBeNull()
    expect(d.action).toContain('dashboard')
  })
  it('narrows the same funnel into shipping, costs, or a payment issue from actual answers', () => {
    expect(diagnose(profile, metrics).question?.key).toBe('shippingTiming')
    const shipping = diagnose(profile, metrics, { shippingTiming: 'checkout' })
    expect(shipping.artifact).toBe('shipping')
    expect(shipping.facts.some((x) => x.includes('84'))).toBe(true)
    expect(shipping.summary).toContain('not proof')
    expect(shipping.facts.join(' ')).toContain(
      'selected 7-day reporting period',
    )
    expect(shipping.facts.join(' ')).not.toContain('sessions')
    expect(
      diagnose(profile, metrics, {
        shippingTiming: 'checkout',
        shippingMargin: 'unknown',
      }).artifact,
    ).toBe('cost')
    expect(
      diagnose(profile, metrics, {
        shippingTiming: 'checkout',
        shippingMargin: 'negative',
      }).artifact,
    ).toBe('cost')
    expect(
      diagnose(profile, metrics, { shippingTiming: 'early' }).question?.key,
    ).toBe('paymentIssue')
    expect(
      diagnose(profile, metrics, {
        shippingTiming: 'early',
        paymentIssue: 'yes',
      }).key,
    ).toBe('payment-error')
    expect(diagnose(profile, metrics, { shippingTiming: 'unknown' }).key).toBe(
      'inspect-shipping',
    )
    expect(
      diagnose(profile, metrics, {
        shippingTiming: 'early',
        paymentIssue: 'no',
      }).key,
    ).toBe('checkout-evidence')
  })
  it('does not ask about a charge when customer shipping is free', () => {
    expect(diagnose({ ...profile, shipping: 0 }, metrics).question?.key).toBe(
      'paymentIssue',
    )
  })
  it('asks about unmeasured shipping without asserting that shipping is free', () => {
    const unknown = { ...profile, price: null, shipping: null }
    const d = diagnose(unknown, metrics)
    expect(d.key).toBe('checkout-observation')
    expect(d.question?.key).toBe('shippingTiming')
    expect(d.question?.options.some((option) => option.value === 'free')).toBe(
      true,
    )
    expect(d.summary).not.toContain('zero')
    const charged = diagnose(unknown, metrics, { shippingTiming: 'checkout' })
    expect(charged.artifact).toBe('shipping')
    expect(
      charged.facts.some((fact) =>
        fact.includes('amount has not been measured'),
      ),
    ).toBe(true)
    expect(charged.facts.some((fact) => fact.includes('USD 0'))).toBe(false)
    expect(
      diagnose(unknown, metrics, { shippingTiming: 'free' }).question?.key,
    ).toBe('paymentIssue')
    expect(diagnose(profile, metrics, { shippingTiming: 'free' }).key).toBe(
      'shipping-charge-conflict',
    )
  })
  it('preserves null money inputs through the shared UI and server adapter', () => {
    const business: BusinessProfile = {
      ...createProfileDefaults('America/New_York'),
      id: 'shop',
      version: 1,
      name: 'Linen studio',
      industry: 'Home goods',
      offering: 'linen apron',
      customerType: 'home cooks',
      updatedAt: '2026-11-01T00:00:00Z',
    }
    const input: FocusedInput = {
      product: 'linen apron',
      channel: 'Shopify',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-07',
      source: 'Store dashboard',
      comparable: true,
      metrics,
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
    expect(diagnoseInput(input, business).question?.key).toBe('shippingTiming')
    expect(diagnoseInput({ ...input, comparable: false }, business).key).toBe(
      'different-cohort',
    )
    expect(
      diagnoseInput(
        { ...input, costs: { ...input.costs, shippingCharged: 0 } },
        business,
      ).question?.key,
    ).toBe('paymentIssue')
  })
  it('provides only whitelisted response options for server validation', () => {
    const zero = {
      ...metrics,
      visits: 0,
      views: 0,
      carts: 0,
      checkouts: 0,
      orders: 0,
    }
    const product = { ...metrics, carts: 0, checkouts: 0, orders: 0 }
    const missing = {
      ...metrics,
      visits: null,
      views: null,
      carts: null,
      checkouts: null,
      orders: null,
    }
    const full = { ...metrics, carts: 1800, checkouts: 1800, orders: 1800 }
    const results = [
      diagnose(profile, metrics),
      diagnose(profile, metrics, { shippingTiming: 'checkout' }),
      diagnose(profile, metrics, { shippingTiming: 'early' }),
      diagnose(profile, zero),
      diagnose(profile, product),
      diagnose(profile, missing),
      diagnose(profile, full),
    ]
    for (const result of results) {
      expect(result.question).not.toBeNull()
      for (const option of result.question!.options)
        expect(FOCUSED_ANSWER_OPTIONS[result.question!.key]).toContain(
          option.value,
        )
    }
  })
  it('checks tracking before recommending acquisition for zero visits', () => {
    const zero = {
      ...metrics,
      visits: 0,
      views: 0,
      carts: 0,
      checkouts: 0,
      orders: 0,
    }
    expect(diagnose(profile, zero).key).toBe('check-tracking')
    expect(diagnose(profile, zero, { trackingChecked: 'no' }).key).toBe(
      'tracking-issue',
    )
    expect(
      diagnose(profile, zero, { trackingChecked: 'unknown' }).question,
    ).toBeNull()
    expect(diagnose(profile, zero, { trackingChecked: 'yes' }).artifact).toBe(
      'traffic',
    )
  })
  it('asks about product selection when people view a product but nobody adds it to cart', () => {
    const m = { ...metrics, carts: 0, checkouts: 0, orders: 0 }
    expect(diagnose(profile, m).question?.key).toBe('productClarity')
    expect(diagnose(profile, m, { productClarity: 'confused' }).artifact).toBe(
      'product',
    )
    expect(diagnose(profile, m, { productClarity: 'unknown' }).artifact).toBe(
      'measurement',
    )
    expect(diagnose(profile, m, { productClarity: 'stock' }).key).toBe(
      'product-availability',
    )
  })
  it('accepts a user-selected acquisition goal without claiming traffic is insufficient', () => {
    const d = diagnose(profile, metrics, { focus: 'traffic' })
    expect(d.artifact).toBe('traffic')
    expect(d.summary).toContain('do not establish')
  })
  it('rejects negative, fractional, unsafe or nonfinite counts and invalid durations', () => {
    for (const m of [
      { ...metrics, orders: -1 },
      { ...metrics, orders: 1.2 },
      { ...metrics, orders: NaN },
      { ...metrics, visits: Number.MAX_SAFE_INTEGER + 1 },
      { ...metrics, days: 0 },
      { ...metrics, days: Infinity },
      { ...metrics, checkouts: 10, orders: 36 },
      { ...metrics, views: null, carts: 2500 },
    ]) {
      expect(validateMetrics(m).length).toBeGreaterThan(0)
      expect(diagnose(profile, m).key).toBe('invalid-metrics')
    }
    expect(validateMetrics({ ...metrics, views: null })).toEqual([])
  })
  it('does not compare rates or losses for noncomparable periods or event definitions', () => {
    for (const d of [
      diagnose(profile, metrics, {}, false),
      diagnose(profile, metrics, { cohort: 'different' }),
      diagnose(profile, { ...metrics, orders: 130 }, {}, false),
    ]) {
      expect(d.key).toBe('different-cohort')
      expect(d.facts).toEqual([])
      expect(d.artifact).toBe('measurement')
      expect(d.hypotheses).toEqual([])
    }
  })
  it('does not invent an external benchmark or a missing checkout count', () => {
    const d = diagnose(profile, {
      ...metrics,
      visits: 1,
      views: 1,
      carts: 1,
      checkouts: 1,
      orders: 1,
    })
    expect(d.key).toBe('choose-focus')
    const partial = diagnose(profile, {
      ...metrics,
      checkouts: null,
      orders: 0,
    })
    expect(partial.facts.some((x) => x.includes('0 checkout starts'))).toBe(
      false,
    )
  })
})
