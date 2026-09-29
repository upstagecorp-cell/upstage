import { describe, expect, it } from 'vitest'
import type { DiagnosisQuestion } from '@/data/types'
import { calculateIndicatorScores } from '@/lib/scoring'

const question: DiagnosisQuestion = {
  question_id: 'q1',
  category: 'main_customer',
  business_type: 'restaurant',
  question: 'test',
  answer_options: [],
  benchmark_text: { good: '', normal: '', danger: '' },
  weight: { hall: 5 },
}

describe('calculateIndicatorScores', () => {
  it('returns a complete score map for valid answers', () => {
    const scores = calculateIndicatorScores({ q1: 4 }, [question], 'hall')

    expect(scores.main_customer).toBe(80)
    expect(scores.review_rating).toBe(0)
    expect(scores.cafe_positioning).toBe(0)
  })

  it('ignores out-of-range persisted answers', () => {
    const scores = calculateIndicatorScores({ q1: 20 }, [question], 'hall')
    expect(scores.main_customer).toBe(0)
  })
})
