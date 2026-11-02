import { addCalendarDays, getLocalDateKey, isDateKey } from '@/lib/date-time'
import type { MetricName, PlanStatus, WeeklyPlan } from './types'
import { InputError, METRIC_NAMES, object } from './validation'

export function weekStartFor(date: string): string {
  if (!isDateKey(date)) throw new InputError('Choose a valid week date.')
  const day = new Date(`${date}T12:00:00Z`).getUTCDay()
  return addCalendarDays(date, -(day === 0 ? 6 : day-1))
}
export interface PlanInput { assessmentId: string; actionId: string; title: string; weekStart: string; dueDate: string; status: PlanStatus; evaluationMetric: MetricName; assetLinks: Array<{assetId: string; version: number}>; notes: string }
export function parsePlanInput(raw: unknown): PlanInput {
  const v = object(raw)
  const text = (value: unknown, name: string, max: number, optional = false) => {
    if (typeof value !== 'string' || value.length > max || (!optional && !value.trim())) throw new InputError(`Enter a valid ${name}.`)
    return value.trim()
  }
  const weekStart = text(v.weekStart,'week',10)
  const dueDate = text(v.dueDate,'due date',10)
  if (!isDateKey(weekStart) || weekStartFor(weekStart) !== weekStart || !isDateKey(dueDate) || dueDate < weekStart || dueDate > addCalendarDays(weekStart,6)) throw new InputError('Choose a Monday week start and a due date within that week.')
  if (!['planned','in_progress','completed','cancelled'].includes(String(v.status))) throw new InputError('Choose a valid plan status.')
  if (!METRIC_NAMES.includes(v.evaluationMetric as MetricName)) throw new InputError('Choose a supported evaluation metric.')
  if (!Array.isArray(v.assetLinks) || v.assetLinks.length > 30) throw new InputError('Choose up to 30 related asset versions.')
  const assetLinks = v.assetLinks.map(rawLink => {
    const link = object(rawLink)
    if (!Number.isSafeInteger(link.version) || Number(link.version) < 1) throw new InputError('Choose a valid asset version.')
    return { assetId: text(link.assetId,'asset ID',200), version: Number(link.version) }
  })
  if (new Set(assetLinks.map(link=>`${link.assetId}:${link.version}`)).size !== assetLinks.length) throw new InputError('Do not select the same asset version twice.')
  return { assessmentId: text(v.assessmentId,'assessment ID',200), actionId: text(v.actionId,'action ID',200), title: text(v.title,'goal title',300), weekStart, dueDate, status: v.status as PlanStatus, evaluationMetric: v.evaluationMetric as MetricName, assetLinks, notes: text(v.notes ?? '','notes',5000,true) }
}
export function isPlanOverdue(plan: WeeklyPlan, now: Date): boolean {
  return !['completed','cancelled'].includes(plan.status) && plan.dueDate < getLocalDateKey(now,plan.timeZone)
}
export function planProgress(plans: WeeklyPlan[], weekStart: string, now: Date) {
  const active = plans.filter(plan=>plan.weekStart===weekStart && plan.status!=='cancelled')
  const completed = active.filter(plan=>plan.status==='completed').length
  return { total: active.length, completed, percent: active.length ? Math.round(completed / active.length * 100) : null, overdue: active.filter(plan=>isPlanOverdue(plan,now)).length }
}
