import { randomUUID } from 'node:crypto'
import type { Asset, Assessment, WeeklyPlan, WorkspaceData } from '@/lib/business/types'
import { parsePlanInput } from '@/lib/business/planning'
import { getRecord, saveRecord, transaction, workspace } from './database'
import { HttpError, invalid, objectInput } from './errors'

export function savePlan(owner: string, raw: unknown, id?: string): WorkspaceData {
  transaction(() => {
    const previous = id ? getRecord<WeeklyPlan>(owner,'weekly_plan',id) : null
    if (id && !previous) throw new HttpError(404,'NOT_FOUND','This weekly plan was not found in your account.')
    const input = parsePlanInput(previous ? { ...previous, ...objectInput(raw), assessmentId: previous.assessmentId, actionId: previous.actionId, weekStart: previous.weekStart } : raw)
    const assessment = getRecord<Assessment>(owner,'assessment',input.assessmentId)
    if (!assessment) throw new HttpError(404,'NOT_FOUND','This assessment was not found in your account.')
    if (!assessment.recommendedActions.some(action=>action.id===input.actionId)) invalid('Choose a recommendation from the selected assessment.')
    for (const link of input.assetLinks) {
      const asset = getRecord<Asset>(owner,'asset',link.assetId)
      if (!asset || asset.assessmentId!==assessment.id || asset.actionId!==input.actionId || !asset.versions.some(version=>version.version===link.version)) invalid('Choose asset versions connected to this recommendation in your account.')
    }
    const recordedAt = new Date().toISOString()
    const plan: WeeklyPlan = { ...input, id: previous?.id ?? randomUUID(), profileId: assessment.profileId, timeZone: previous?.timeZone ?? assessment.profileSnapshot.timeZone, createdAt: previous?.createdAt ?? recordedAt, updatedAt: recordedAt }
    saveRecord(owner,'weekly_plan',plan.id,plan)
  })
  return workspace(owner)
}
