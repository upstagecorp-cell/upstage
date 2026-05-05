import { AreaId, ActionItem, StageId, IndustryId } from '@/data/types'
import { ACTION_POOL } from '@/data/actions'

export function recommendActions(
  scores: Record<AreaId, number>,
  completedActionIds: string[],
  count: number = 3,
  stage?: StageId | null,
  industry?: IndustryId | null,
  lastCompletedActionId?: string | null
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
    return true
  }

  // 점수 낮은 영역 우선 정렬
  const sortedAreaIds = Object.entries(scores)
    .sort(([, a], [, b]) => a - b)
    .map(([id]) => id as AreaId)

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

  // 각 영역에서 완료 안 된 첫 번째 액션 선택
  for (const areaId of sortedAreaIds) {
    if (recommended.length >= count) break
    if (usedAreas.has(areaId)) continue

    const available = ACTION_POOL.filter(
      a => a.areaId === areaId && isEligible(a)
    )

    if (available.length > 0) {
      recommended.push(available[0])
      usedAreas.add(areaId)
    }
  }

  // 부족하면 다른 영역에서 채우기 (필터 없이 fallback)
  if (recommended.length < count) {
    const remaining = ACTION_POOL.filter(
      a => !completedActionIds.includes(a.id) && !recommended.find(r => r.id === a.id)
    )
    for (const action of remaining) {
      if (recommended.length >= count) break
      recommended.push(action)
    }
  }

  return recommended
}
