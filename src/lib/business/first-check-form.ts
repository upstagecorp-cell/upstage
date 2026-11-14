import type { BusinessGoal, MetricName } from './types'
import { parseFirstCheck, type FirstCheck } from './first-check'
import { currencyDecimals, parseMoneyToMinor } from './format'

export function firstCheckMetricPair(goal: BusinessGoal): MetricName[] {
  return goal === 'profitability' || goal === 'operations' ? ['revenue', 'cost']
    : goal === 'retention' ? ['customers', 'returningCustomers'] : ['visitors', 'purchases']
}

/** Reselecting a focus is a no-op; changing it does not discard measured records. */
export function changeFirstCheckFocus(check: FirstCheck, focus: BusinessGoal): FirstCheck {
  return focus === check.focus ? check : { ...check, focus }
}

export interface MeasurementDraft {
  value: string
  periodStart: string
  periodEnd: string
  sourceNote: string
  currency: string
}
export interface FirstCheckNumbersDraft {
  records: Partial<Record<MetricName, MeasurementDraft>>
  separateMetadata: boolean
}

function editableValue(value: number, currency: string | null): string {
  if (!currency) return String(value)
  const places = currencyDecimals(currency)
  if (!places) return String(value)
  // String slicing keeps even large safe integers exact; floating point division
  // and formatting could change the recorded amount on a no-op save.
  const digits = String(value).padStart(places + 1, '0')
  return `${digits.slice(0, -places)}.${digits.slice(-places)}`
}

export function restoreFirstCheckNumbers(check: FirstCheck): FirstCheckNumbersDraft {
  const pair = firstCheckMetricPair(check.focus)
  const evidence = check.evidence.filter(item => pair.includes(item.metric))
  const first = evidence[0]
  const separateMetadata = evidence.some(item => first && (
    item.periodStart !== first.periodStart || item.periodEnd !== first.periodEnd ||
    item.source !== first.source || item.sourceNote !== first.sourceNote || item.currency !== first.currency
  ))
  const records: FirstCheckNumbersDraft['records'] = {}
  for (const metric of pair) {
    const item = evidence.find(row => row.metric === metric)
    const context = item ?? first
    records[metric] = {
      value: item ? editableValue(item.value, item.currency) : '',
      periodStart: context?.periodStart ?? '',
      periodEnd: context?.periodEnd ?? '',
      sourceNote: context?.sourceNote ?? '',
      currency: context?.currency ?? 'USD',
    }
  }
  return { records, separateMetadata }
}

/** Replace only the visible metrics, leaving other focus records and context intact. */
export function saveFirstCheckNumbers(check: FirstCheck, draft: FirstCheckNumbersDraft, today: string): FirstCheck['evidence'] {
  const pair = firstCheckMetricPair(check.focus)
  const updates = new Map<MetricName, FirstCheck['evidence'][number]>()
  for (const metric of pair) {
    const record = draft.records[metric]
    const text = record?.value.trim()
    if (!record || !text) continue
    const money = metric === 'revenue' || metric === 'cost'
    const value = money ? parseMoneyToMinor(text, record.currency) : /^\d+$/.test(text) ? Number(text) : NaN
    if (value === null || !Number.isSafeInteger(value) || value < 0) {
      throw new Error('Enter a measured nonnegative value. Leave unknown values blank.')
    }
    if (record.periodEnd > today) throw new Error('Choose a completed reporting period in your time zone.')
    updates.set(metric, {
      metric, value, unit: money ? 'minor' : 'count', currency: money ? record.currency : null,
      periodStart: record.periodStart, periodEnd: record.periodEnd, source: 'manual', sourceNote: record.sourceNote,
    })
  }
  // Keep saved ordering stable as well as every record outside this form's pair.
  const evidence = check.evidence.flatMap(item => {
    if (!pair.includes(item.metric)) return [item]
    const replacement = updates.get(item.metric)
    updates.delete(item.metric)
    return replacement ? [replacement] : []
  })
  evidence.push(...updates.values())
  return parseFirstCheck({ ...check, evidence }).evidence
}
