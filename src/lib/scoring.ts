import { RestaurantIndicatorId, DiagnosisQuestion, OperationType, RiskLevel } from '@/data/types'
import { INDICATORS, INDICATOR_WEIGHTS } from '@/data/constants'

// 진단 답변으로부터 지표별 점수 계산
export function calculateIndicatorScores(
  answers: Record<string, number>,
  questions: DiagnosisQuestion[],
  operationType: OperationType
): Record<RestaurantIndicatorId, number> {
  const sums: Record<string, { total: number; count: number; weightedTotal: number; weightedCount: number }> = {}

  INDICATORS.forEach(ind => {
    sums[ind.id] = { total: 0, count: 0, weightedTotal: 0, weightedCount: 0 }
  })

  const weights = INDICATOR_WEIGHTS[operationType]

  questions.forEach(q => {
    const score = answers[q.question_id]
    if (score !== undefined) {
      const weight = weights[q.category] || 5
      sums[q.category].total += score
      sums[q.category].count += 1
      sums[q.category].weightedTotal += score * weight
      sums[q.category].weightedCount += weight
    }
  })

  const scores: Partial<Record<RestaurantIndicatorId, number>> = {}
  INDICATORS.forEach(ind => {
    const { total, count } = sums[ind.id]
    // 점수를 1~5점 기반에서 0~100점으로 변환
    scores[ind.id as RestaurantIndicatorId] = count > 0 ? Math.round((total / count) * 20) : 0
  })

  return scores as Record<RestaurantIndicatorId, number>
}

// 전체 점수 계산 (가중 평균)
export function getTotalScore(
  scores: Record<RestaurantIndicatorId, number>,
  operationType: OperationType
): number {
  const weights = INDICATOR_WEIGHTS[operationType]
  let weightedSum = 0
  let totalWeight = 0

  INDICATORS.forEach(ind => {
    const w = weights[ind.id as RestaurantIndicatorId] || 5
    weightedSum += (scores[ind.id as RestaurantIndicatorId] || 0) * w
    totalWeight += w
  })

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
}

// 상태 레벨 판단
export function getStatusLevel(score: number) {
  if (score >= 80) return { level: 'excellent', label: '우수', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' }
  if (score >= 60) return { level: 'good', label: '양호', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' }
  if (score >= 40) return { level: 'warning', label: '보통', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' }
  return { level: 'danger', label: '위험', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' }
}

// 위험도 판단
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'low'
  if (score >= 40) return 'medium'
  return 'high'
}

// 지표별 점수 정렬 (낮은 순)
export function getSortedIndicatorsByScore(scores: Record<RestaurantIndicatorId, number>) {
  return INDICATORS.map(ind => ({
    ...ind,
    score: scores[ind.id as RestaurantIndicatorId] || 0,
  })).sort((a, b) => a.score - b.score)
}

// 우선순위별 지표 정렬 (운영 유형 기반)
export function getIndicatorsByPriority(operationType: OperationType) {
  const weights = INDICATOR_WEIGHTS[operationType]
  return INDICATORS
    .map(ind => ({ ...ind, weight: weights[ind.id as RestaurantIndicatorId] || 0 }))
    .sort((a, b) => b.weight - a.weight)
}

// 위험 지표 상위 3개 추출
export function getTopRiskIndicators(
  scores: Record<RestaurantIndicatorId, number>,
  operationType: OperationType
): { indicator: RestaurantIndicatorId; score: number; risk: RiskLevel }[] {
  const weights = INDICATOR_WEIGHTS[operationType]

  return INDICATORS
    .map(ind => ({
      indicator: ind.id as RestaurantIndicatorId,
      score: scores[ind.id as RestaurantIndicatorId] || 0,
      weight: weights[ind.id as RestaurantIndicatorId] || 0,
      risk: getRiskLevel(scores[ind.id as RestaurantIndicatorId] || 0),
    }))
    // 가중치 높은데 점수 낮은 순으로 정렬
    .sort((a, b) => (a.score - a.weight * 5) - (b.score - b.weight * 5))
    .slice(0, 3)
    .map(({ indicator, score, risk }) => ({ indicator, score, risk }))
}
