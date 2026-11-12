import Stripe from 'stripe'
import { database, getRecord, saveRecord, transaction } from './database'
import { HttpError } from './errors'

export interface BillingCustomer {
  owner_id: string; customer_id: string; revision: number; applied_revision: number
  checkout_key: string | null; checkout_plan: string | null; checkout_expires: number | null
}
export function customerFor(owner: string) {
  return database().prepare('SELECT * FROM billing_customers WHERE owner_id=?').get(owner) as BillingCustomer | undefined
}
export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) throw new HttpError(503, 'BILLING_UNAVAILABLE', 'Billing is not configured. You have not been charged.')
  return new Stripe(key, { maxNetworkRetries: 0, timeout: 20_000 })
}
export function billingOrigin() {
  try {
    const url = new URL(process.env.APP_ORIGIN || '')
    if (url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password) return url.origin
  } catch {}
  throw new HttpError(503, 'BILLING_UNAVAILABLE', 'Billing is not configured yet.')
}
export function checkoutIntent(owner: string, selection: string) {
  return transaction(() => {
    const saved = customerFor(owner)!
    if (saved.checkout_key && saved.checkout_expires! > Date.now()) {
      if (saved.checkout_plan !== selection) throw new HttpError(409, 'CHECKOUT_PENDING', 'Another checkout is open. Finish it or wait 31 minutes before changing your selection.')
      return { key: saved.checkout_key, expires: saved.checkout_expires! }
    }
    const next = { key: crypto.randomUUID(), expires: Math.floor(Date.now() / 1000 + 31 * 60) * 1000 }
    database().prepare('UPDATE billing_customers SET checkout_key=?,checkout_plan=?,checkout_expires=? WHERE owner_id=?').run(next.key, selection, next.expires, owner)
    return next
  })
}
/** Serialize account changes across tabs; never hold a SQLite transaction over network I/O. */
export async function withBillingLock<T>(owner: string, operation: () => Promise<T>): Promise<T> {
  const token = crypto.randomUUID()
  transaction(() => {
    const old = getRecord<{ expires: number }>(owner, 'billing_lock', 'current')
    if (old && old.expires > Date.now()) throw new HttpError(409, 'BILLING_BUSY', 'A billing change is in progress. Refresh before trying again.')
    saveRecord(owner, 'billing_lock', 'current', { token, expires: Date.now() + 5 * 60_000 })
  })
  try { return await operation() }
  finally {
    transaction(() => {
      if (getRecord<{ token: string }>(owner, 'billing_lock', 'current')?.token === token) {
        database().prepare("DELETE FROM records WHERE owner_id=? AND kind='billing_lock' AND id='current'").run(owner)
      }
    })
  }
}
