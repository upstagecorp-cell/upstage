import { describe, expect, it } from 'vitest'
import { changeFirstCheckFocus, firstCheckMetricPair, restoreFirstCheckNumbers, saveFirstCheckNumbers } from './first-check-form'
import { firstCheckProfile, type FirstCheck } from './first-check'
import { createAssessment } from './assessment'
import type { EvidenceInput } from './types'

const today = '2026-11-13'
function measurement(metric: EvidenceInput['metric'], value: number, overrides: Partial<EvidenceInput> = {}): EvidenceInput {
  const money = ['revenue', 'cost', 'adSpend'].includes(metric)
  return { metric, value, unit: money ? 'minor' : 'count', currency: money ? 'USD' : null,
    periodStart: '2026-10-01', periodEnd: '2026-10-07', source: 'manual', sourceNote: 'My store report', ...overrides }
}
function check(evidence: EvidenceInput[] = [], focus: FirstCheck['focus'] = 'profitability'): FirstCheck {
  return { version: 1, id: 'first_check_01', focus, businessType: 'retail', stage: 'operating', offering: 'Local goods', timeZone: 'America/New_York', evidence }
}

describe('first-check number drafts', () => {
  it.each([
    ['awareness', ['visitors', 'purchases']], ['conversion', ['visitors', 'purchases']],
    ['profitability', ['revenue', 'cost']], ['operations', ['revenue', 'cost']],
    ['retention', ['customers', 'returningCustomers']],
  ] as const)('keeps the existing metric pair for %s', (focus, pair) => {
    expect(firstCheckMetricPair(focus)).toEqual(pair)
  })

  it('restores measured values, zero, period, source, and currency instead of empty inputs', () => {
    const saved = check([measurement('revenue', 1999), measurement('cost', 0)])
    const draft = restoreFirstCheckNumbers(saved)
    expect(draft.separateMetadata).toBe(false)
    expect(draft.records.revenue).toEqual({ value: '19.99', periodStart: '2026-10-01', periodEnd: '2026-10-07', sourceNote: 'My store report', currency: 'USD' })
    expect(draft.records.cost?.value).toBe('0.00')
    expect(saveFirstCheckNumbers(saved, draft, today)).toEqual(saved.evidence)
  })

  it.each([
    ['USD', 12345, '123.45'], ['JPY', 12345, '12345'], ['KRW', 0, '0'],
    ['BHD', 12345, '12.345'], ['USD', 1, '0.01'], ['BHD', 1, '0.001'],
    ['USD', Number.MAX_SAFE_INTEGER, '90071992547409.91'],
  ])('round-trips %s %i in exact major units', (currency, value, text) => {
    const saved = check([measurement('revenue', value, { currency: String(currency) })])
    const draft = restoreFirstCheckNumbers(saved)
    expect(draft.records.revenue?.value).toBe(text)
    expect(saveFirstCheckNumbers(saved, draft, today)).toEqual(saved.evidence)
  })

  it('restores count zero but leaves an unknown second measurement blank', () => {
    const saved = check([measurement('visitors', 0)], 'awareness')
    const draft = restoreFirstCheckNumbers(saved)
    expect(draft.records.visitors?.value).toBe('0')
    expect(draft.records.purchases?.value).toBe('')
    expect(saveFirstCheckNumbers(saved, draft, today)).toEqual(saved.evidence)
  })

  it('does not invent values or borrow context from an unrelated focus', () => {
    const saved = check([measurement('visitors', 100)])
    const draft = restoreFirstCheckNumbers(saved)
    expect(draft.records.revenue).toEqual({ value: '', periodStart: '', periodEnd: '', sourceNote: '', currency: 'USD' })
    expect(saveFirstCheckNumbers(saved, draft, today)).toEqual(saved.evidence)
  })

  it('changes one visible value without overwriting its partner or other metrics', () => {
    const saved = check([measurement('visitors', 100), measurement('revenue', 10000), measurement('cost', 5000), measurement('adSpend', 2000)])
    const draft = restoreFirstCheckNumbers(saved)
    draft.records.revenue!.value = '110.00'
    const result = saveFirstCheckNumbers(saved, draft, today)
    expect(result).toEqual(saved.evidence.map(item => item.metric === 'revenue' ? { ...item, value: 11000 } : item))
    expect(saved.evidence[1].value).toBe(10000)
  })

  it('explicitly blanking a measured value removes only that metric', () => {
    const saved = check([measurement('revenue', 10000), measurement('cost', 5000), measurement('customers', 0)])
    const draft = restoreFirstCheckNumbers(saved)
    draft.records.revenue!.value = ' '
    expect(saveFirstCheckNumbers(saved, draft, today)).toEqual(saved.evidence.slice(1))
  })

  it.each([
    { periodStart: '2026-10-08', periodEnd: '2026-10-14' },
    { sourceNote: 'A different channel report' },
    { currency: 'KRW' },
  ])('restores separate context rather than combining incompatible records: %j', overrides => {
    const saved = check([measurement('revenue', 10000), measurement('cost', 5000, overrides)])
    const draft = restoreFirstCheckNumbers(saved)
    expect(draft.separateMetadata).toBe(true)
    expect(draft.records.cost?.periodStart).toBe(overrides.periodStart ?? '2026-10-01')
    expect(draft.records.cost?.sourceNote).toBe(overrides.sourceNote ?? 'My store report')
    expect(draft.records.cost?.currency).toBe(overrides.currency ?? 'USD')
    expect(saveFirstCheckNumbers(saved, draft, today)).toEqual(saved.evidence)
  })

  it('keeps assessment rules from comparing incompatible periods or currencies after a save', () => {
    const saved = check([
      measurement('revenue', 10000), measurement('cost', 15000, { currency: 'KRW' }),
      measurement('visitors', 100), measurement('purchases', 10, { periodEnd: '2026-10-14' }),
    ])
    const evidence = saveFirstCheckNumbers(saved, restoreFirstCheckNumbers(saved), today)
    const profile = { ...firstCheckProfile(saved), id: saved.id, version: 1, updatedAt: '2026-11-13T00:00:00Z' }
    const assessment = createAssessment(profile, evidence.map((item, index) => ({ ...item, id: `ev_${index}`, profileId: saved.id, recordedAt: '2026-11-13T00:00:00Z' })))
    expect(assessment.facts.some(item => item.description.includes('Revenue minus'))).toBe(false)
    expect(assessment.facts.some(item => item.description.includes('conversion:'))).toBe(false)
  })

  it('does not normalize another metric’s metadata while editing a separate record', () => {
    const saved = check([measurement('revenue', 10000), measurement('cost', 5000, { periodEnd: '2026-10-08', sourceNote: 'Cost ledger', currency: 'EUR' })])
    const draft = restoreFirstCheckNumbers(saved)
    draft.records.revenue!.value = '120'
    expect(saveFirstCheckNumbers(saved, draft, today)[1]).toEqual(saved.evidence[1])
  })

  it('continues rejecting invalid amounts, unsupported precision, and incomplete/future periods', () => {
    const saved = check([measurement('revenue', 10000)])
    for (const value of ['-1', 'abc', '1.005', '9007199254740992']) {
      const draft = restoreFirstCheckNumbers(saved)
      draft.records.revenue!.value = value
      expect(() => saveFirstCheckNumbers(saved, draft, today)).toThrow()
    }
    const future = restoreFirstCheckNumbers(saved)
    future.records.revenue!.periodEnd = '2026-11-14'
    expect(() => saveFirstCheckNumbers(saved, future, today)).toThrow('completed')
    const missing = restoreFirstCheckNumbers(saved)
    missing.records.revenue!.periodStart = ''
    expect(() => saveFirstCheckNumbers(saved, missing, today)).toThrow('valid start and end')
  })
})

describe('first-check focus changes', () => {
  it('treats the same focus as an identity-preserving no-op', () => {
    const saved = check([measurement('revenue', 0)])
    expect(changeFirstCheckFocus(saved, saved.focus)).toBe(saved)
  })

  it('preserves every measured record and its context on a real change and back', () => {
    const saved = check([measurement('revenue', 10000), measurement('cost', 0), measurement('visitors', 100)])
    const changed = changeFirstCheckFocus(saved, 'awareness')
    expect(changed.focus).toBe('awareness')
    expect(changed.evidence).toBe(saved.evidence)
    expect(changeFirstCheckFocus(changed, saved.focus)).toEqual(saved)
    expect(saveFirstCheckNumbers(changed, restoreFirstCheckNumbers(changed), today)).toEqual(saved.evidence)
  })
})
