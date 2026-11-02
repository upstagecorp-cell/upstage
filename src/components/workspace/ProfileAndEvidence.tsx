'use client'

import { useState, type FormEvent } from 'react'
import type { BusinessProfile, Evidence, MetricName } from '@/lib/business/types'
import { currencyDecimals, formatMetric, parseMoneyToMinor } from '@/lib/business/format'
import { formatDateKey, getLocalDateKey } from '@/lib/date-time'
import { metricContext } from '@/lib/business/industry'
import { buttonClass, Card, DateInput, Empty, ErrorText, Field, fieldClass, isMoneyMetric, labelFor, metrics, type Mutation } from './shared'

export { ProfileWizard as ProfileEditor } from './GuidedProfile'

export function EvidenceEditor({ profile, evidence, mutate, busy }: { profile: BusinessProfile; evidence: Evidence[]; mutate: Mutation; busy: boolean }) {
  const [metric, setMetric] = useState<MetricName>('visitors')
  const [value, setValue] = useState('')
  const [currency, setCurrency] = useState(profile.currency)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [sourceNote, setSourceNote] = useState('')
  const [error, setError] = useState('')
  const money = isMoneyMetric(metric)
  const today = getLocalDateKey(new Date(), profile.timeZone)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    let parsed: number | null = null
    try { parsed = money ? parseMoneyToMinor(value, currency) : /^\d+$/.test(value.trim()) ? Number(value) : null } catch { /* handled by validation below */ }
    if (parsed === null || !Number.isSafeInteger(parsed) || parsed < 0) { setError(money ? 'Enter a nonnegative amount using the selected currency’s decimal places.' : 'Enter a whole number, including 0 when you measured zero.'); return }
    if (periodEnd < periodStart) { setError('The end date must be on or after the start date.'); return }
    const result = await mutate('/api/evidence', 'POST', { metric, value: parsed, unit: money ? 'minor' : 'count', currency: money ? currency : null, periodStart, periodEnd, source: 'manual', sourceNote }, 'Evidence saved. Select it for your next assessment.')
    if (result) setValue('')
  }

  return <div className="space-y-6">
    <Card title="Business evidence" description="Add measurements with their period and source. Missing information stays missing; 0 is a measured value.">
      <p className="mb-4 rounded-xl bg-[var(--surface-muted)] p-4 text-xs leading-relaxed">{metricContext(metric,profile)}</p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Metric"><select className={fieldClass} value={metric} onChange={e => { setMetric(e.target.value as MetricName); setValue('') }}>{metrics.map(item => <option key={item} value={item}>{labelFor(item)}</option>)}</select></Field>
          <Field label={money ? 'Amount (major currency units)' : 'Count'} hint={money ? 'Enter dollars for USD, not cents. We store integer minor units.' : 'Leave unknown measurements unsaved. Enter 0 only if measured.'}><input className={fieldClass} required type="text" inputMode={money ? 'decimal' : 'numeric'} maxLength={30} value={value} onChange={e => setValue(e.target.value)} placeholder={money ? 'e.g., 1250.50' : 'e.g., 250'} /></Field>
          {money && <Field label="Currency"><input className={fieldClass} required pattern="[A-Z]{3}" maxLength={3} value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())} /></Field>}
          <Field label="Period start" hint="YYYY-MM-DD"><DateInput max={today} value={periodStart} onChange={setPeriodStart} /></Field>
          <Field label="Period end (inclusive)" hint="YYYY-MM-DD"><DateInput min={periodStart || undefined} max={today} value={periodEnd} onChange={setPeriodEnd} /></Field>
        </div>
        <Field label="Source description" hint="Manual entry. For example, your analytics report or bookkeeping export."><input className={fieldClass} required maxLength={1000} value={sourceNote} onChange={e => setSourceNote(e.target.value)} /></Field>
        <ErrorText error={error} />
        <button className={buttonClass} disabled={busy}>{busy ? 'Saving…' : 'Save evidence'}</button>
      </form>
    </Card>
    <Card title="Saved evidence">
      {evidence.length ? <div className="space-y-3">{[...evidence].reverse().map(item => <EvidenceLine key={item.id} item={item} />)}</div> : <Empty>No evidence yet. You can run a limited assessment now, or add measurements first.</Empty>}
    </Card>
  </div>
}

export function EvidenceLine({ item }: { item: Evidence }) {
  return <div className="min-w-0 rounded-xl bg-[var(--surface-muted)] p-3 text-sm">
    <div className="flex flex-wrap items-baseline justify-between gap-2"><strong>{labelFor(item.metric)}</strong><span className="font-semibold tabular-nums">{formatMetric(item.value, item.unit, item.currency, 'en-US')}</span></div>
    <p className="mt-1 text-xs opacity-65">{formatDateKey(item.periodStart, 'en-US')} – {formatDateKey(item.periodEnd, 'en-US')} · {item.unit === 'count' ? 'count' : `integer minor units (${currencyDecimals(item.currency ?? 'USD')} decimal places)`}</p>
    <p className="mt-1 break-words text-xs opacity-65">Manual source: {item.sourceNote}</p>
  </div>
}
