import { AreaId, ActionItem } from '@/data/types'
import { ACTION_POOL } from '@/data/actions'

export function recommendActions(
  scores: Record<AreaId, number>,
  completedActionIds: string[],
  count: number = 3
): ActionItem[] {
  // 점수 낮은 영역 우선 정렬
  const sortedAreaIds = Object.entries(scores)
    .sort(([, a], [, b]) => a - b)
    .map(([id]) => id as AreaId)

  const recommended: ActionItem[] = []
  const usedAreas = new Set<AreaId>()

  // 각 영역에서 완료 안 된 첫 번째 액션 선택
  for (const areaId of sortedAreaIds) {
    if (recommended.length >= count) break
    if (usedAreas.has(areaId)) continue

    const available = ACTION_POOL.filter(
      a => a.areaId === areaId && !completedActionIds.includes(a.id)
    )

    if (available.length > 0) {
      recommended.push(available[0])
      usedAreas.add(areaId)
    }
  }

  // 부족하면 다른 영역에서 채우기
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
