import Stripe from 'stripe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authenticate } from './auth'
import { closeDatabases, database, getRecord, listRecords, saveRecord } from './database'
import { assess, updateProfile } from './operations'
import { createProfileDefaults } from '@/lib/business/validation'
import * as catalog from '@/lib/marketing/creative-plans'
import { cancelCreativeRenewal, changeMonthlyScenes, createCreativeCheckout, createMotionTopUp, readCreativeSubscription, reconcileCreativeCheckout, recordCreativeRefund } from './creative-billing'
import { syncBilling, billingSummary } from './billing'

const start = Math.floor(Date.now() / 1000) - 3600, end = start + 30 * 86400
const requestA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', requestB = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'
const ids = { STRIPE_PRICE_CREATIVE_FOCUS: 'p_focus', STRIPE_PRICE_CREATIVE_GROWTH: 'p_growth', STRIPE_PRICE_MOTION_SCENE_MONTHLY: 'p_scene_month', STRIPE_PRICE_MOTION_FIVE_MONTHLY: 'p_five_month', STRIPE_PRICE_MOTION_SCENE_ONCE: 'p_scene_once', STRIPE_PRICE_MOTION_FIVE_ONCE: 'p_five_once' }
function price(id: string) { return { id, active: true, currency: 'usd', unit_amount: id.includes('focus') ? 7900 : id.includes('growth') ? 14900 : id.includes('five') ? 5900 : 1500, tax_behavior: 'exclusive', recurring: id.endsWith('once') ? null : { interval: 'month', interval_count: 1 } } }
function subscription(owner: string) { return { id: 'sub_creative', created: start, customer: 'cus_creative', collection_method: 'charge_automatically', status: 'active', cancel_at_period_end: false, schedule: null as string | null, metadata: { nexora_owner: owner, nexora_catalog: catalog.CREATIVE_CATALOG_VERSION }, latest_invoice: { status: 'paid' }, items: { has_more: false, data: [{ id: 'si_base', quantity: 1, price: price('p_focus'), current_period_start: start, current_period_end: end }] } } }
let stripe: Stripe, sub: ReturnType<typeof subscription>, ownerId: string
function schedule() { return { id: 'sched_creative', customer: 'cus_creative', status: 'active', metadata: { nexora_owner: ownerId, nexora_catalog: catalog.CREATIVE_CATALOG_VERSION }, current_phase: { start_date: start, end_date: end }, phases: [] } }
const proto = (resource: object) => Object.getPrototypeOf(resource)

beforeEach(() => {
  closeDatabases(); vi.stubEnv('NEXORA_DB_PATH', ':memory:')
  vi.spyOn(catalog, 'creativeOfferIsPreview').mockReturnValue(false)
  for (const [key, value] of Object.entries({ ...ids, STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_WEBHOOK_SECRET: 'whsec_fixture', STRIPE_PORTAL_CONFIGURATION: 'bpc_fixture', NEXORA_PAID_LAUNCH_ENABLED: 'true', NEXORA_LEGAL_APPROVED: 'true', NEXORA_LIVE_TESTS_APPROVED: 'true', OPENAI_API_KEY: 'fixture', OPENAI_MODEL: 'fixture', RESEND_API_KEY: 'fixture', NEXORA_EMAIL_FROM: 'account@example.com', NEXORA_LEGAL_NAME: 'Fixture', NEXORA_LEGAL_ADDRESS: 'Fixture address', NEXT_PUBLIC_SUPPORT_EMAIL: 'support@example.com', APP_ORIGIN: 'https://example.com' })) vi.stubEnv(key, value)
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request') }))
  stripe = new Stripe('sk_test_fixture')
  vi.spyOn(proto(stripe.prices), 'retrieve').mockImplementation(async (id: unknown) => price(String(id)))
  vi.spyOn(proto(stripe.customers), 'create').mockResolvedValue({ id: 'cus_creative' })
  vi.spyOn(proto(stripe.subscriptions), 'list').mockImplementation(async () => ({ data: sub ? [sub] : [], has_more: false }))
  vi.spyOn(proto(stripe.subscriptions), 'retrieve').mockImplementation(async () => sub)
  vi.spyOn(proto(stripe.subscriptions), 'update').mockImplementation(async (_id: unknown, raw: unknown) => { const input = raw as { cancel_at_period_end: boolean }; sub.cancel_at_period_end = input.cancel_at_period_end; return sub })
  vi.spyOn(proto(stripe.subscriptionSchedules), 'create').mockImplementation(async () => { sub.schedule = 'sched_creative'; return schedule() })
  vi.spyOn(proto(stripe.subscriptionSchedules), 'retrieve').mockImplementation(async () => schedule())
  vi.spyOn(proto(stripe.subscriptionSchedules), 'update').mockResolvedValue({ id: 'sched_creative' })
  vi.spyOn(proto(stripe.subscriptionSchedules), 'release').mockImplementation(async () => { sub.schedule = null; return { id: 'sched_creative' } })
  vi.spyOn(proto(stripe.checkout.sessions), 'create').mockResolvedValue({ id: 'cs_fixture', url: 'https://checkout.stripe.com/c/pay/fixture' })
})
afterEach(() => { closeDatabases(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); sub = undefined as unknown as typeof sub })
async function account(owned = false) {
  const user = await authenticate({ email: 'recurring@example.com', password: 'fixture-password-12345' }, true); ownerId = user.id
  saveRecord(user.id, 'email_verified', 'current', { verifiedAt: new Date().toISOString() })
  updateProfile(user.id, { ...createProfileDefaults('UTC'), name: 'Fixture business', offering: 'Product design', customerType: 'Shop owners', salesChannels: ['Website'], goal: 'awareness' }); assess(user.id, { evidenceIds: [] })
  if (owned) { sub = subscription(user.id); database().prepare('INSERT INTO billing_customers(owner_id,customer_id) VALUES(?,?)').run(user.id, 'cus_creative'); saveRecord(user.id, 'billing', 'current', { id: sub.id }) }
  return user
}

describe('recurring creative subscription lifecycle', () => {
  it('creates automatic monthly base plus monthly extras with server-owned prices', async () => {
    const user = await account()
    await createCreativeCheckout(user, { plan: 'focus', scenes: 4, motionBilling: 'monthly', amount: 1, price: 'attacker' })
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({ mode: 'subscription', line_items: [{ price: 'p_focus', quantity: 1 }, { price: 'p_five_month', quantity: 1 }], subscription_data: { metadata: expect.objectContaining({ nexora_owner: user.id }) }, custom_text: { submit: { message: expect.stringContaining('$138/month') } } }), expect.anything())
    expect(vi.mocked(stripe.checkout.sessions.create).mock.calls[0][0]!.subscription_data).not.toHaveProperty('cancel_at')
  })
  it('routes one-time extras to the account after subscribing instead of silently recurring them', async () => {
    const user = await account(); await expect(createCreativeCheckout(user, { plan: 'focus', scenes: 1, motionBilling: 'one_time' })).rejects.toMatchObject({ code: 'ONE_TIME_FROM_ACCOUNT' })
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })
  it('reuses the same checkout intent and rejects another in-flight selection', async () => {
    const user = await account(); await createCreativeCheckout(user, { plan: 'focus', scenes: 1 }); await createCreativeCheckout(user, { plan: 'focus', scenes: 1 })
    const calls = vi.mocked(stripe.checkout.sessions.create).mock.calls
    expect(calls[0][1]).toEqual(calls[1][1]); expect(stripe.customers.create).toHaveBeenCalledTimes(1)
    await expect(createCreativeCheckout(user, { plan: 'growth', scenes: 1 })).rejects.toMatchObject({ code: 'CHECKOUT_PENDING' })
  })
  it('rejects catalog mismatch and unfinished release without making a checkout', async () => {
    const user = await account(); vi.mocked(stripe.prices.retrieve).mockResolvedValue({ ...price('p_focus'), unit_amount: 14900 } as never)
    await expect(createCreativeCheckout(user, { plan: 'focus', scenes: 0 })).rejects.toMatchObject({ code: 'BILLING_CATALOG_MISMATCH' })
    vi.mocked(catalog.creativeOfferIsPreview).mockReturnValue(true)
    await expect(createCreativeCheckout(user, { plan: 'focus', scenes: 0 })).rejects.toMatchObject({ code: 'BILLING_UNAVAILABLE' })
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })
  it('preserves the paid current phase and applies the next amount without proration', async () => {
    const user = await account(true); await changeMonthlyScenes(user.id, { scenes: 4, requestId: requestA })
    const payload = vi.mocked(stripe.subscriptionSchedules.update).mock.calls[0][1]!
    expect(payload).toMatchObject({ end_behavior: 'release', proration_behavior: 'none', phases: [
      { start_date: start, end_date: end, items: [{ price: 'p_focus', quantity: 1 }], proration_behavior: 'none' },
      { start_date: end, duration: { interval: 'month', interval_count: 1 }, items: [{ price: 'p_focus', quantity: 1 }, { price: 'p_five_month', quantity: 1 }], proration_behavior: 'none' },
    ] })
    expect(stripe.subscriptions.update).not.toHaveBeenCalled()
  })
  it('makes retries idempotent and prevents one request key from changing meaning', async () => {
    const user = await account(true); await changeMonthlyScenes(user.id, { scenes: 5, requestId: requestA }); await changeMonthlyScenes(user.id, { scenes: 5, requestId: requestA })
    expect(stripe.subscriptionSchedules.update).toHaveBeenCalledTimes(1)
    await expect(changeMonthlyScenes(user.id, { scenes: 0, requestId: requestA })).rejects.toMatchObject({ code: 'REQUEST_KEY_REUSED' })
  })
  it('removes recurring extras next period while keeping the base auto-renewal', async () => {
    const user = await account(true)
    sub.items.data.push({ id: 'si_extra', quantity: 1, price: price('p_five_month'), current_period_start: start, current_period_end: end })
    await changeMonthlyScenes(user.id, { scenes: 0, requestId: requestA })
    const next = vi.mocked(stripe.subscriptionSchedules.update).mock.calls[0][1]!
    expect(next.phases?.[1].items).toEqual([{ price: 'p_focus', quantity: 1 }]); expect(next.end_behavior).toBe('release')
    expect(sub.cancel_at_period_end).toBe(false)
  })
  it('cancels an existing schedule before stopping renewal at the paid period end', async () => {
    const user = await account(true); sub.schedule = 'sched_creative'
    await cancelCreativeRenewal(user.id, { requestId: requestA })
    expect(stripe.subscriptionSchedules.release).toHaveBeenCalledTimes(1)
    expect(stripe.subscriptions.update).toHaveBeenCalledWith(sub.id, { cancel_at_period_end: true }, expect.anything())
    expect(vi.mocked(stripe.subscriptionSchedules.release).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(stripe.subscriptions.update).mock.invocationCallOrder[0])
  })
  it('rejects cross-customer resources, foreign schedules, unpaid accounts, and malformed quantities', async () => {
    const user = await account(true); sub.customer = 'cus_other'
    await expect(changeMonthlyScenes(user.id, { scenes: 1, requestId: requestA })).rejects.toMatchObject({ code: 'BILLING_OWNER_MISMATCH' })
    sub.customer = 'cus_creative'; await expect(changeMonthlyScenes(user.id, { scenes: -1, requestId: requestA })).rejects.toMatchObject({ code: 'INVALID_QUANTITY' })
    sub.latest_invoice.status = 'open'; await expect(changeMonthlyScenes(user.id, { scenes: 1, requestId: requestA })).rejects.toMatchObject({ code: 'SUBSCRIPTION_NOT_CHANGEABLE' })
    sub.latest_invoice.status = 'paid'; sub.schedule = 'foreign'; vi.mocked(stripe.subscriptionSchedules.retrieve).mockResolvedValue({ ...schedule(), metadata: {} } as never)
    await expect(changeMonthlyScenes(user.id, { scenes: 1, requestId: requestB })).rejects.toMatchObject({ code: 'BILLING_REVIEW_REQUIRED' })
    expect(stripe.subscriptionSchedules.update).not.toHaveBeenCalled()
  })
  it('syncs creative rights independently from the old text contract', async () => {
    const user = await account(true); await syncBilling(user.id, stripe)
    expect(billingSummary(user.id)).toMatchObject({ plan: 'focus', packagesLimit: 4, creative: { monthlyUsd: 79, monthlyScenes: 0, canChange: true } })
    sub.latest_invoice.status = 'open'; await syncBilling(user.id, stripe); expect(billingSummary(user.id).plan).toBe('free')
  })
  it('creates only a one-time payment for account top-ups without touching renewal', async () => {
    const user = await account(true); await createMotionTopUp(user, { scenes: 5 })
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({ mode: 'payment', line_items: [{ price: 'p_five_once', quantity: 1 }] }), expect.anything())
    expect(stripe.subscriptions.update).not.toHaveBeenCalled(); expect(stripe.subscriptionSchedules.update).not.toHaveBeenCalled()
    expect(listRecords(user.id, 'creative_topup')).toHaveLength(0)
  })
})

describe('one-time payment entitlement reconciliation', () => {
  async function paidCheckout() {
    const user = await account(true)
    vi.spyOn(proto(stripe.checkout.sessions), 'retrieve').mockResolvedValue({ id: 'cs_paid', customer: 'cus_creative', mode: 'payment', status: 'complete', payment_status: 'paid', payment_intent: 'pi_paid', metadata: { nexora_catalog: catalog.CREATIVE_CATALOG_VERSION, nexora_owner: user.id, nexora_kind: 'motion_topup' } })
    vi.spyOn(proto(stripe.checkout.sessions), 'listLineItems').mockResolvedValue({ has_more: false, data: [{ price: price('p_five_once'), quantity: 1 }] })
    vi.spyOn(proto(stripe.paymentIntents), 'retrieve').mockResolvedValue({ id: 'pi_paid', customer: 'cus_creative', status: 'succeeded', latest_charge: 'ch_paid' })
    vi.spyOn(proto(stripe.charges), 'retrieve').mockResolvedValue({ id: 'ch_paid', created: start, refunded: false })
    return user
  }
  it('grants paid extras once and does not restart their expiry on replay', async () => {
    const user = await paidCheckout(); await reconcileCreativeCheckout(user.id, 'cs_paid', stripe)
    const original = getRecord(user.id, 'creative_topup', 'cs_paid')
    await reconcileCreativeCheckout(user.id, 'cs_paid', stripe)
    expect(listRecords(user.id, 'creative_topup')).toHaveLength(1); expect(getRecord(user.id, 'creative_topup', 'cs_paid')).toEqual(original)
    expect(await readCreativeSubscription(user.id, sub as unknown as Stripe.Subscription, stripe)).toMatchObject({ oneTimeScenes: 5 })
  })
  it('never grants unpaid or refunded purchases, including out-of-order refunds', async () => {
    const user = await paidCheckout()
    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValueOnce({ id: 'cs_paid', customer: 'cus_creative', mode: 'payment', status: 'complete', payment_status: 'unpaid', metadata: { nexora_catalog: catalog.CREATIVE_CATALOG_VERSION, nexora_owner: user.id } } as never)
    await reconcileCreativeCheckout(user.id, 'cs_paid', stripe); expect(listRecords(user.id, 'creative_topup')).toHaveLength(0)
    recordCreativeRefund(user.id, { refunded: true, payment_intent: 'pi_paid' } as Stripe.Charge)
    await reconcileCreativeCheckout(user.id, 'cs_paid', stripe); expect(listRecords(user.id, 'creative_topup')).toHaveLength(0)
  })
})
