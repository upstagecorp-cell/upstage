import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionUser } from '@/lib/business/types'
import type {
  FocusedInput,
  FocusedInvestigation,
} from '@/lib/business/focused-types'
import { createProfileDefaults } from '@/lib/business/validation'
import { POST as register } from '@/app/api/auth/register/route'
import { POST as createInvestigation } from '@/app/api/investigations/route'
import { PUT as updateInvestigation } from '@/app/api/investigations/[id]/route'
import {
  GET as getEvents,
  POST as postEvent,
} from '@/app/api/product-events/route'
import { POST as feedback } from '@/app/api/feedback/route'
import { closeDatabases, workspace } from './database'
import { updateProfile } from './operations'
import {
  focusedFeedback,
  productEvents,
  recordFeedback,
  recordProductEvent,
  saveInvestigation,
} from './investigations'

const origin = 'http://localhost:3000'
function request(
  path: string,
  body?: unknown,
  cookie = '',
  method = 'POST',
  from = origin,
) {
  return new Request(`${origin}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: from,
      Cookie: cookie,
    },
    ...(method !== 'GET' ? { body: JSON.stringify(body ?? {}) } : {}),
  })
}
async function account(email = 'first@example.com') {
  const response = await register(
    request('/api/auth/register', {
      email,
      password: 'safe-test-password-123',
    }),
  )
  expect(response.status).toBe(200)
  const user = (await response.json()).user as SessionUser
  updateProfile(user.id, {
    ...createProfileDefaults('America/New_York'),
    name: 'Test store',
    businessType: 'ecommerce',
    offering: 'Cotton tote bags',
    customerType: 'Commuters',
    salesChannels: ['Storefront'],
  })
  return { user, cookie: response.headers.get('set-cookie')!.split(';')[0] }
}
function input(): FocusedInput {
  return {
    product: 'Cotton tote bag',
    channel: 'Storefront',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-07',
    source: 'Storefront sessions and paid-order export',
    comparable: true,
    metrics: {
      visits: 100,
      views: 80,
      carts: 20,
      checkouts: 10,
      orders: 0,
      days: 7,
    },
    answers: { shippingTiming: 'checkout', shippingMargin: 'positive' },
    costs: {
      price: 40,
      productCost: 12,
      packaging: 1,
      fulfillment: 2,
      shippingCost: 6,
      shippingCharged: 5,
      paymentPercent: 3,
      paymentFixed: 0.3,
    },
    plan: {
      change: 'Show shipping cost beside the Add to cart button.',
      reviewDate: '2099-01-07',
      successRule:
        'Compare checkout completion with the baseline using matching definitions.',
      guardrail: 'Keep item price and ad budget unchanged.',
    },
    checkin: null,
  }
}
function latest(owner: string): FocusedInvestigation {
  return workspace(owner).investigations!.at(-1)!
}
function save(
  owner: string,
  value: FocusedInput,
  intent: string,
  previous?: FocusedInvestigation,
) {
  saveInvestigation(
    owner,
    { input: value, intent, revision: previous?.revision },
    previous?.id,
  )
  return latest(owner)
}
beforeEach(() => {
  closeDatabases()
  vi.stubEnv('NEXORA_DB_PATH', ':memory:')
  vi.stubEnv('APP_ORIGIN', origin)
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-08T12:00:00Z'))
})
afterEach(() => {
  closeDatabases()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('focused investigations', () => {
  it('uses existing auth and origin protections for new routes', async () => {
    const a = await account()
    expect(
      (
        await createInvestigation(
          request('/api/investigations', {
            input: input(),
            intent: 'diagnose',
          }),
        )
      ).status,
    ).toBe(401)
    expect(
      (
        await createInvestigation(
          request(
            '/api/investigations',
            { input: input(), intent: 'diagnose' },
            a.cookie,
            'POST',
            'https://attacker.example',
          ),
        )
      ).status,
    ).toBe(403)
    expect(
      (await getEvents(request('/api/product-events', undefined, '', 'GET')))
        .status,
    ).toBe(401)
    expect(
      (
        await feedback(
          request(
            '/api/feedback',
            {},
            a.cookie,
            'POST',
            'https://attacker.example',
          ),
        )
      ).status,
    ).toBe(403)
  })

  it('keeps investigations, events, and feedback within the authenticated account', async () => {
    const a = await account()
    const b = await account('other@example.com')
    const investigation = save(a.user.id, input(), 'diagnose')
    const response = await updateInvestigation(
      request(
        `/api/investigations/${investigation.id}`,
        { input: input(), intent: 'draft', revision: investigation.revision },
        b.cookie,
        'PUT',
      ),
      { params: Promise.resolve({ id: investigation.id }) },
    )
    expect(response.status).toBe(404)
    expect(() =>
      recordProductEvent(b.user.id, {
        type: 'return_visit',
        investigationId: investigation.id,
      }),
    ).toThrow('not found in your account')
    expect(() =>
      recordFeedback(b.user.id, {
        investigationId: investigation.id,
        rating: 'useful',
        note: '',
      }),
    ).toThrow('not found in your account')
    recordFeedback(a.user.id, {
      investigationId: investigation.id,
      rating: 'useful',
      note: 'I understand why shipping disclosure matters.',
    })
    const events = await (
      await getEvents(
        request('/api/product-events', undefined, b.cookie, 'GET'),
      )
    ).json()
    expect(events).toEqual({ events: [], feedback: [] })
    expect(workspace(b.user.id).investigations).toEqual([])
    expect(focusedFeedback(a.user.id)).toHaveLength(1)
  })

  it('preserves unknown and zero values and rejects incompatible confirmed funnels', async () => {
    const a = await account()
    const value = input()
    value.metrics.views = null
    const investigation = save(a.user.id, value, 'diagnose')
    expect(investigation.metrics.views).toBeNull()
    expect(investigation.metrics.orders).toBe(0)
    const bad = input()
    bad.metrics.orders = 30
    expect(() => save(a.user.id, bad, 'diagnose')).toThrow('later funnel count')
    bad.comparable = false
    expect(save(a.user.id, bad, 'diagnose').comparable).toBe(false)
    const missing = input()
    missing.metrics.orders = Number.NaN
    expect(() => save(a.user.id, missing, 'diagnose')).toThrow(
      'nonnegative orders',
    )
    const wrongDates = input()
    wrongDates.metrics.days = 8
    expect(() => save(a.user.id, wrongDates, 'diagnose')).toThrow(
      'duration must match',
    )
  })

  it('checks revision and prerequisites, emits completion and changed-answer events once', async () => {
    const a = await account()
    const value = input()
    value.answers = {}
    expect(() => save(a.user.id, value, 'artifact')).toThrow(
      'Save your diagnosis',
    )
    const first = save(a.user.id, value, 'diagnose')
    expect(() =>
      saveInvestigation(
        a.user.id,
        { input: value, intent: 'diagnose', revision: 0 },
        first.id,
      ),
    ).toThrow('another tab')
    expect(() => save(a.user.id, value, 'plan', first)).toThrow(
      'Complete your action artifact',
    )
    expect(
      productEvents(a.user.id).filter((e) => e.type === 'diagnosis_completed'),
    ).toHaveLength(0)
    value.answers.shippingTiming = 'checkout'
    const second = save(a.user.id, value, 'diagnose', first)
    value.answers.shippingMargin = 'positive'
    const third = save(a.user.id, value, 'diagnose', second)
    expect(
      productEvents(a.user.id).filter((e) => e.type === 'diagnosis_completed'),
    ).toHaveLength(1)
    expect(
      productEvents(a.user.id).filter((e) => e.type === 'question_answered'),
    ).toHaveLength(2)
    const artifact = save(a.user.id, value, 'artifact', third)
    expect(artifact.stage).toBe('artifact')
    const repeat = save(a.user.id, value, 'artifact', artifact)
    expect(
      productEvents(a.user.id).filter((e) => e.type === 'artifact_completed'),
    ).toHaveLength(1)
    const planned = save(a.user.id, value, 'plan', repeat)
    expect(planned.stage).toBe('planned')
    expect(
      productEvents(a.user.id).filter((e) => e.type === 'experiment_started'),
    ).toHaveLength(1)
  })

  it('requires completion again when a pre-experiment artifact changes without inflating completion counts', async () => {
    const a = await account()
    const value = input()
    const diagnosis = save(a.user.id, value, 'diagnose')
    const artifact = save(a.user.id, value, 'artifact', diagnosis)
    value.plan.reviewDate = '2099-01-08'
    const scheduling = save(a.user.id, value, 'draft', artifact)
    expect(scheduling.stage).toBe('artifact')
    value.plan.change = 'A different exact shipping notice.'
    expect(() => save(a.user.id, value, 'plan', scheduling)).toThrow(
      'work product changed',
    )
    const edited = save(a.user.id, value, 'draft', scheduling)
    expect(edited.stage).toBe('diagnosed')
    expect(() => save(a.user.id, value, 'plan', edited)).toThrow(
      'Complete your action artifact',
    )
    const completedAgain = save(a.user.id, value, 'artifact', edited)
    expect(completedAgain.stage).toBe('artifact')
    expect(
      productEvents(a.user.id).filter((e) => e.type === 'artifact_completed'),
    ).toHaveLength(1)
    expect(completedAgain.plan.change).toBe(value.plan.change)
    value.answers = {}
    const questionAgain = save(a.user.id, value, 'diagnose', completedAgain)
    expect(questionAgain.stage).toBe('diagnosed')
    expect(() => save(a.user.id, value, 'artifact', questionAgain)).toThrow(
      'remaining follow-up question',
    )
  })

  it('freezes the original profile, baseline, answers, cost assumptions, and criteria after planning', async () => {
    const a = await account()
    const value = input()
    const diagnosis = save(a.user.id, value, 'diagnose')
    updateProfile(a.user.id, {
      ...createProfileDefaults('Asia/Seoul'),
      name: 'Changed account profile',
      businessType: 'ecommerce',
      currency: 'KRW',
    })
    const artifact = save(a.user.id, value, 'artifact', diagnosis)
    const planned = save(a.user.id, value, 'plan', artifact)
    expect(planned.profileSnapshot.currency).toBe('USD')
    expect(planned.profileSnapshot.name).toBe('Test store')
    for (const mutate of [
      (v: FocusedInput) => {
        v.metrics.orders = 1
      },
      (v: FocusedInput) => {
        v.answers.shippingTiming = 'early'
      },
      (v: FocusedInput) => {
        v.costs.shippingCost = 0
      },
      (v: FocusedInput) => {
        v.plan.successRule = 'Anything is success'
      },
    ]) {
      const changed = structuredClone(value)
      mutate(changed)
      expect(() => save(a.user.id, changed, 'draft', planned)).toThrow(
        'baseline and planned criteria are preserved',
      )
    }
    expect(latest(a.user.id).revision).toBe(planned.revision)
  })

  it('saves compatible follow-up observations and locks the completed check-in', async () => {
    const a = await account()
    const value = input()
    const diagnosis = save(a.user.id, value, 'diagnose')
    const artifact = save(a.user.id, value, 'artifact', diagnosis)
    const planned = save(a.user.id, value, 'plan', artifact)
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))
    value.checkin = {
      periodStart: '2026-01-08',
      periodEnd: '2026-01-14',
      source: 'Same storefront export',
      comparable: true,
      metrics: { ...value.metrics, orders: 2 },
      changed: 'Shipping disclosed on product page',
      notes: 'No other planned changes.',
    }
    expect(() => save(a.user.id, value, 'draft', planned)).toThrow(
      'check-in action',
    )
    const mismatch = structuredClone(value)
    mismatch.checkin!.metrics.days = 8
    mismatch.checkin!.periodEnd = '2026-01-15'
    expect(() => save(a.user.id, mismatch, 'checkin', planned)).toThrow(
      'matching reporting durations',
    )
    const reviewed = save(a.user.id, value, 'checkin', planned)
    expect(reviewed.stage).toBe('reviewed')
    expect(
      productEvents(a.user.id).filter((e) => e.type === 'checkin_completed'),
    ).toHaveLength(1)
    value.checkin!.metrics.orders = 8
    expect(() => save(a.user.id, value, 'checkin', reviewed)).toThrow(
      'completed check-in is preserved',
    )
  })

  it('separates historical observations from a real follow-up and permits noncomparable notes without comparing them', async () => {
    const a = await account()
    const value = input()
    const diagnosis = save(a.user.id, value, 'diagnose')
    const artifact = save(a.user.id, value, 'artifact', diagnosis)
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))
    const planned = save(a.user.id, value, 'plan', artifact)
    vi.setSystemTime(new Date('2026-01-17T12:00:00Z'))
    value.checkin = {
      periodStart: '2026-01-08',
      periodEnd: '2026-01-14',
      source: 'Older export',
      comparable: false,
      metrics: { ...value.metrics },
      changed: '',
      notes: '',
    }
    expect(() => save(a.user.id, value, 'checkin', planned)).toThrow(
      'on or after the experiment was started',
    )
    value.checkin = {
      ...value.checkin,
      periodStart: '2026-01-15',
      periodEnd: '2026-01-16',
      source: 'Different population, observations only',
      metrics: { ...value.metrics, days: 2 },
    }
    const reviewed = save(a.user.id, value, 'checkin', planned)
    expect(reviewed.checkin!.comparable).toBe(false)
    expect(reviewed.checkin!.metrics.days).toBe(2)
  })

  it('does not accept forged server milestones through the client event endpoint', async () => {
    const a = await account()
    const investigation = save(a.user.id, input(), 'diagnose')
    const recordedBefore = productEvents(a.user.id)
    for (const type of [
      'diagnosis_completed',
      'artifact_completed',
      'experiment_started',
      'checkin_completed',
      'question_answered',
    ]) {
      expect(
        (
          await postEvent(
            request(
              '/api/product-events',
              {
                type,
                investigationId: investigation.id,
                source: 'server',
                recordedAt: '2000-01-01T00:00:00Z',
              },
              a.cookie,
            ),
          )
        ).status,
      ).toBe(400)
    }
    expect(productEvents(a.user.id)).toEqual(recordedBefore)
    expect(
      (
        await postEvent(
          request(
            '/api/product-events',
            { type: 'flow_opened', investigationId: investigation.id },
            a.cookie,
          ),
        )
      ).status,
    ).toBe(200)
    expect(productEvents(a.user.id).at(-1)).toMatchObject({
      type: 'flow_opened',
      source: 'client',
    })
  })

  it('requires a finished diagnostic direction and a complete worksheet for a cost artifact', async () => {
    const a = await account()
    const value = input()
    value.answers = {}
    const unresolved = save(a.user.id, value, 'diagnose')
    expect(() => save(a.user.id, value, 'artifact', unresolved)).toThrow(
      'remaining follow-up question',
    )
    value.answers = { focus: 'cost' }
    value.costs.shippingCost = null
    const diagnosis = save(a.user.id, value, 'diagnose', unresolved)
    expect(() => save(a.user.id, value, 'artifact', diagnosis)).toThrow(
      'Complete the unit cost worksheet',
    )
    value.costs.shippingCost = 6
    expect(save(a.user.id, value, 'artifact', diagnosis).stage).toBe('artifact')
    const unsupported = input()
    unsupported.answers = { inventedQuestion: 'yes' }
    expect(() => save(a.user.id, unsupported, 'diagnose')).toThrow(
      'supported answer',
    )
    unsupported.answers = { shippingTiming: 'inventedValue' }
    expect(() => save(a.user.id, unsupported, 'diagnose')).toThrow(
      'supported answer',
    )
  })

  it('deduplicates reload events and requires return visits on a later local date', async () => {
    const a = await account()
    const investigation = save(a.user.id, input(), 'diagnose')
    const first = recordProductEvent(a.user.id, { type: 'flow_opened' })
    const duplicate = recordProductEvent(a.user.id, {
      type: 'flow_opened',
      investigationId: investigation.id,
    })
    expect(first.id).toBe(duplicate.id)
    expect(() =>
      recordProductEvent(a.user.id, {
        type: 'return_visit',
        investigationId: investigation.id,
      }),
    ).toThrow('later local date')
    vi.setSystemTime(new Date('2026-01-09T12:00:00Z'))
    const returned = recordProductEvent(a.user.id, {
      type: 'return_visit',
      investigationId: investigation.id,
    })
    expect(
      recordProductEvent(a.user.id, {
        type: 'return_visit',
        investigationId: investigation.id,
      }).id,
    ).toBe(returned.id)
    expect(
      productEvents(a.user.id).filter((e) => e.type === 'return_visit'),
    ).toHaveLength(1)
    const reopened = recordProductEvent(a.user.id, { type: 'flow_opened' })
    expect(reopened.id).not.toBe(first.id)
  })

  it('limits the pilot to ecommerce and accepts incomplete drafts without inventing data', async () => {
    const a = await account()
    const value = input()
    value.product = ''
    value.channel = ''
    value.source = ''
    value.periodStart = ''
    value.periodEnd = ''
    for (const key of [
      'visits',
      'views',
      'carts',
      'checkouts',
      'orders',
    ] as const)
      value.metrics[key] = null
    const draft = save(a.user.id, value, 'draft')
    expect(draft.stage).toBe('draft')
    expect(productEvents(a.user.id)).toEqual([])
    updateProfile(a.user.id, {
      ...createProfileDefaults(),
      businessType: 'services',
    })
    expect(() => save(a.user.id, input(), 'diagnose')).toThrow(
      'currently supports online retail',
    )
  })
})
