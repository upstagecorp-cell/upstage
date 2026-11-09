import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FocusedDemo } from './FocusedDemo'
import { FocusedEditor } from './FocusedPanel'
import { createProfileDefaults } from '@/lib/business/validation'
import { newInvestigation } from '@/lib/business/focused-journey'
import type { BusinessProfile } from '@/lib/business/types'
import type { FocusedInvestigation } from '@/lib/business/focused-types'

const profile: BusinessProfile = {
  ...createProfileDefaults('America/New_York'),
  id: 'render-profile',
  version: 1,
  updatedAt: '2026-11-01T12:00:00Z',
  name: 'Render shop',
  businessType: 'ecommerce',
  offering: 'Ceramic mugs',
  customerType: 'Home goods shoppers',
}
const mutate = vi.fn(async () => null)
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('focused flow server rendering', () => {
  it('labels the public sample as invented and renders its actual next question without API calls', () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const html = renderToStaticMarkup(createElement(FocusedDemo))
    expect(html).toContain('Fictional online-shop example')
    expect(html).toContain('All numbers are invented.')
    expect(html).toContain('reloading resets them')
    expect(html).toContain(
      'When does a customer first see the shipping charge?',
    )
    expect(html).toContain('name="shippingTiming"')
    expect(html).toContain('2,400')
    expect(html).toContain('href="/register"')
    expect(fetch).not.toHaveBeenCalled()
  })
  it('renders the fresh baseline as unknown rather than inserting sample counts', () => {
    const html = renderToStaticMarkup(
      createElement(FocusedEditor, {
        profile,
        saved: null,
        mutate,
        busy: false,
        onSaved: () => {},
      }),
    )
    expect(html).toContain('What happens between a visit and a purchase?')
    expect(html).toContain('placeholder="Unknown"')
    expect(html).not.toContain('2,400')
    expect(html).not.toContain('name="shippingTiming"')
  })
  it('shows a preserved completed review without an editable follow-up form', () => {
    const input = newInvestigation(profile, new Date('2026-11-01T12:00:00Z'))
    const saved: FocusedInvestigation = {
      ...input,
      id: 'render-investigation',
      profileId: profile.id,
      profileSnapshot: profile,
      revision: 5,
      createdAt: '2026-11-01T12:00:00Z',
      updatedAt: '2026-11-09T12:00:00Z',
      stage: 'reviewed',
      periodStart: '2026-10-26',
      periodEnd: '2026-11-01',
      comparable: true,
      metrics: {
        visits: 1000,
        views: 800,
        carts: 200,
        checkouts: 100,
        orders: 20,
        days: 7,
      },
      plan: {
        change: 'Show the actual shipping charge earlier.',
        reviewDate: '2026-11-09',
        successRule: 'Observe the next period.',
        guardrail: 'Keep price fixed.',
      },
      checkin: {
        periodStart: '2026-11-02',
        periodEnd: '2026-11-08',
        comparable: true,
        metrics: {
          visits: 1000,
          views: 800,
          carts: 200,
          checkouts: 100,
          orders: 25,
          days: 7,
        },
        source: 'Fictional report',
        changed: 'No known price change',
        notes: 'Collect more observations.',
      },
    }
    const html = renderToStaticMarkup(
      createElement(FocusedEditor, {
        profile,
        saved,
        mutate,
        busy: false,
        onSaved: () => {},
      }),
    )
    expect(html).toContain('20.0')
    expect(html).toContain('25.0')
    expect(html).toContain('percentage points')
    expect(html).toContain('not evidence that the change caused the result')
    expect(html).toContain('Collect more observations.')
    expect(html).not.toContain('Save review and next decision')
    expect(mutate).not.toHaveBeenCalled()
  })
})
