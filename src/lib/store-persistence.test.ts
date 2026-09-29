import { describe, expect, it } from 'vitest'
import { sanitizePersistedState } from '@/lib/store-persistence'

describe('sanitizePersistedState', () => {
  it('clamps scores and drops malformed records', () => {
    const state = sanitizePersistedState({
      industry: 'restaurant',
      stage: 'operating',
      operationType: 'hall',
      diagnosisCompleted: true,
      scores: { main_customer: 999, review_rating: -20 },
      answers: { valid: 4, invalid: 20 },
      executionRecords: [
        {
          id: 'rec_1',
          action_id: 'action_1',
          execution_date: '2026-09-29',
          time_spent: '10분',
          difficulty_note: '',
          result_memo: 'done',
        },
        { id: 'bad', action_id: 'action_2', execution_date: 'not-a-date' },
      ],
    })

    expect(state.scores.main_customer).toBe(100)
    expect(state.scores.review_rating).toBe(0)
    expect(state.answers).toEqual({ valid: 4 })
    expect(state.executionRecords).toHaveLength(1)
  })

  it('repairs duplicate persisted record ids', () => {
    const record = {
      id: 'rec_1',
      action_id: 'action_1',
      execution_date: '2026-09-29',
      time_spent: '10분',
      difficulty_note: '',
      result_memo: 'done',
    }
    const state = sanitizePersistedState({ executionRecords: [record, record] })

    expect(new Set(state.executionRecords.map((item) => item.id)).size).toBe(2)
  })

  it('clears an inconsistent completed diagnosis', () => {
    const state = sanitizePersistedState({
      industry: 'restaurant',
      stage: 'operating',
      operationType: null,
      diagnosisCompleted: true,
    })

    expect(state.diagnosisCompleted).toBe(false)
  })
})
