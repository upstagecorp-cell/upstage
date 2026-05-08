import { RestaurantIndicatorId, OperationType, DiagnosisQuestion, ActionCard } from '@/data/types'
import { ACTION_CARDS } from '@/data/actions'
import { INDICATOR_WEIGHTS } from '@/data/constants'
import { SCORE_ACTION_RULES } from '@/data/types'

// 점수 기반 추천 액션 결정 (PDF 공통전략 Section 11)
export function getRecommendedActions(
  scores: Record<RestaurantIndicatorId, number>,
  operationType: OperationType,
  completedActionIds: string[] = []
): ActionCard[] {
  const weights = INDICATOR_WEIGHTS[operationType]
  const recommended: ActionCard[] = []

  // 가중치 높은 순으로 지표를 정렬
  const sortedIndicators = Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id as RestaurantIndicatorId)

  for (const indicator of sortedIndicators) {
    const score = scores[indicator] || 0
    const scoreLevel = Math.ceil(score / 20) // 0~100 → 1~5 스케일로 변환
    const rule = SCORE_ACTION_RULES.find(r => r.score === scoreLevel) || SCORE_ACTION_RULES[4]

    if (rule.action_count === 0) continue

    const availableActions = ACTION_CARDS.filter(
      a => a.related_indicator === indicator && !completedActionIds.includes(a.action_id)
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
  scores: Record<RestaurantIndicatorId, number>,
  operationType: OperationType,
  completedActionIds: string[] = []
): ActionCard[] {
  return getRecommendedActions(scores, operationType, completedActionIds).slice(0, 3)
}

// 이번 주 할 일 추천
export function getWeekActions(
  scores: Record<RestaurantIndicatorId, number>,
  operationType: OperationType,
  completedActionIds: string[] = []
): ActionCard[] {
  return getRecommendedActions(scores, operationType, completedActionIds).slice(0, 5)
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
