'use client'

import type { ReactNode } from 'react'
import type { AppLocale, AssessmentArea, AssetKind, BusinessGoal, MetricName, WorkspaceData } from '@/lib/business/types'
import { isDateKey } from '@/lib/date-time'

export const fieldClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:opacity-60'
export const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-50'
export const secondaryClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium transition hover:border-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-50'
export type Mutation = (path: string, method: 'POST' | 'PUT', body: unknown, success: string) => Promise<WorkspaceData | null>

export function Card({ title, children, description, className = '' }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7 ${className}`}>
    {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
    {description && <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/65">{description}</p>}
    <div className={title || description ? 'mt-5' : ''}>{children}</div>
  </section>
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium">
    <span>{label}</span>{children}
    {hint && <span className="block text-xs font-normal leading-relaxed text-[var(--foreground)]/60">{hint}</span>}
  </label>
}

// Browser-owned date widgets can show Korean labels despite the document locale.
// Explicit ISO inputs keep the product English and avoid ambiguous local/DST times.
export function DateInput({ value, onChange, min, max }: { value: string; onChange: (value: string) => void; min?: string; max?: string }) {
  return <input className={fieldClass} type="text" lang="en-US" required maxLength={10} placeholder="YYYY-MM-DD" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}" value={value} onChange={event => {
    const next = event.target.value
    const error = !next ? '' : !isDateKey(next) ? 'Enter a valid date as YYYY-MM-DD.' : min && next < min ? `Enter ${min} or a later date.` : max && next > max ? `Enter ${max} or an earlier date.` : ''
    event.target.setCustomValidity(error)
    onChange(next)
  }} />
}

export function UtcDateTimeInput({ value, onChange, min }: { value: string; onChange: (value: string) => void; min?: string }) {
  return <input className={`${fieldClass} font-mono`} type="text" lang="en-US" required maxLength={23} placeholder="YYYY-MM-DDTHH:MM:SS.sss" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?" value={value} onChange={event => {
    const next = event.target.value
    const instant = new Date(`${next}Z`)
    const valid = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](?:\.[0-9]{1,3})?$/.test(next) && isDateKey(next.slice(0,10)) && Number.isFinite(instant.getTime())
    const error = !next ? '' : !valid ? 'Enter a valid UTC date and time as YYYY-MM-DDTHH:MM:SS.sss.' : instant.getTime() > Date.now() ? 'Enter an actual time in the past.' : min && instant.getTime() < Date.parse(`${min}Z`) ? 'The time must be on or after the linked assessment.' : ''
    event.target.setCustomValidity(error)
    onChange(next)
  }} />
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm leading-relaxed text-[var(--foreground)]/65">{children}</p>
}

export function ErrorText({ error }: { error: string }) {
  return error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null
}

export const metrics: MetricName[] = ['visitors', 'purchases', 'revenue', 'cost', 'adSpend', 'returningCustomers', 'customers']
export const goals: BusinessGoal[] = ['awareness', 'conversion', 'retention', 'profitability', 'operations']
export function isMoneyMetric(metric: MetricName) { return ['revenue', 'cost', 'adSpend'].includes(metric) }

const labels = { visitors: 'Visitors', purchases: 'Purchases', revenue: 'Revenue', cost: 'Operating costs', adSpend: 'Ad spend', returningCustomers: 'Returning customers', customers: 'Customers', awareness: 'Reach more customers', conversion: 'Improve purchase conversion', retention: 'Increase repeat purchases', profitability: 'Improve profitability', operations: 'Improve operations', acquisition: 'Customer acquisition', hook: 'Hook', ad_copy: 'Ad copy', short_script: 'Short-form script (text)', cta: 'Call to action' }

export function labelFor(key: MetricName | BusinessGoal | AssessmentArea | AssetKind) {
  return labels[key]
}

export function timestamp(value: string, locale: AppLocale, timeZone = 'UTC') {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(new Date(value))
  } catch { return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) }
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) { super(message) }
}

export async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, { ...options, credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json', ...options?.headers }, signal: options?.signal ?? AbortSignal.timeout(150_000) })
  } catch {
    throw new ApiError('The connection was interrupted. Reload your workspace before retrying; your saved records are kept.', 0, 'NETWORK_ERROR')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(typeof data?.error === 'string' ? data.error : 'This request could not be completed. Please try again.', response.status, data?.code)
  return data as T
}

export function friendlyError(error: unknown) {
  return error instanceof Error ? error.message : 'This request could not be completed. Please try again.'
}

export function downloadJson(data: unknown, fileName: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
