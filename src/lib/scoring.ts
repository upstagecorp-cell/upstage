import { AreaId, Question } from '@/data/types'
import { AREAS } from '@/data/constants'

export function calculateScores(
  answers: Record<string, number>,
  questions: Question[]
): Record<AreaId, number> {
  const areaSums: Record<string, { total: number; count: number }> = {}

  AREAS.forEach(area => {
    areaSums[area.id] = { total: 0, count: 0 }
  })

  questions.forEach(question => {
    const score = answers[question.id]
    if (score !== undefined) {
      areaSums[question.areaId].total += score
      areaSums[question.areaId].count += 1
    }
  })

  const scores: Partial<Record<AreaId, number>> = {}
  AREAS.forEach(area => {
    const { total, count } = areaSums[area.id]
    scores[area.id] = count > 0 ? Math.round((total / count) * 10) : 0
  })

  return scores as Record<AreaId, number>
}

export function getTotalScore(scores: Record<AreaId, number>): number {
  const values = Object.values(scores)
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

export function getStatusLevel(score: number) {
  if (score >= 80) return { level: 'excellent', label: '우수', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' }
  if (score >= 60) return { level: 'good', label: '양호', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' }
  if (score >= 40) return { level: 'warning', label: '보통', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' }
  return { level: 'danger', label: '위험', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' }
}

export function getSortedAreasByScore(scores: Record<AreaId, number>) {
  return AREAS.map(area => ({ ...area, score: scores[area.id] || 0 }))
    .sort((a, b) => a.score - b.score)
}

export function applyScoreGain(
  currentScores: Record<AreaId, number>,
  areaId: AreaId,
  gain: number
): Record<AreaId, number> {
  return {
    ...currentScores,
    [areaId]: Math.min(100, (currentScores[areaId] || 0) + gain),
  }
}
