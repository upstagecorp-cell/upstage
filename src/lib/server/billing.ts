import Stripe from 'stripe'
import type { SessionUser, ExecutionJob, Assessment, BusinessProfile } from '@/lib/business/types'
import { missingGenerationFields } from '@/lib/business/industry'
import { PAID_PLANS, isPaidPlan, type PaidPlanId, type BillingSummary } from '@/lib/billing/plans'
import { database, generationConfigured, getRecord, listRecords, saveRecord, transaction } from './database'
import { HttpError, objectInput } from './errors'
import { creativeOfferIsPreview } from '@/lib/marketing/creative-plans'

interface SubscriptionState {
  id: string; plan: PaidPlanId | null; status: string; paid: boolean
  periodStart: string | null; periodEnd: string | null; cancelAtPeriodEnd: boolean
}
interface CustomerRow { owner_id: string; customer_id: string; revision: number; applied_revision: number; checkout_key: string | null; checkout_plan: string | null; checkout_expires: number | null }
function priceId(plan: PaidPlanId) { return process.env[plan === 'focus' ? 'STRIPE_PRICE_FOCUS' : 'STRIPE_PRICE_GROWTH']?.trim() || '' }
export function paidCheckoutAvailable(): boolean {
  if (creativeOfferIsPreview()) return false
  if (process.env.NODE_ENV === 'production' && !/^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY?.trim() || '')) return false
  return process.env.NEXORA_PAID_LAUNCH_ENABLED === 'true' && process.env.NEXORA_LEGAL_APPROVED === 'true' && process.env.NEXORA_LIVE_TESTS_APPROVED === 'true' && generationConfigured() &&
    Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_WEBHOOK_SECRET?.trim() && priceId('focus') && priceId('growth') &&
      process.env.STRIPE_PORTAL_CONFIGURATION?.trim() && process.env.NEXORA_LEGAL_NAME?.trim() && process.env.NEXORA_LEGAL_ADDRESS?.trim() &&
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() && process.env.APP_ORIGIN?.startsWith('https://') && process.env.RESEND_API_KEY?.trim() && process.env.NEXORA_EMAIL_FROM?.trim())
}
export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) throw new HttpError(503, 'BILLING_UNAVAILABLE', 'Subscriptions are not open yet. You have not been charged.')
  return new Stripe(key, { maxNetworkRetries: 0, timeout: 20_000 })
}
function customerFor(owner: string): CustomerRow | undefined {
  return database().prepare('SELECT * FROM billing_customers WHERE owner_id=?').get(owner) as CustomerRow | undefined
}
export function billingSummary(owner: string): BillingSummary {
  const saved = getRecord<SubscriptionState>(owner, 'billing', 'current')
  const active = saved?.plan && saved.status === 'active' && saved.paid && saved.periodStart && saved.periodEnd &&
    Date.parse(saved.periodStart) <= Date.now() && Date.parse(saved.periodEnd) > Date.now()
  const plan = active ? saved.plan! : 'free'
  const allowance = plan === 'free' ? null : PAID_PLANS[plan]
  const used = active ? listRecords<ExecutionJob>(owner, 'job').filter(job =>
    job.status !== 'failed' && Date.parse(job.createdAt) >= Date.parse(saved.periodStart!) && Date.parse(job.createdAt) < Date.parse(saved.periodEnd!)).length : 0
  return { plan, status: saved?.status || 'free', packagesUsed: used, packagesLimit: allowance?.packages ?? 0,
    assetsPerPackage: allowance?.assetsPerPackage ?? 0, periodEnd: saved?.periodEnd ?? null,
    cancelAtPeriodEnd: saved?.cancelAtPeriodEnd ?? false, checkoutAvailable: paidCheckoutAvailable(), portalAvailable: Boolean(customerFor(owner) && process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_PORTAL_CONFIGURATION?.trim()), emailVerified: Boolean(getRecord(owner, 'email_verified', 'current')) }
}
/** Called inside the same write transaction that reserves the generation job. */
export function requireGenerationAllowance(owner: string, assets: number): void {
  const billing = billingSummary(owner)
  if (billing.plan === 'free') throw new HttpError(402, 'SUBSCRIPTION_REQUIRED', 'Choose a paid plan to generate text packages. Your saved work stays available.')
  if (assets > billing.assetsPerPackage) throw new HttpError(422, 'PACKAGE_TOO_LARGE', `Your plan includes up to ${billing.assetsPerPackage} text assets in each package. Reduce the quantities before generating.`)
  if (billing.packagesUsed >= billing.packagesLimit) throw new HttpError(402, 'PACKAGE_LIMIT_REACHED', 'You have used the packages included in this billing period. No overage will be charged. You can still edit, approve, and export saved work.')
  const saved = getRecord<SubscriptionState>(owner, 'billing', 'current')!
  const attempts = listRecords<ExecutionJob>(owner, 'job').filter(job => Date.parse(job.createdAt) >= Date.parse(saved.periodStart!) && Date.parse(job.createdAt) < Date.parse(saved.periodEnd!)).length
  if (attempts >= billing.packagesLimit * 3) throw new HttpError(429, 'GENERATION_SAFETY_LIMIT', 'Generation is temporarily paused after repeated attempts. Failed requests have not used your package allowance. Please contact support before trying again.')
  const daily = database().prepare("SELECT count(*) AS n FROM records WHERE kind='job' AND created_at>=?").get(new Date().toISOString().slice(0,10)+'T00:00:00.000Z') as { n: number }
  const configured = Number(process.env.NEXORA_DAILY_GENERATION_LIMIT)
  const ceiling = Number.isInteger(configured) && configured >= 1 && configured <= 10000 ? configured : 500
  if (daily.n >= ceiling) throw new HttpError(429, 'GENERATION_SERVICE_LIMIT', 'Generation is temporarily paused while the service checks its daily usage budget. Your saved work remains available. Please try again later or contact support.')
}
function origin() {
  const value = process.env.APP_ORIGIN
  if (!value) throw new HttpError(503, 'BILLING_UNAVAILABLE', 'Billing is not configured yet.')
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.pathname !== '/') throw new HttpError(503, 'BILLING_UNAVAILABLE', 'Billing is not configured yet.')
  return url.origin
}
function idOf(value: string | { id: string } | null): string | null { return typeof value === 'string' ? value : value?.id ?? null }
function catalogPlan(price: Stripe.Price): PaidPlanId | null {
  const plan = (Object.keys(PAID_PLANS) as PaidPlanId[]).find(id => priceId(id) === price.id)
  return plan && price.currency === 'usd' && price.unit_amount === PAID_PLANS[plan].monthlyUsd * 100 &&
    price.recurring?.interval === 'month' && price.recurring.interval_count === 1 && price.tax_behavior === 'exclusive' ? plan : null
}
/** Retrieve current provider state instead of applying potentially out-of-order event payloads. */
export async function syncBilling(owner: string, providedStripe?: Stripe): Promise<void> {
  const row = customerFor(owner)
  if (!row) return
  const stripe = providedStripe ?? stripeClient()
  const revision = transaction(() => {
    database().prepare('UPDATE billing_customers SET revision=revision+1 WHERE owner_id=?').run(owner)
    return customerFor(owner)!.revision
  })
  const subscriptions = await stripe.subscriptions.list({ customer: row.customer_id, status: 'all', limit: 100, expand: ['data.latest_invoice'] })
  if (subscriptions.has_more) throw new HttpError(503, 'BILLING_REVIEW_REQUIRED', 'Billing needs an operator review. Please contact support.')
  const ordered = [...subscriptions.data].sort((a, b) => b.created - a.created)
  const subscription = ordered.find(item => ['active', 'past_due', 'unpaid', 'trialing', 'incomplete', 'paused'].includes(item.status)) ?? ordered[0]
  const item = subscription?.items.data[0]
  const invoice = subscription?.latest_invoice
  const start = item?.current_period_start, end = item?.current_period_end
  const state: SubscriptionState = {
    id: subscription?.id ?? '', plan: item && subscription!.items.data.length === 1 && item.quantity === 1 ? catalogPlan(item.price) : null,
    status: subscription?.status ?? 'free', paid: Boolean(invoice && typeof invoice !== 'string' && invoice.status === 'paid'),
    periodStart: start ? new Date(start * 1000).toISOString() : null,
    periodEnd: end ? new Date(end * 1000).toISOString() : null, cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
  }
  transaction(() => {
    if (customerFor(owner)!.applied_revision > revision) return
    saveRecord(owner, 'billing', 'current', state)
    database().prepare('UPDATE billing_customers SET applied_revision=? WHERE owner_id=?').run(revision, owner)
  })
}
export async function createCheckout(user: SessionUser, raw: unknown): Promise<string> {
  const input = objectInput(raw)
  if (!isPaidPlan(input.plan)) throw new HttpError(400, 'INVALID_PLAN', 'Choose a valid plan.')
  if (!paidCheckoutAvailable()) throw new HttpError(503, 'BILLING_UNAVAILABLE', 'Paid subscriptions are not open yet. You have not been charged.')
  if (!database().prepare('SELECT 1 FROM records WHERE owner_id=? AND kind=? AND id=?').get(user.id, 'email_verified', 'current')) throw new HttpError(403, 'EMAIL_VERIFICATION_REQUIRED', 'Verify your email in Plan & billing before subscribing.')
  const profile = getRecord<BusinessProfile>(user.id, 'profile', 'current')
  const assessment = listRecords<Assessment>(user.id, 'assessment').at(-1)
  if (!profile || missingGenerationFields(profile).length || !assessment || assessment.profileVersion !== profile.version || !assessment.recommendedActions.some(action => action.kind === 'marketing_assets')) {
    throw new HttpError(422, 'WORKSPACE_SETUP_REQUIRED', 'Before buying, complete your business details and run a business check with a marketing recommendation. If your priority is cost or operations work, continue with the free workflow.')
  }
  const stripe = stripeClient(), plan = input.plan
  const price = await stripe.prices.retrieve(priceId(plan))
  if (!price.active || catalogPlan(price) !== plan) throw new HttpError(503, 'BILLING_CATALOG_MISMATCH', 'This plan is not available for purchase. You have not been charged.')
  let row = customerFor(user.id)
  if (!row) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { nexora_owner: user.id } }, { idempotencyKey: `nexora-customer-${user.id}` })
    transaction(() => database().prepare('INSERT OR IGNORE INTO billing_customers(owner_id,customer_id) VALUES(?,?)').run(user.id, customer.id))
    row = customerFor(user.id)!
  }
  const existing = await stripe.subscriptions.list({ customer: row.customer_id, status: 'all', limit: 100 })
  if (existing.has_more || existing.data.some(item => !['canceled', 'incomplete_expired'].includes(item.status))) throw new HttpError(409, 'SUBSCRIPTION_EXISTS', 'You already have a subscription or payment in progress. Open Manage billing instead of subscribing again.')
  const intent = transaction(() => {
    const saved = customerFor(user.id)!
    if (saved.checkout_key && saved.checkout_expires! > Date.now()) {
      if (saved.checkout_plan !== plan) throw new HttpError(409, 'CHECKOUT_PENDING', 'A checkout for another plan is already open. Finish or wait 30 minutes before choosing another plan.')
      return { key: saved.checkout_key, expires: saved.checkout_expires! }
    }
    const next = { key: crypto.randomUUID(), expires: Math.floor(Date.now() / 1000 + 31 * 60) * 1000 }
    database().prepare('UPDATE billing_customers SET checkout_key=?,checkout_plan=?,checkout_expires=? WHERE owner_id=?').run(next.key, plan, next.expires, user.id)
    return next
  })
  const session = await stripe.checkout.sessions.create({
    customer: row.customer_id, mode: 'subscription', client_reference_id: user.id,
    line_items: [{ price: price.id, quantity: 1 }], automatic_tax: { enabled: true },
    billing_address_collection: 'required', customer_update: { address: 'auto', name: 'auto' },
    tax_id_collection: { enabled: true }, consent_collection: { terms_of_service: 'required' },
    subscription_data: { metadata: { nexora_owner: user.id, nexora_plan: plan } },
    success_url: `${origin()}/workspace?billing=return#billing`, cancel_url: `${origin()}/pricing?checkout=canceled`,
    expires_at: intent.expires / 1000,
  }, { idempotencyKey: `nexora-checkout-${intent.key}` })
  if (!session.url) throw new HttpError(502, 'BILLING_UNAVAILABLE', 'Checkout could not be opened. Check your billing page before trying again.')
  return session.url
}
export async function createPortal(owner: string): Promise<string> {
  const customer = customerFor(owner)
  if (!customer) throw new HttpError(404, 'BILLING_NOT_FOUND', 'No billing account is connected yet.')
  const session = await stripeClient().billingPortal.sessions.create({ customer: customer.customer_id,
    configuration: process.env.STRIPE_PORTAL_CONFIGURATION, return_url: `${origin()}/workspace#billing` })
  return session.url
}
export async function handleBillingWebhook(body: string, signature: string): Promise<void> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new HttpError(503, 'BILLING_UNAVAILABLE', 'Billing is not configured.')
  const stripe = stripeClient()
  let event: Stripe.Event
  try { event = stripe.webhooks.constructEvent(body, signature, secret, 300) }
  catch { throw new HttpError(400, 'INVALID_SIGNATURE', 'Invalid webhook signature.') }
  if (database().prepare('SELECT 1 FROM billing_events WHERE id=?').get(event.id)) return
  const relevant = event.type.startsWith('customer.subscription.') || event.type.startsWith('invoice.') || event.type === 'checkout.session.completed'
  if (relevant) {
    const object = event.data.object as unknown as { customer: string | { id: string } | null }
    const customer = idOf(object.customer)
    const row = customer ? database().prepare('SELECT owner_id FROM billing_customers WHERE customer_id=?').get(customer) as { owner_id: string } | undefined : undefined
    if (row) await syncBilling(row.owner_id, stripe)
  }
  database().prepare('INSERT OR IGNORE INTO billing_events(id,processed_at) VALUES(?,?)').run(event.id, new Date().toISOString())
}
