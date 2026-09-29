import { describe, expect, it } from 'vitest'
import type { ActionCard, ExecutionRecord } from '@/data/types'
import { isActionAvailable } from '@/lib/actions'

function createAction(overrides: Partial<ActionCard> = {}): ActionCard {
  return {
    action_id: 'test_action',
    title: 'Test action',
    difficulty: 'easy',
    expected_time: '10분',
    impact: 'medium',
    cost: 'none',
    solo_possible: true,
    repeatable: 'repeatable',
    recurrence_cycle: '월 1회',
    execution_steps: ['test'],
    success_condition: 'done',
    related_indicator: 'main_customer',
    ...overrides,
  }
}

function createRecord(date: string): ExecutionRecord {
  return {
    id: `record_${date}`,
    action_id: 'test_action',
    execution_date: date,
    time_spent: '10분',
    difficulty_note: '',
    result_memo: 'done',
    evidence: 'test',
  }
}

describe('isActionAvailable', () => {
  it('never repeats a one-time action', () => {
    const action = createAction({ repeatable: 'once', recurrence_cycle: '-' })
    expect(isActionAvailable(action, [createRecord('2026-01-01')], '2026-09-29')).toBe(false)
  })

  it('makes a daily action available on the next local date', () => {
    const action = createAction({ repeatable: 'required', recurrence_cycle: '매일' })
    expect(isActionAvailable(action, [createRecord('2026-09-29')], '2026-09-29')).toBe(false)
    expect(isActionAvailable(action, [createRecord('2026-09-28')], '2026-09-29')).toBe(true)
  })

  it('uses rolling seven-day and calendar-month recurrence windows', () => {
    const weekly = createAction({ recurrence_cycle: '주 1회' })
    const monthly = createAction({ recurrence_cycle: '월 1회' })

    expect(isActionAvailable(weekly, [createRecord('2026-09-23')], '2026-09-29')).toBe(false)
    expect(isActionAvailable(weekly, [createRecord('2026-09-22')], '2026-09-29')).toBe(true)
    expect(isActionAvailable(monthly, [createRecord('2026-09-01')], '2026-09-29')).toBe(false)
    expect(isActionAvailable(monthly, [createRecord('2026-08-31')], '2026-09-29')).toBe(true)
  })
})
