import { AreaId, ActionItem, StageId, IndustryId, SubIndustryId, EvidenceType, ActionType, BusinessMetricEntry } from '@/data/types'
import { ACTION_POOL } from '@/data/actions'

const ACTION_TYPE_EVIDENCE: Record<ActionType, EvidenceType[]> = {
  research: ['text'],
  create: ['link', 'text'],
  test: ['number', 'text'],
  operate: ['link', 'text'],
  measure: ['number'],
  improve: ['text', 'number'],
  learn: ['text'],
}

const ACTION_TYPE_DIFFICULTY: Record<ActionType, number> = {
  research: 2,
  create: 3,
  test: 4,
  operate: 2,
  measure: 3,
  improve: 4,
  learn: 1,
}

const EARLY_STAGE: StageId[] = ['idea', 'preparing']
const OPERATING_STAGE: StageId[] = ['pre-open', 'operating', 'plateau', 'expansion']
const LOCAL_INDUSTRIES: IndustryId[] = ['restaurant', 'cafe', 'accommodation', 'service']

export function getRequiredEvidenceTypes(action: ActionItem): EvidenceType[] {
  return action.requiredEvidenceTypes ?? ACTION_TYPE_EVIDENCE[action.actionType]
}

export function getEvidenceQuality(
  action: ActionItem,
  evidence: { type: EvidenceType; value: string }[] = []
): 'none' | 'partial' | 'complete' {
  const required = getRequiredEvidenceTypes(action)
  const filledTypes = new Set(evidence.filter(e => e.value.trim() !== '').map(e => e.type))

  if (filledTypes.size === 0) return 'none'
  if (required.length === 0 || required.every(type => filledTypes.has(type))) return 'complete'
  return 'partial'
}

export function adjustScoreGainByEvidence(
  baseGain: number,
  status: 'completed' | 'partial' | 'skipped',
  quality: 'none' | 'partial' | 'complete'
): number {
  if (status === 'skipped' || baseGain <= 0) return 0
  if (status === 'partial') return Math.max(1, Math.floor(baseGain * 0.5))
  if (quality === 'complete') return baseGain
  if (quality === 'partial') return Math.max(1, Math.floor(baseGain * 0.7))
  return Math.max(1, Math.floor(baseGain * 0.4))
}

function getPrerequisitePenalty(action: ActionItem, completedActionIds: string[]) {
  if (!action.prerequisiteActionIds?.length) return 0
  return action.prerequisiteActionIds.every(id => completedActionIds.includes(id)) ? 0 : 80
}

function getStageFit(action: ActionItem, stage?: StageId | null) {
  if (!stage) return 0
  if (action.stageFilter?.length) return action.stageFilter.includes(stage) ? 30 : -100

  if (EARLY_STAGE.includes(stage)) {
    if (action.actionType === 'research' || action.actionType === 'learn') return 14
    if (action.actionType === 'measure' || action.actionType === 'operate') return -10
  }

  if (OPERATING_STAGE.includes(stage)) {
    if (action.actionType === 'operate' || action.actionType === 'measure' || action.actionType === 'improve') return 12
    if (action.actionType === 'learn') return -4
  }

  return 0
}

function getIndustryFit(action: ActionItem, industry?: IndustryId | null, subIndustry?: SubIndustryId | null) {
  let fit = 0

  if (industry) {
    if (action.industryFilter?.length) fit += action.industryFilter.includes(industry) ? 32 : -100

    if (LOCAL_INDUSTRIES.includes(industry) && action.title.includes('SNS')) fit += 4
    if (industry === 'online' && (action.title.includes('SNS') || action.title.includes('콘텐츠'))) fit += 8
    if ((industry === 'restaurant' || industry === 'cafe') && action.title.includes('고정비')) fit += 5
    if (industry === 'accommodation' && action.areaId === 'customer') fit += 4
  }

  if (subIndustry && action.subIndustryFilter?.length) {
    fit += action.subIndustryFilter.includes(subIndustry) ? 24 : -80
  }

  return fit
}

function getMetricFit(action: ActionItem, latestMetric?: BusinessMetricEntry | null) {
  if (!latestMetric) return 0

  if (action.areaId === 'revenue' && latestMetric.revenue !== undefined) return 8
  if (action.areaId === 'acquisition' && (latestMetric.visitors !== undefined || latestMetric.inquiries !== undefined)) return 8
  if (action.areaId === 'customer' && (latestMetric.customers !== undefined || latestMetric.returnVisitors !== undefined)) return 6
  if (action.areaId === 'validation' && latestMetric.conversionRate !== undefined) return 6
  if (action.areaId === 'operation' && latestMetric.reservations !== undefined) return 5
  return 0
}

function getActionPriorityScore(
  action: ActionItem,
  scores: Record<AreaId, number>,
  completedActionIds: string[],
  stage?: StageId | null,
  industry?: IndustryId | null,
  subIndustry?: SubIndustryId | null,
  latestMetric?: BusinessMetricEntry | null
) {
  const weakness = 100 - (scores[action.areaId] ?? 0)
  const impact = action.impact ?? action.scoreImpact
  const urgency = action.urgency ?? Math.max(1, Math.round(weakness / 20))
  const difficulty = action.difficulty ?? ACTION_TYPE_DIFFICULTY[action.actionType]
  const prerequisitePenalty = getPrerequisitePenalty(action, completedActionIds)

  return (
    weakness * 1.6 +
    impact * 5 +
    urgency * 4 -
    difficulty * 6 +
    getStageFit(action, stage) +
    getIndustryFit(action, industry, subIndustry) +
    getMetricFit(action, latestMetric) -
    prerequisitePenalty
  )
}

export function recommendActions(
  scores: Record<AreaId, number>,
  completedActionIds: string[],
  count: number = 3,
  stage?: StageId | null,
  industry?: IndustryId | null,
  lastCompletedActionId?: string | null,
  subIndustry?: SubIndustryId | null,
  latestMetric?: BusinessMetricEntry | null
): ActionItem[] {
  // 필터링: stageFilter/industryFilter가 있는 경우 매칭 확인
  const isEligible = (action: ActionItem): boolean => {
    if (completedActionIds.includes(action.id)) return false
    if (action.stageFilter && action.stageFilter.length > 0 && stage) {
      if (!action.stageFilter.includes(stage)) return false
    }
    if (action.industryFilter && action.industryFilter.length > 0 && industry) {
      if (!action.industryFilter.includes(industry)) return false
    }
    if (action.subIndustryFilter && action.subIndustryFilter.length > 0 && subIndustry) {
      if (!action.subIndustryFilter.includes(subIndustry)) return false
    }
    if (getPrerequisitePenalty(action, completedActionIds) > 0) return false
    return true
  }

  const recommended: ActionItem[] = []
  const usedAreas = new Set<AreaId>()

  // 마지막 완료 액션의 nextActionId를 최우선 추천
  if (lastCompletedActionId) {
    const lastAction = ACTION_POOL.find(a => a.id === lastCompletedActionId)
    if (lastAction?.nextActionId) {
      const nextAction = ACTION_POOL.find(a => a.id === lastAction.nextActionId)
      if (nextAction && isEligible(nextAction)) {
        recommended.push(nextAction)
        usedAreas.add(nextAction.areaId)
      }
    }
  }

  const rankedActions = ACTION_POOL
    .filter(isEligible)
    .map(action => ({
      action,
      score: getActionPriorityScore(action, scores, completedActionIds, stage, industry, subIndustry, latestMetric),
    }))
    .sort((a, b) => b.score - a.score)

  // 너무 한 영역만 몰리지 않게 취약 영역별 대표 액션을 먼저 담는다.
  for (const { action } of rankedActions) {
    if (recommended.length >= count) break
    if (usedAreas.has(action.areaId)) continue
    recommended.push(action)
    usedAreas.add(action.areaId)
  }

  // 부족하면 같은 영역의 후속 액션도 허용한다.
  if (recommended.length < count) {
    for (const { action } of rankedActions) {
      if (recommended.length >= count) break
      if (recommended.find(r => r.id === action.id)) continue
      recommended.push(action)
    }
  }

  return recommended
}
