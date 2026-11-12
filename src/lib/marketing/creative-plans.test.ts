import { describe, expect, it } from 'vitest'
import { PAID_PLANS } from '@/lib/billing/plans'
import { creativeOfferIsPreview, quoteCreativeOffer } from './creative-plans'

describe('customer creative offer estimates', () => {
  it('does not force a subscription or motion purchase on the first campaign', () => {
    expect(quoteCreativeOffer('first-campaign', 0)).toMatchObject({ recurring: false, baseUsd: 19, motionUsd: 0, totalUsd: 19, purchasedScenes: 0, items: [] })
  })

  it('separates the monthly renewal from optional one-time motion', () => {
    expect(quoteCreativeOffer('focus', 1)).toMatchObject({ recurring: true, baseUsd: 79, motionUsd: 15, totalUsd: 94, purchasedSeconds: 8 })
    expect(quoteCreativeOffer('growth', 0)).toMatchObject({ recurring: true, baseUsd: 149, totalUsd: 149 })
  })

  it('chooses a cheaper five-scene pack even when only four new scenes are requested', () => {
    expect(quoteCreativeOffer('focus', 4)).toMatchObject({ requestedScenes: 4, purchasedScenes: 5, purchasedSeconds: 40, motionUsd: 59, totalUsd: 138, items: [{ packId: 'motion-five', quantity: 1 }] })
  })

  it('finds the cheapest covering combination for every supported scene count', () => {
    for (let requested = 0; requested <= 50; requested++) {
      const quote = quoteCreativeOffer('focus', requested)
      expect(quote.purchasedScenes).toBeGreaterThanOrEqual(requested)
      for (let singles = 0; singles <= 55; singles++) {
        for (let packs = 0; packs <= 11; packs++) {
          if (singles + packs * 5 >= requested) expect(quote.motionUsd).toBeLessThanOrEqual(singles * 15 + packs * 59)
        }
      }
    }
  })

  it('rejects malformed amounts and unknown offers before constructing an estimate', () => {
    for (const scenes of [-1, 0.5, NaN, Infinity, 51, Number.MAX_SAFE_INTEGER]) {
      expect(() => quoteCreativeOffer('focus', scenes)).toThrow(RangeError)
    }
    expect(() => quoteCreativeOffer('unlisted' as 'focus', 0)).toThrow(RangeError)
  })

  it('keeps previews from opening checkout or repricing existing text rights', () => {
    expect(creativeOfferIsPreview()).toBe(true)
    expect(quoteCreativeOffer('focus', 0).baseUsd).toBe(79)
    expect(PAID_PLANS.focus).toMatchObject({ monthlyUsd: 149, packages: 16, assetsPerPackage: 6 })
    expect(PAID_PLANS.growth).toMatchObject({ monthlyUsd: 299, packages: 48, assetsPerPackage: 12 })
  })
})
