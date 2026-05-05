import { AreaId, IndustryId, StageId, SubIndustryId, ActionRecord, ScoreSnapshot } from '@/data/types'
import { AREAS } from '@/data/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyInsight {
  summary: string
  suggestions: string[]
  risk: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortAreasByScore(scores: Record<AreaId, number>): { id: AreaId; score: number; label: string }[] {
  return AREAS.map(a => ({ id: a.id, score: scores[a.id] ?? 0, label: a.label })).sort(
    (a, b) => a.score - b.score,
  )
}

function detectScorePattern(scores: Record<AreaId, number>): 'all-low' | 'one-critical' | 'balanced-low' | 'mixed' {
  const vals = Object.values(scores)
  const below40 = vals.filter(v => v < 40).length
  const below60 = vals.filter(v => v < 60).length
  if (below40 >= 5) return 'all-low'
  if (below40 === 1 && vals.filter(v => v < 30).length === 1) return 'one-critical'
  if (below60 >= 5) return 'balanced-low'
  return 'mixed'
}

// ─── Industry + Stage context rules ──────────────────────────────────────────

const INDUSTRY_PRIORITY: Partial<Record<IndustryId, AreaId[]>> = {
  cafe: ['customer', 'product', 'acquisition'],
  restaurant: ['product', 'operation', 'customer'],
  accommodation: ['product', 'acquisition', 'revenue'],
  service: ['customer', 'validation', 'acquisition'],
  online: ['validation', 'acquisition', 'growth'],
  other: ['customer', 'validation', 'product'],
}

const STAGE_PRIORITY: Partial<Record<StageId, AreaId[]>> = {
  idea: ['customer', 'validation'],
  preparing: ['customer', 'validation', 'product'],
  'pre-open': ['product', 'acquisition', 'operation'],
  operating: ['acquisition', 'revenue', 'operation'],
  plateau: ['growth', 'customer', 'acquisition'],
  expansion: ['growth', 'revenue', 'operation'],
}

const STAGE_CONTEXT: Partial<Record<StageId, string>> = {
  idea: '아이디어 단계에서는 고객 이해와 문제 검증이 핵심입니다.',
  preparing: '준비 단계에서는 실제 고객과 대화하고 MVP를 빠르게 만들어야 합니다.',
  'pre-open': '오픈 직전에는 운영 체계와 초기 고객 유입 채널 확보가 중요합니다.',
  operating: '운영 단계에서는 수익성과 고객 재방문율 개선이 핵심입니다.',
  plateau: '정체 구간 돌파를 위해 고객 세그먼트를 재검토하고 새로운 채널을 시도하세요.',
  expansion: '확장 준비 단계에서는 지속 가능한 수익 모델과 운영 자동화가 선행되어야 합니다.',
}

// ─── Advice bank ─────────────────────────────────────────────────────────────

const AREA_ADVICE: Record<AreaId, string[]> = {
  customer: [
    '주 1회 이상 실제 고객 인터뷰를 진행해 페인포인트를 직접 들으세요.',
    '고객 페르소나를 작성하고 결정 전에 "이 고객에게 맞는가?"를 자문하세요.',
    '리뷰와 문의를 통해 고객의 언어를 수집하고 마케팅에 그대로 활용하세요.',
    '핵심 고객 5명과 깊은 관계를 구축하는 것이 폭넓은 마케팅보다 효과적입니다.',
  ],
  validation: [
    '가설을 세우고 2주 안에 실제 데이터로 검증하세요.',
    '사전 예약·사전 판매로 실제 지불 의향을 확인하세요.',
    '"좋아요"는 검증이 아닙니다. 실제 구매나 행동 데이터만 신뢰하세요.',
    '경쟁사 리뷰 분석으로 시장의 충족되지 않은 니즈를 발굴하세요.',
  ],
  product: [
    '핵심 기능 1가지를 압도적으로 잘하는 것이 다양한 기능보다 강력합니다.',
    '고객 피드백 기반으로 제품을 월 1회 이상 업데이트하세요.',
    '경쟁사 대비 차별점을 한 문장으로 설명할 수 있어야 합니다.',
    '가격 대비 가치 인식을 높이는 포장·스토리텔링에 투자하세요.',
  ],
  acquisition: [
    '채널을 분산하지 말고 하나의 채널에서 ROI를 검증한 후 확장하세요.',
    '첫 100명의 고객은 광고 없이 직접 접근(DM, 커뮤니티)으로 확보하세요.',
    '콘텐츠 1개당 3개 플랫폼에 재활용하는 리퍼포징 전략을 사용하세요.',
    '고객 후기를 즉시 수집하고 가시적으로 활용하세요.',
  ],
  revenue: [
    '월별 고정비와 변동비를 정확히 파악하고 손익분기점을 계산하세요.',
    '단가를 10% 올렸을 때 이탈률보다 마진 개선이 클 수 있습니다.',
    '반복 구매를 유도하는 구독·멤버십·번들 상품을 실험하세요.',
    '비용 절감보다 객단가 상승이 더 효과적인 경우가 많습니다.',
  ],
  operation: [
    '반복 업무는 체크리스트로 문서화해 일관성을 확보하세요.',
    '하루 업무 중 핵심 3가지를 아침에 정하고 나머지는 위임하세요.',
    '노션·슬랙·구글시트 등 도구를 활용해 협업 효율을 높이세요.',
    '주 1회 운영 리뷰로 병목 구간을 빠르게 발견하세요.',
  ],
  growth: [
    '측정 가능한 핵심 지표 1개를 정하고 매주 추적하세요.',
    '기존 고객의 레퍼럴이 신규 고객 광고보다 6배 효율적입니다.',
    '작은 실험을 주 1회 이상 실행해 빠르게 학습하세요.',
    '성장 정체 시 고객 세그먼트나 채널 중 하나를 과감히 바꿔보세요.',
  ],
}

// ─── 1. generateDiagnosisFeedback ────────────────────────────────────────────

export function generateDiagnosisFeedback(
  answers: Record<string, number>,
  scores: Record<AreaId, number>,
  industry: IndustryId | null,
  subIndustry: SubIndustryId | null,
): string[] {
  const sorted = sortAreasByScore(scores)
  const pattern = detectScorePattern(scores)
  const feedback: string[] = []

  // 1) 단계/업종 컨텍스트 메시지
  const industryPriority = industry ? (INDUSTRY_PRIORITY[industry] ?? []) : []
  const criticalForIndustry = industryPriority.filter(aId => (scores[aId] ?? 0) < 50)

  // cafe + idea stage → 입지분석 우선 권고
  if (industry === 'cafe' && (scores.customer ?? 0) < 50) {
    feedback.push('카페 업종에서 고객이해도가 낮으면 입지 선택 실패로 이어질 수 있습니다. 상권 분석과 타깃 고객 인터뷰를 최우선으로 진행하세요.')
  }

  // 2) 가장 낮은 2개 영역 집중 조언
  const weakest = sorted.slice(0, 2)
  for (const area of weakest) {
    const adviceList = AREA_ADVICE[area.id]
    const pick = adviceList[Math.floor(area.score / 25) % adviceList.length]
    feedback.push(`[${area.label} ${area.score}점] ${pick}`)
  }

  // 3) 패턴별 전략 메시지
  if (pattern === 'all-low') {
    feedback.push('전 영역이 낮습니다. 지금 당장 완벽한 계획보다 가장 약한 영역 하나를 집중 개선하는 것이 효과적입니다.')
  } else if (pattern === 'one-critical') {
    feedback.push(`${sorted[0].label} 점수가 특히 낮아 전체 사업 준비도를 끌어내리고 있습니다. 이 영역부터 집중적으로 개선하세요.`)
  } else if (pattern === 'balanced-low') {
    feedback.push('전반적으로 균형 잡혀 있지만 모든 영역이 60점 미만입니다. 업종에서 가장 중요한 영역 1~2개를 선택해 집중 투자하세요.')
  }

  // 4) 업종 필수 영역 경고
  if (criticalForIndustry.length > 0) {
    const areaLabels = criticalForIndustry
      .map(id => AREAS.find(a => a.id === id)?.label ?? id)
      .join(', ')
    feedback.push(`${industry ? { restaurant: '음식점', cafe: '카페', accommodation: '숙박', service: '서비스업', online: '온라인사업', other: '이 업종' }[industry] : '이 업종'}에서 핵심 영역인 ${areaLabels}의 점수가 낮습니다. 우선 순위를 높이세요.`)
  }

  // 5) 잘하는 영역 칭찬
  const best = sorted[sorted.length - 1]
  if (best.score >= 60) {
    feedback.push(`${best.label} 영역은 ${best.score}점으로 강점입니다. 이 강점을 다른 영역 개선에도 활용하세요.`)
  }

  return feedback.slice(0, 5)
}

// ─── 2. generateActionFeedback ────────────────────────────────────────────────

export function generateActionFeedback(
  actionRecord: ActionRecord,
  scores: Record<AreaId, number>,
  history: ActionRecord[],
): string {
  const { status, memo, evidence, scoreGain } = actionRecord

  // 최근 10개 기록에서 영역 분포 분석
  const recent = history.slice(0, 10)
  const areaCount: Partial<Record<AreaId, number>> = {}
  // We don't have areaId on ActionRecord directly, so we'll use history patterns
  // Instead analyse memo quality and evidence
  
  if (status === 'skipped') {
    const lowestArea = sortAreasByScore(scores)[0]
    return `오늘은 실행을 건너뛰었군요. ${lowestArea.label}(${lowestArea.score}점) 영역에서 작은 액션 하나만 시도해도 큰 차이를 만들 수 있습니다. 내일 다시 도전해보세요!`
  }

  if (status === 'partial') {
    if (memo && memo.length > 20) {
      return `절반의 실행도 충분히 의미 있습니다. 메모에 적은 "${memo.slice(0, 40)}..." 내용을 바탕으로 다음 실행 시 장벽을 먼저 해결해보세요.`
    }
    return '일부 완료하셨네요. 어떤 부분이 어려웠는지 메모로 남겨두면 다음 실행 시 더 나은 결과를 얻을 수 있습니다.'
  }

  // completed
  const evidenceCount = evidence?.filter(e => e.value.trim()).length ?? 0
  const hasStrongEvidence = evidenceCount >= 2

  if (hasStrongEvidence && scoreGain > 0) {
    return `훌륭합니다! 증거까지 철저하게 기록하셨네요. 이런 실행이 쌓이면 점수 상승이 빠르게 나타납니다. 다음 액션에서도 증거를 남겨보세요.`
  }

  if (scoreGain >= 5) {
    return `완료 수고하셨습니다! ${scoreGain}점 상승했어요. 증거(스크린샷·링크·숫자)를 추가하면 점수가 더 높게 반영됩니다.`
  }

  const sorted = sortAreasByScore(scores)
  const nextFocus = sorted[0]
  return `잘 하셨습니다! 다음에는 ${nextFocus.label}(${nextFocus.score}점) 영역의 액션을 시도해 취약한 부분을 채워보세요.`
}

// ─── 3. generateWeeklyInsight ─────────────────────────────────────────────────

export function generateWeeklyInsight(
  actionRecords: ActionRecord[],
  scoreHistory: ScoreSnapshot[],
): WeeklyInsight {
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 6)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const weekRecords = actionRecords.filter(r => r.date >= weekAgoStr)
  const completedThisWeek = weekRecords.filter(r => r.status === 'completed')
  const totalGain = weekRecords.reduce((sum, r) => sum + r.scoreGain, 0)

  const recentHistory = scoreHistory.slice(-7)
  let trendLabel: 'growth' | 'stagnant' | 'decline' = 'stagnant'
  let risk: string | null = null

  if (recentHistory.length >= 2) {
    const first = recentHistory[0].totalScore
    const last = recentHistory[recentHistory.length - 1].totalScore
    const diff = last - first
    if (diff >= 5) trendLabel = 'growth'
    else if (diff <= -3) {
      trendLabel = 'decline'
      risk = '점수가 하락하고 있습니다. 지표 입력과 재진단을 통해 원인을 파악하세요.'
    }
  }

  // 이번 주 가장 많이 실행한 영역 (simplified: count by scoreGain buckets)
  const weekCompleted = completedThisWeek.length
  const activeDays = new Set(weekRecords.filter(r => r.status === 'completed').map(r => r.date)).size

  let summary: string
  if (weekCompleted === 0) {
    summary = '이번 주는 실행 기록이 없습니다. 하루 5분짜리 작은 액션부터 시작해보세요.'
  } else if (trendLabel === 'growth') {
    summary = `이번 주 ${weekCompleted}개 액션을 완료하며 총 +${totalGain}점 상승했습니다. ${activeDays}일 연속 실행으로 좋은 흐름을 이어가고 있어요!`
  } else if (trendLabel === 'decline') {
    summary = `이번 주 ${weekCompleted}개 액션을 완료했지만 점수가 하락하고 있습니다. 실행의 질을 점검하고 취약 영역에 집중하세요.`
  } else {
    summary = `이번 주 ${weekCompleted}개 액션, +${totalGain}점 상승했습니다. 꾸준한 실행을 이어가면 곧 더 큰 변화를 느낄 수 있을 거예요.`
  }

  const suggestions: string[] = []

  if (weekCompleted < 3) {
    suggestions.push('주 3회 이상 실행을 목표로 설정하면 습관 형성에 도움이 됩니다.')
  }

  if (weekCompleted > 0 && totalGain === 0) {
    suggestions.push('완료된 액션에 증거(숫자·링크·이미지)를 추가하면 점수 반영률이 높아집니다.')
  }

  if (recentHistory.length >= 2) {
    const scores = recentHistory[recentHistory.length - 1].scores
    const sorted = sortAreasByScore(scores)
    const weakest = sorted[0]
    if (weakest.score < 40) {
      suggestions.push(`${weakest.label}(${weakest.score}점)이 가장 취약합니다. 이 영역 액션을 이번 주에 1개 이상 실행하세요.`)
    }
  }

  if (activeDays <= 2 && weekCompleted > 0) {
    suggestions.push('실행을 특정 날에 몰아서 하기보다 매일 조금씩 분산하면 습관 형성에 효과적입니다.')
  }

  return { summary, suggestions: suggestions.slice(0, 3), risk }
}
