import Stripe from 'stripe'
import { createHash } from 'node:crypto'
import { CREATIVE_CATALOG_VERSION, CREATIVE_PLANS, MOTION_PACKS, creativeOfferIsPreview, quoteCreativeOffer, type MotionBilling } from '@/lib/marketing/creative-plans'
import { isPaidPlan, type CreativeBillingSummary, type PaidPlanId } from '@/lib/billing/plans'
import type { Assessment, BusinessProfile, SessionUser } from '@/lib/business/types'
import { missingGenerationFields } from '@/lib/business/industry'
import { database, getRecord, listRecords, saveRecord, transaction } from './database'
import { billingOrigin, checkoutIntent, customerFor, stripeClient, withBillingLock } from './billing-shared'
import { HttpError, objectInput } from './errors'

const VERSION = CREATIVE_CATALOG_VERSION
const envNames = {
  focus: 'STRIPE_PRICE_CREATIVE_FOCUS', growth: 'STRIPE_PRICE_CREATIVE_GROWTH',
  'motion-scene:monthly': 'STRIPE_PRICE_MOTION_SCENE_MONTHLY', 'motion-five:monthly': 'STRIPE_PRICE_MOTION_FIVE_MONTHLY',
  'motion-scene:one_time': 'STRIPE_PRICE_MOTION_SCENE_ONCE', 'motion-five:one_time': 'STRIPE_PRICE_MOTION_FIVE_ONCE',
} as const
type Sku = keyof typeof envNames
const priceId = (sku: Sku) => process.env[envNames[sku]]?.trim() || ''
const idOf = (value: string | { id: string } | null | undefined) => typeof value === 'string' ? value : value?.id
const review = () => new HttpError(503, 'BILLING_REVIEW_REQUIRED', 'Billing needs a review. Refresh your account or contact support; no new purchase was made.')
const planFor = (id: PaidPlanId) => CREATIVE_PLANS.find(plan => plan.id === id)!
type Items = Array<{ price: string; quantity: number }>
interface Command { fingerprint: string; state: 'pending' | 'complete'; effectiveAt: string; periodEnd: number }
interface TopUp { id: string; scenes: number; consumed: number; expiresAt: string; paymentIntent: string | null; refunded: boolean }

function quote(plan: PaidPlanId, scenes: unknown, mode: MotionBilling = 'monthly') {
  if (typeof scenes !== 'number') throw new HttpError(400, 'INVALID_QUANTITY', 'Choose a whole number of scenes.')
  try { return quoteCreativeOffer(plan, scenes, mode) }
  catch { throw new HttpError(400, 'INVALID_QUANTITY', 'Choose 0–50 whole scenes and a valid billing option.') }
}
function skuAmount(sku: Sku) {
  if (sku === 'focus' || sku === 'growth') return planFor(sku).monthlyUsd
  const pack = MOTION_PACKS.find(pack => sku.startsWith(pack.id + ':'))!
  return sku.endsWith(':monthly') ? pack.monthlyUsd : pack.oneTimeUsd
}
function matchesPrice(price: Stripe.Price, sku: Sku) {
  const monthly = !sku.endsWith(':one_time')
  return Boolean(priceId(sku)) && price.id === priceId(sku) && price.currency === 'usd' &&
    price.unit_amount === skuAmount(sku) * 100 && price.tax_behavior === 'exclusive' &&
    (monthly ? price.recurring?.interval === 'month' && price.recurring.interval_count === 1 : !price.recurring)
}
async function validatedItems(stripe: Stripe, plan: PaidPlanId, scenes: number, mode: MotionBilling, includeBase: boolean) {
  const selection = quote(plan, scenes, mode)
  const skus: Array<{ sku: Sku; quantity: number }> = [
    ...(includeBase ? [{ sku: plan, quantity: 1 }] : []),
    ...selection.items.map(item => ({ sku: `${item.packId}:${mode}` as Sku, quantity: item.quantity })),
  ]
  const items = await Promise.all(skus.map(async item => {
    if (!priceId(item.sku)) throw review()
    const price = await stripe.prices.retrieve(priceId(item.sku))
    if (!price.active || !matchesPrice(price, item.sku)) throw new HttpError(503, 'BILLING_CATALOG_MISMATCH', 'The configured price does not match this offer. You have not been charged.')
    return { price: price.id, quantity: item.quantity }
  }))
  return { selection, items }
}
export function creativeCheckoutAvailable() {
  if (creativeOfferIsPreview()) return false
  if (process.env.NODE_ENV === 'production' && !/^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY?.trim() || '')) return false
  return ['NEXORA_PAID_LAUNCH_ENABLED', 'NEXORA_LEGAL_APPROVED', 'NEXORA_LIVE_TESTS_APPROVED'].every(key => process.env[key] === 'true') &&
    ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PORTAL_CONFIGURATION', 'OPENAI_API_KEY', 'OPENAI_MODEL', 'RESEND_API_KEY', 'NEXORA_EMAIL_FROM', 'NEXORA_LEGAL_NAME', 'NEXORA_LEGAL_ADDRESS', 'NEXT_PUBLIC_SUPPORT_EMAIL', ...Object.values(envNames)].every(key => Boolean(process.env[key]?.trim())) && Boolean(process.env.APP_ORIGIN?.startsWith('https://'))
}
function requirePurchaseAvailable() {
  if (!creativeCheckoutAvailable()) throw new HttpError(503, 'BILLING_UNAVAILABLE', 'Creative purchases are not open yet. You have not been charged.')
}
function requireVerified(user: SessionUser) {
  if (!getRecord(user.id, 'email_verified', 'current')) throw new HttpError(403, 'EMAIL_VERIFICATION_REQUIRED', 'Verify your email before purchasing.')
}
function requiredPlan(raw: unknown): PaidPlanId {
  if (!isPaidPlan(raw)) throw new HttpError(400, 'INVALID_PLAN', 'Choose Focus or Growth.')
  return raw
}
async function ensureCustomer(user: SessionUser, stripe: Stripe) {
  let row = customerFor(user.id)
  if (!row) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { nexora_owner: user.id } }, { idempotencyKey: `nexora-customer-${user.id}` })
    transaction(() => database().prepare('INSERT OR IGNORE INTO billing_customers(owner_id,customer_id) VALUES(?,?)').run(user.id, customer.id))
    row = customerFor(user.id)!
  }
  return row
}
function checkoutParams(owner: string, customer: string): Stripe.Checkout.SessionCreateParams {
  return { customer, client_reference_id: owner, automatic_tax: { enabled: true }, billing_address_collection: 'required',
    customer_update: { address: 'auto', name: 'auto' }, tax_id_collection: { enabled: true }, consent_collection: { terms_of_service: 'required' },
    success_url: `${billingOrigin()}/workspace?billing=return#billing`, cancel_url: `${billingOrigin()}/workspace#billing` }
}
export async function createCreativeCheckout(user: SessionUser, raw: unknown): Promise<string> {
  const input = objectInput(raw), plan = requiredPlan(input.plan)
  const mode = (input.motionBilling ?? 'monthly') as MotionBilling
  const selection = quote(plan, input.scenes ?? 0, mode)
  if (mode === 'one_time' && selection.purchasedScenes > 0) throw new HttpError(400, 'ONE_TIME_FROM_ACCOUNT', 'Subscribe to the base plan first, then buy one-time extras from Plan & billing.')
  requirePurchaseAvailable(); requireVerified(user)
  const profile = getRecord<BusinessProfile>(user.id, 'profile', 'current'), assessment = listRecords<Assessment>(user.id, 'assessment').at(-1)
  if (!profile || missingGenerationFields(profile).length || !assessment || assessment.profileVersion !== profile.version || !assessment.recommendedActions.some(action => action.kind === 'marketing_assets')) {
    throw new HttpError(422, 'WORKSPACE_SETUP_REQUIRED', 'Complete your business details and a marketing check before subscribing.')
  }
  return withBillingLock(user.id, async () => {
    const stripe = stripeClient(), verified = await validatedItems(stripe, plan, selection.requestedScenes, mode, true)
    const customer = await ensureCustomer(user, stripe)
    const existing = await stripe.subscriptions.list({ customer: customer.customer_id, status: 'all', limit: 100 })
    if (existing.has_more || existing.data.some(item => !['canceled', 'incomplete_expired'].includes(item.status))) throw new HttpError(409, 'SUBSCRIPTION_EXISTS', 'Manage your existing subscription instead of starting another.')
    const intent = checkoutIntent(user.id, `creative:${plan}:${mode}:${selection.purchasedScenes}`)
    const metadata = { nexora_owner: user.id, nexora_catalog: VERSION, nexora_plan: plan, nexora_intent: intent.key }
    const session = await stripe.checkout.sessions.create({ ...checkoutParams(user.id, customer.customer_id), mode: 'subscription',
      line_items: verified.items, payment_method_collection: 'always', metadata,
      subscription_data: { metadata }, expires_at: intent.expires / 1000,
      custom_text: { submit: { message: `Your subscription renews automatically at $${selection.renewalUsd}/month before tax until you cancel. ${mode === 'one_time' && selection.motionUsd ? `$${selection.motionUsd} of motion packs is charged only once.` : 'Selected monthly scene packs renew with your plan.'}` } },
    }, { idempotencyKey: `nexora-creative-checkout-${intent.key}` })
    if (!session.url) throw review()
    return session.url
  })
}

/** Validate an entire subscription; unknown extra items never grant allowances. */
function decodeItems(subscription: Stripe.Subscription, owner: string) {
  if (subscription.metadata?.nexora_catalog !== VERSION || subscription.metadata.nexora_owner !== owner || subscription.collection_method !== 'charge_automatically' || subscription.items.has_more) return null
  let plan: PaidPlanId | null = null, base: Stripe.SubscriptionItem | null = null, scenes = 0, monthlyUsd = 0
  const seen = new Set<string>()
  for (const item of subscription.items.data) {
    if (seen.has(item.price.id) || !Number.isSafeInteger(item.quantity) || item.quantity! < 1) return null
    seen.add(item.price.id)
    const sku = (Object.keys(envNames) as Sku[]).find(key => !key.endsWith(':one_time') && matchesPrice(item.price, key))
    if (!sku) return null
    if (isPaidPlan(sku)) { if (plan || item.quantity !== 1) return null; plan = sku; base = item }
    else scenes += MOTION_PACKS.find(pack => sku.startsWith(pack.id + ':'))!.scenes * item.quantity!
    monthlyUsd += skuAmount(sku) * item.quantity!
  }
  if (!plan || !base || scenes > 50 || !base.current_period_start || !base.current_period_end || subscription.items.data.some(item => item.current_period_start !== base!.current_period_start || item.current_period_end !== base!.current_period_end)) return null
  return { plan, base, scenes, monthlyUsd }
}
function scheduleOwned(owner: string, subscription: string, schedule: Stripe.SubscriptionSchedule) {
  return (schedule.metadata?.nexora_owner === owner && schedule.metadata.nexora_catalog === VERSION) ||
    getRecord<{ id: string; subscription: string }>(owner, 'creative_schedule', 'current')?.id === schedule.id &&
    getRecord<{ subscription: string }>(owner, 'creative_schedule', 'current')?.subscription === subscription
}
function scheduledRenewal(schedule: Stripe.SubscriptionSchedule, decoded: NonNullable<ReturnType<typeof decodeItems>>) {
  const phase = schedule.phases.find(phase => phase.start_date === decoded.base.current_period_end)
  if (!phase) return null
  let scenes = 0, monthlyUsd = 0, bases = 0
  for (const item of phase.items) {
    const sku = (Object.keys(envNames) as Sku[]).find(key => !key.endsWith(':one_time') && priceId(key) && priceId(key) === idOf(item.price))
    if (!sku || !Number.isSafeInteger(item.quantity) || item.quantity! < 1) throw review()
    if (isPaidPlan(sku)) { if (sku !== decoded.plan || item.quantity !== 1) throw review(); bases++ }
    else scenes += MOTION_PACKS.find(pack => sku.startsWith(pack.id + ':'))!.scenes * item.quantity!
    monthlyUsd += skuAmount(sku) * item.quantity!
  }
  if (bases !== 1 || scenes > 50) throw review()
  return { scenes, monthlyUsd, effectiveAt: new Date(phase.start_date * 1000).toISOString() }
}
export async function readCreativeSubscription(owner: string, subscription: Stripe.Subscription, stripe: Stripe): Promise<CreativeBillingSummary | null> {
  const decoded = decodeItems(subscription, owner)
  if (!decoded) return null
  const invoice = subscription.latest_invoice
  const paid = Boolean(invoice && typeof invoice !== 'string' && invoice.status === 'paid')
  let pending: CreativeBillingSummary['pending'] = null, managed = true
  if (subscription.schedule) {
    const schedule = typeof subscription.schedule === 'string' ? await stripe.subscriptionSchedules.retrieve(subscription.schedule) : subscription.schedule
    managed = scheduleOwned(owner, subscription.id, schedule)
    if (managed && schedule.status === 'active') {
      const renewal = scheduledRenewal(schedule, decoded)
      if (renewal && (renewal.scenes !== decoded.scenes || renewal.monthlyUsd !== decoded.monthlyUsd)) pending = renewal
    }
  }
  const oneTimeScenes = listRecords<TopUp>(owner, 'creative_topup').filter(item => !item.refunded && Date.parse(item.expiresAt) > Date.now()).reduce((sum, item) => sum + Math.max(0, item.scenes - item.consumed), 0)
  return { plan: decoded.plan, status: subscription.status, paid, monthlyScenes: decoded.scenes, monthlyUsd: decoded.monthlyUsd,
    periodStart: new Date(decoded.base.current_period_start * 1000).toISOString(), periodEnd: new Date(decoded.base.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end, canChange: managed && paid && subscription.status === 'active' && !subscription.cancel_at_period_end,
    canCancel: managed && !['canceled', 'incomplete_expired'].includes(subscription.status) && !subscription.cancel_at_period_end,
    pending, oneTimeScenes }
}
async function ownedSubscription(owner: string, stripe: Stripe) {
  const customer = customerFor(owner), saved = getRecord<{ id: string }>(owner, 'billing', 'current')
  if (!customer || !saved?.id) throw new HttpError(404, 'BILLING_NOT_FOUND', 'No subscription is connected to this account.')
  const subscription = await stripe.subscriptions.retrieve(saved.id, { expand: ['latest_invoice'] })
  if (idOf(subscription.customer) !== customer.customer_id) throw new HttpError(403, 'BILLING_OWNER_MISMATCH', 'This subscription does not belong to this account.')
  const decoded = decodeItems(subscription, owner)
  if (!decoded) throw review()
  return { subscription, decoded, customer }
}
function commandFor(owner: string, raw: unknown, operation: string, body: unknown, end: number) {
  if (typeof raw !== 'string' || !/^[0-9a-f-]{36}$/i.test(raw)) throw new HttpError(400, 'INVALID_REQUEST_KEY', 'Refresh the page before changing billing.')
  const fingerprint = createHash('sha256').update(JSON.stringify({ operation, body })).digest('hex')
  const existing = getRecord<Command>(owner, 'creative_billing_command', raw)
  if (existing && existing.fingerprint !== fingerprint) throw new HttpError(409, 'REQUEST_KEY_REUSED', 'This request already belongs to another change.')
  if (existing?.state === 'complete') return { key: raw, command: existing, complete: true }
  if (existing && existing.periodEnd !== end) throw new HttpError(409, 'BILLING_PERIOD_CHANGED', 'Your billing period changed. Refresh before submitting a new change.')
  const command: Command = existing ?? { fingerprint, state: 'pending', effectiveAt: new Date(end * 1000).toISOString(), periodEnd: end }
  saveRecord(owner, 'creative_billing_command', raw, command)
  return { key: raw, command, complete: false }
}
export async function changeMonthlyScenes(owner: string, raw: unknown) {
  const input = objectInput(raw)
  return withBillingLock(owner, async () => {
    const stripe = stripeClient(), { subscription, decoded } = await ownedSubscription(owner, stripe)
    const selection = quote(decoded.plan, input.scenes)
    const command = commandFor(owner, input.requestId, 'quantity', { subscription: subscription.id, scenes: selection.requestedScenes }, decoded.base.current_period_end)
    if (command.complete) return { effectiveAt: command.command.effectiveAt }
    const invoice = subscription.latest_invoice
    if (subscription.status !== 'active' || subscription.cancel_at_period_end || !invoice || typeof invoice === 'string' || invoice.status !== 'paid') throw new HttpError(409, 'SUBSCRIPTION_NOT_CHANGEABLE', 'Restore an active paid subscription before changing next month’s quantity.')
    if (decoded.base.current_period_end * 1000 - Date.now() < 60_000) throw new HttpError(409, 'BILLING_PERIOD_CHANGING', 'Your renewal is processing. Refresh after it completes.')
    if (subscription.discounts?.length) throw review()
    let schedule: Stripe.SubscriptionSchedule | undefined
    let renewal = { scenes: decoded.scenes, monthlyUsd: decoded.monthlyUsd }
    if (subscription.schedule) {
      schedule = typeof subscription.schedule === 'string' ? await stripe.subscriptionSchedules.retrieve(subscription.schedule) : subscription.schedule
      if (!scheduleOwned(owner, subscription.id, schedule)) throw review()
      if (schedule.status !== 'active' || !schedule.current_phase) throw review()
      renewal = scheduledRenewal(schedule, decoded) ?? renewal
    }
    // Existing access, reductions, and cancellation remain available while new purchases are closed.
    // Compare with the scheduled renewal, not today's quantity: replacing a pending increase can be a reduction.
    if (selection.purchasedScenes > renewal.scenes || selection.renewalUsd > renewal.monthlyUsd) requirePurchaseAvailable()
    const next = await validatedItems(stripe, decoded.plan, selection.requestedScenes, 'monthly', true)
    if (!schedule) {
      schedule = await stripe.subscriptionSchedules.create({ from_subscription: subscription.id }, { idempotencyKey: `nexora-schedule-create-${owner}-${command.key}` })
      saveRecord(owner, 'creative_schedule', 'current', { id: schedule.id, subscription: subscription.id })
    }
    if (schedule.status !== 'active' || !schedule.current_phase) throw review()
    const current: Items = subscription.items.data.map(item => ({ price: item.price.id, quantity: item.quantity! }))
    const metadata = { nexora_owner: owner, nexora_catalog: VERSION, nexora_plan: decoded.plan }
    await stripe.subscriptionSchedules.update(schedule.id, { end_behavior: 'release', proration_behavior: 'none', metadata,
      default_settings: { collection_method: 'charge_automatically', automatic_tax: { enabled: true } },
      phases: [
        { start_date: schedule.current_phase.start_date, end_date: decoded.base.current_period_end, items: current, collection_method: 'charge_automatically', automatic_tax: { enabled: true }, proration_behavior: 'none', metadata },
        { start_date: decoded.base.current_period_end, duration: { interval: 'month', interval_count: 1 }, items: next.items, collection_method: 'charge_automatically', automatic_tax: { enabled: true }, proration_behavior: 'none', metadata },
      ],
    }, { idempotencyKey: `nexora-schedule-update-${owner}-${command.key}` })
    saveRecord(owner, 'creative_billing_command', command.key, { ...command.command, state: 'complete' })
    return { effectiveAt: command.command.effectiveAt }
  })
}
export async function cancelCreativeRenewal(owner: string, raw: unknown) {
  const input = objectInput(raw)
  return withBillingLock(owner, async () => {
    const stripe = stripeClient(), { subscription, decoded } = await ownedSubscription(owner, stripe)
    const command = commandFor(owner, input.requestId, 'cancel', { subscription: subscription.id }, decoded.base.current_period_end)
    if (command.complete) return { effectiveAt: command.command.effectiveAt }
    if (subscription.schedule) {
      const schedule = typeof subscription.schedule === 'string' ? await stripe.subscriptionSchedules.retrieve(subscription.schedule) : subscription.schedule
      if (!scheduleOwned(owner, subscription.id, schedule)) throw review()
      if (schedule.status === 'active' || schedule.status === 'not_started') await stripe.subscriptionSchedules.release(schedule.id, {}, { idempotencyKey: `nexora-schedule-release-${owner}-${command.key}` })
    }
    await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true }, { idempotencyKey: `nexora-cancel-renewal-${owner}-${command.key}` })
    saveRecord(owner, 'creative_billing_command', command.key, { ...command.command, state: 'complete' })
    return { effectiveAt: command.command.effectiveAt }
  })
}
export async function createMotionTopUp(user: SessionUser, raw: unknown) {
  const input = objectInput(raw)
  requirePurchaseAvailable(); requireVerified(user)
  return withBillingLock(user.id, async () => {
    const stripe = stripeClient(), { subscription, decoded, customer } = await ownedSubscription(user.id, stripe)
    if (subscription.status !== 'active' || !subscription.latest_invoice || typeof subscription.latest_invoice === 'string' || subscription.latest_invoice.status !== 'paid') throw new HttpError(409, 'SUBSCRIPTION_NOT_ACTIVE', 'One-time extras require an active paid creative plan.')
    const verified = await validatedItems(stripe, decoded.plan, input.scenes as number, 'one_time', false)
    if (!verified.selection.purchasedScenes) throw new HttpError(400, 'INVALID_QUANTITY', 'Choose at least one scene.')
    const intent = checkoutIntent(user.id, `topup:${verified.selection.purchasedScenes}`)
    const session = await stripe.checkout.sessions.create({ ...checkoutParams(user.id, customer.customer_id), mode: 'payment', line_items: verified.items,
      metadata: { nexora_owner: user.id, nexora_catalog: VERSION, nexora_kind: 'motion_topup', nexora_intent: intent.key },
      expires_at: intent.expires / 1000, custom_text: { submit: { message: 'This is a one-time purchase. It does not change your monthly subscription or renew automatically. Scenes expire 30 days after confirmed payment.' } },
    }, { idempotencyKey: `nexora-motion-checkout-${intent.key}` })
    if (!session.url) throw review()
    return session.url
  })
}
/** Signed webhooks fetch current Stripe payment state; return URLs never grant extras. */
export async function reconcileCreativeCheckout(owner: string, sessionId: string, stripe: Stripe) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.metadata?.nexora_catalog !== VERSION || session.metadata.nexora_owner !== owner || idOf(session.customer) !== customerFor(owner)?.customer_id) return
  if (session.status !== 'complete' || session.payment_status !== 'paid') return
  if (session.mode === 'payment' && session.metadata.nexora_kind === 'motion_topup') {
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 })
    if (items.has_more || !items.data.length) throw review()
    let scenes = 0
    for (const item of items.data) {
      const sku = (Object.keys(envNames) as Sku[]).find(key => key.endsWith(':one_time') && item.price && matchesPrice(item.price, key))
      if (!sku || !Number.isSafeInteger(item.quantity) || item.quantity! < 1) throw review()
      scenes += MOTION_PACKS.find(pack => sku.startsWith(pack.id + ':'))!.scenes * item.quantity!
    }
    if (!scenes || scenes > 50) throw review()
    const intent = idOf(session.payment_intent)
    if (!intent) throw review()
    const payment = await stripe.paymentIntents.retrieve(intent)
    if (payment.status !== 'succeeded' || idOf(payment.customer) !== idOf(session.customer)) return
    const charge = typeof payment.latest_charge === 'string' ? await stripe.charges.retrieve(payment.latest_charge) : payment.latest_charge
    if (!charge) throw review()
    if (charge.refunded) return
    const paidAt = charge.created
    transaction(() => {
      if (getRecord(owner, 'creative_refund', intent)) return
      if (!getRecord<TopUp>(owner, 'creative_topup', session.id)) saveRecord(owner, 'creative_topup', session.id, { id: session.id, scenes, consumed: 0, expiresAt: new Date((paidAt + 30 * 86400) * 1000).toISOString(), paymentIntent: intent, refunded: false } satisfies TopUp)
    })
  }
  if (session.metadata.nexora_intent) database().prepare('UPDATE billing_customers SET checkout_key=NULL,checkout_plan=NULL,checkout_expires=NULL WHERE owner_id=? AND checkout_key=?').run(owner, session.metadata.nexora_intent)
}
export function recordCreativeRefund(owner: string, charge: Stripe.Charge) {
  if (!charge.refunded) return
  transaction(() => {
    const intent = idOf(charge.payment_intent)
    if (intent) saveRecord(owner, 'creative_refund', intent, { refunded: true })
    for (const grant of listRecords<TopUp>(owner, 'creative_topup')) {
      if (grant.paymentIntent === intent) saveRecord(owner, 'creative_topup', grant.id, { ...grant, refunded: true })
    }
  })
}
