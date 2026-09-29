import { IndicatorId, OperationType, DiagnosisQuestion, ActionCard, ExecutionRecord } from '@/data/types'
import { ACTION_CARDS } from '@/data/actions'
import { INDICATOR_WEIGHTS } from '@/data/constants'
import { SCORE_ACTION_RULES } from '@/data/types'
import { differenceInCalendarDays, getLocalDateKey, isDateKey } from '@/lib/date-time'

function getQuarterKey(dateKey: string): string {
  const [year, month] = dateKey.split('-').map(Number)
  return `${year}-Q${Math.floor((month - 1) / 3) + 1}`
}

function getHalfYearKey(dateKey: string): string {
  const [year, month] = dateKey.split('-').map(Number)
  return `${year}-H${month <= 6 ? 1 : 2}`
}

function isRecordInCurrentCycle(
  recordDate: string,
  referenceDate: string,
  recurrenceCycle: string
): boolean {
  if (!isDateKey(recordDate) || !isDateKey(referenceDate)) return false

  switch (recurrenceCycle) {
    case '매일':
      return recordDate === referenceDate
    case '주 1회': {
      const days = differenceInCalendarDays(referenceDate, recordDate)
      return days >= 0 && days < 7
    }
    case '월 1회':
      return recordDate.slice(0, 7) === referenceDate.slice(0, 7)
    case '분기 1회':
      return getQuarterKey(recordDate) === getQuarterKey(referenceDate)
    case '반기 1회':
      return getHalfYearKey(recordDate) === getHalfYearKey(referenceDate)
    default:
      return true
  }
}

export function isActionAvailable(
  action: ActionCard,
  executionRecords: ExecutionRecord[],
  referenceDate: string = getLocalDateKey()
): boolean {
  const records = executionRecords.filter((record) => record.action_id === action.action_id)
  if (records.length === 0) return true
  if (action.repeatable === 'once') return false

  return !records.some((record) =>
    isRecordInCurrentCycle(record.execution_date, referenceDate, action.recurrence_cycle)
  )
}

// 점수 기반 추천 액션 결정 (PDF 공통전략 Section 11)
export function getRecommendedActions(
  scores: Record<IndicatorId, number>,
  operationType: OperationType,
  executionRecords: ExecutionRecord[] = [],
  referenceDate: string = getLocalDateKey()
): ActionCard[] {
  const weights = INDICATOR_WEIGHTS[operationType]
  const recommended: ActionCard[] = []

  // 가중치 높은 순으로 지표를 정렬
  const sortedIndicators = Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id as IndicatorId)

  for (const indicator of sortedIndicators) {
    const score = Math.min(100, Math.max(0, scores[indicator] || 0))
    const scoreLevel = Math.max(1, Math.min(5, Math.ceil(score / 20))) // 0~100 → 1~5 스케일로 변환
    const rule = SCORE_ACTION_RULES.find(r => r.score === scoreLevel) || SCORE_ACTION_RULES[4]

    if (rule.action_count === 0) continue

    const availableActions = ACTION_CARDS.filter(
      a => a.related_indicator === indicator && isActionAvailable(a, executionRecords, referenceDate)
    )

    const toAdd = availableActions.slice(0, rule.action_count)
    recommended.push(...toAdd)
  }

  // 중복 제거 및 최대 5개 제한
  const unique = recommended.filter(
    (action, index, self) => self.findIndex(a => a.action_id === action.action_id) === index
  )

  return unique.slice(0, 5)
}

// 오늘 할 일 추천 (1~3개)
export function getTodayActions(
  scores: Record<IndicatorId, number>,
  operationType: OperationType,
  executionRecords: ExecutionRecord[] = [],
  referenceDate: string = getLocalDateKey()
): ActionCard[] {
  return getRecommendedActions(scores, operationType, executionRecords, referenceDate).slice(0, 3)
}

// 이번 주 할 일 추천
export function getWeekActions(
  scores: Record<IndicatorId, number>,
  operationType: OperationType,
  executionRecords: ExecutionRecord[] = [],
  referenceDate: string = getLocalDateKey()
): ActionCard[] {
  return getRecommendedActions(scores, operationType, executionRecords, referenceDate).slice(0, 5)
}

// 질문 답변에서 직접 추천된 액션 수집
export function getActionsFromAnswers(
  answers: Record<string, number>,
  questions: DiagnosisQuestion[]
): ActionCard[] {
  const actionIds = new Set<string>()

  questions.forEach(q => {
    const selectedScore = answers[q.question_id]
    if (selectedScore !== undefined) {
      const option = q.answer_options.find(o => o.score === selectedScore)
      if (option) {
        option.recommended_actions.forEach(id => actionIds.add(id))
      }
    }
  })

  return ACTION_CARDS.filter(a => actionIds.has(a.action_id))
}
