import { IndicatorId, OperationType, ExecutionRecord, ScoreSnapshot } from '@/data/types'
import { INDICATORS, getIndicatorsForOperationType } from '@/data/constants'
import { getActionById } from '@/data/actions'

export interface WeeklyInsight {
  summary: string
  suggestions: string[]
  risk: string | null
}

function sortIndicatorsByScore(scores: Record<IndicatorId, number>, operationType: OperationType = 'hall') {
  return getIndicatorsForOperationType(operationType).map(ind => ({
    id: ind.id,
    score: scores[ind.id] ?? 0,
    label: ind.label,
  })).sort((a, b) => a.score - b.score)
}

export function generateDiagnosisFeedback(
  scores: Record<IndicatorId, number>,
  operationType: OperationType,
): string[] {
  const sorted = sortIndicatorsByScore(scores, operationType)
  const feedback: string[] = []

  // 가장 위험한 3개 지표
  const worst3 = sorted.slice(0, 3)
  feedback.push(`가장 시급한 영역: ${worst3.map(i => `${i.label}(${i.score}점)`).join(', ')}`)

  // 운영 유형별 맞춤 조언
  const typeLabel = { hall: '홀 중심', delivery: '배달 중심', takeout: '테이크아웃 중심', boutique: '부티크/감성형', social: '소셜/로컬형', stay: '장기체류형' }[operationType]
  feedback.push(`${typeLabel} 운영 특성에 맞춰 가장 중요도가 높은 지표부터 개선하세요.`)

  // 위험 지표 개선 가이드
  for (const item of worst3) {
    if (item.score < 40) {
      feedback.push(`[위험] ${item.label}: 즉시 개선이 필요합니다. 관련 액션을 오늘 바로 실행하세요.`)
    } else if (item.score < 60) {
      feedback.push(`[보통] ${item.label}: 개선 여지가 있습니다. 이번 주 내 관련 액션을 시작하세요.`)
    }
  }

  // 잘하는 영역 칭찬
  const best = sorted[sorted.length - 1]
  if (best.score >= 80) {
    feedback.push(`${best.label} 영역은 ${best.score}점으로 잘 관리되고 있습니다.`)
  }

  return feedback.slice(0, 5)
}

export function generateActionFeedback(
  record: ExecutionRecord,
  scores: Record<IndicatorId, number>,
): string {
  // PDF 요구: 실행 결과 해석 → 다음 액션 → 재진단 유도
  const action = getActionById(record.action_id)
  const indicator = action?.related_indicator as IndicatorId | undefined
  const indicatorInfo = indicator ? INDICATORS.find(i => i.id === indicator) : null
  const currentScore = indicator ? (scores[indicator] ?? 0) : 0

  let feedback = ''

  if (record.evidence && record.evidence.length > 0) {
    feedback += '근거 자료까지 기록하셨습니다. 점수에 +5점 반영됩니다. '
  } else {
    feedback += '실행을 완료했습니다. 점수에 +3점 반영됩니다. '
  }

  if (indicatorInfo) {
    const newScore = Math.min(100, currentScore + (record.evidence ? 5 : 3))
    feedback += `${indicatorInfo.label} 지표가 ${currentScore}점 → ${newScore}점으로 향상됩니다. `

    if (newScore < 60) {
      feedback += `아직 개선이 필요합니다. 관련 액션을 계속 실행해주세요.`
    } else if (newScore < 80) {
      feedback += `양호한 수준에 가까워지고 있습니다. 2~3회 추가 실행으로 안정화할 수 있습니다.`
    } else {
      feedback += `우수 수준 도달! 다른 취약 지표로 관심을 옮겨보세요.`
    }
  }

  // 재진단 유도
  const sorted = sortIndicatorsByScore(scores)
  const weakest = sorted[0]
  if (weakest && weakest.id !== indicator && weakest.score < 40) {
    feedback += ` 참고: ${weakest.label}(${weakest.score}점)도 긴급한 상태입니다.`
  }

  return feedback
}

export function generateWeeklyInsight(
  records: ExecutionRecord[],
  scoreHistory: ScoreSnapshot[],
): WeeklyInsight {
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 6)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const weekRecords = records.filter(r => r.execution_date >= weekAgoStr)
  const weekCompleted = weekRecords.length

  let trendLabel: 'growth' | 'stagnant' | 'decline' = 'stagnant'
  let risk: string | null = null

  if (scoreHistory.length >= 2) {
    const first = scoreHistory[Math.max(0, scoreHistory.length - 7)].totalScore
    const last = scoreHistory[scoreHistory.length - 1].totalScore
    const diff = last - first
    if (diff >= 5) trendLabel = 'growth'
    else if (diff <= -3) {
      trendLabel = 'decline'
      risk = '점수가 하락하고 있습니다. 재진단을 통해 원인을 파악하세요.'
    }
  }

  let summary: string
  if (weekCompleted === 0) {
    summary = '이번 주는 실행 기록이 없습니다. 작은 액션 하나부터 시작해보세요.'
  } else if (trendLabel === 'growth') {
    summary = `이번 주 ${weekCompleted}개 액션을 완료하며 좋은 흐름을 이어가고 있습니다!`
  } else {
    summary = `이번 주 ${weekCompleted}개 액션을 완료했습니다. 꾸준히 실행하세요.`
  }

  const suggestions: string[] = []
  if (weekCompleted < 3) {
    suggestions.push('주 3회 이상 실행을 목표로 설정하면 습관 형성에 도움이 됩니다.')
  }

  return { summary, suggestions: suggestions.slice(0, 3), risk }
}
