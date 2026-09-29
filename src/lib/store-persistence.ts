import { INDICATORS, INDUSTRIES, OPERATION_TYPES, STAGES } from '@/data/constants'
import type {
  BusinessMetricEntry,
  FinancialSnapshot,
  IndicatorId,
  IndustryId,
  OperationType,
  ScoreSnapshot,
  StageId,
  ExecutionRecord,
  WeeklyGoal,
} from '@/data/types'
import { isDateKey } from '@/lib/date-time'

export interface PersistedAppState {
  industry: IndustryId | null
  stage: StageId | null
  operationType: OperationType | null
  financialSnapshot: FinancialSnapshot | null
  answers: Record<string, number>
  scores: Record<IndicatorId, number>
  diagnosisCompleted: boolean
  executionRecords: ExecutionRecord[]
  scoreHistory: ScoreSnapshot[]
  weeklyGoal: WeeklyGoal | null
  businessMetrics: BusinessMetricEntry[]
  streak: number
  lastActionDate: string | null
}

const industryIds = new Set(INDUSTRIES.map((item) => item.id))
const stageIds = new Set(STAGES.map((item) => item.id))
const operationTypeIds = new Set(OPERATION_TYPES.map((item) => item.id))
const indicatorIds = new Set(INDICATORS.map((item) => item.id))

export const DEFAULT_SCORES = Object.fromEntries(
  INDICATORS.map((indicator) => [indicator.id, 0])
) as Record<IndicatorId, number>

export function createDefaultPersistedState(): PersistedAppState {
  return {
    industry: null,
    stage: null,
    operationType: null,
    financialSnapshot: null,
    answers: {},
    scores: { ...DEFAULT_SCORES },
    diagnosisCompleted: false,
    executionRecords: [],
    scoreHistory: [],
    weeklyGoal: null,
    businessMetrics: [],
    streak: 0,
    lastActionDate: null,
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function boundedString(value: unknown, maxLength: number): string | null {
  return typeof value === 'string' && value.length <= maxLength ? value : null
}

function optionalString(value: unknown, maxLength: number): string | undefined {
  const parsed = boundedString(value, maxLength)
  return parsed === null || parsed.length === 0 ? undefined : parsed
}

function boundedNumber(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return Math.min(max, Math.max(min, value))
}

function stringArray(value: unknown, maxItems: number, maxLength = 160): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(
    new Set(
      value
        .map((item) => boundedString(item, maxLength))
        .filter((item): item is string => Boolean(item))
    )
  ).slice(0, maxItems)
}

function sanitizeScores(value: unknown): Record<IndicatorId, number> {
  const scores = { ...DEFAULT_SCORES }
  if (!isObject(value)) return scores

  INDICATORS.forEach((indicator) => {
    const score = boundedNumber(value[indicator.id], 0, 100)
    if (score !== undefined) scores[indicator.id] = Math.round(score)
  })
  return scores
}

function sanitizeAnswers(value: unknown): Record<string, number> {
  if (!isObject(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, score]) =>
        key.length <= 100 &&
        typeof score === 'number' &&
        Number.isInteger(score) &&
        score >= 1 &&
        score <= 5
      )
      .map(([key, score]) => [key, score as number])
  )
}

function sanitizeExecutionRecords(value: unknown): ExecutionRecord[] {
  if (!Array.isArray(value)) return []
  const usedIds = new Set<string>()

  return value.flatMap((item, index) => {
    if (!isObject(item) || !isDateKey(item.execution_date)) return []
    const actionId = boundedString(item.action_id, 160)
    if (!actionId) return []

    const sourceId = boundedString(item.id, 200) || `rec_migrated_${index}`
    const id = usedIds.has(sourceId) ? `${sourceId}_migrated_${index}` : sourceId
    usedIds.add(id)

    return [{
      id,
      action_id: actionId,
      execution_date: item.execution_date,
      recorded_at: optionalString(item.recorded_at, 80),
      time_zone: optionalString(item.time_zone, 100),
      locale: optionalString(item.locale, 40),
      time_spent: boundedString(item.time_spent, 100) ?? '',
      difficulty_note: boundedString(item.difficulty_note, 1_000) ?? '',
      result_memo: boundedString(item.result_memo, 5_000) ?? '',
      evidence: optionalString(item.evidence, 5_000),
      next_recommended_action: optionalString(item.next_recommended_action, 1_000),
    }]
  }).slice(0, 5_000)
}

function sanitizeScoreHistory(value: unknown): ScoreSnapshot[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!isObject(item) || !isDateKey(item.date)) return []
    return [{
      date: item.date,
      recordedAt: optionalString(item.recordedAt, 80),
      timeZone: optionalString(item.timeZone, 100),
      locale: optionalString(item.locale, 40),
      scores: sanitizeScores(item.scores),
      totalScore: Math.round(boundedNumber(item.totalScore, 0, 100) ?? 0),
    }]
  }).slice(-2_000)
}

function sanitizeWeeklyGoal(value: unknown): WeeklyGoal | null {
  if (!isObject(value) || !isDateKey(value.startDate) || !isDateKey(value.endDate)) return null
  if (value.endDate < value.startDate) return null
  if (typeof value.targetIndicator !== 'string' || !indicatorIds.has(value.targetIndicator as IndicatorId)) return null

  const id = boundedString(value.id, 200)
  const title = boundedString(value.title, 160)
  if (!id || !title) return null

  return {
    id,
    title,
    targetIndicator: value.targetIndicator as IndicatorId,
    startDate: value.startDate,
    endDate: value.endDate,
    createdAt: optionalString(value.createdAt, 80),
    timeZone: optionalString(value.timeZone, 100),
    locale: optionalString(value.locale, 40),
    targetActions: stringArray(value.targetActions, 50),
    completedActions: stringArray(value.completedActions, 50),
  }
}

function sanitizeBusinessMetrics(value: unknown): BusinessMetricEntry[] {
  if (!Array.isArray(value)) return []
  type NumberField = 'revenue' | 'customers' | 'visitors' | 'reservations' | 'reviews' | 'returnVisitors' | 'inquiries'
  const numberFields: NumberField[] = [
    'revenue',
    'customers',
    'visitors',
    'reservations',
    'reviews',
    'returnVisitors',
    'inquiries',
  ]

  return value.flatMap((item) => {
    if (!isObject(item) || !isDateKey(item.date)) return []
    const metrics: Partial<Record<NumberField, number>> = {}

    numberFields.forEach((field) => {
      const parsed = boundedNumber(item[field], 0, 1_000_000_000_000_000)
      if (parsed !== undefined) metrics[field] = parsed
    })

    const entry: BusinessMetricEntry = {
      date: item.date,
      recordedAt: optionalString(item.recordedAt, 80),
      timeZone: optionalString(item.timeZone, 100),
      locale: optionalString(item.locale, 40),
      ...metrics,
    }
    const conversionRate = boundedNumber(item.conversionRate, 0, 100)
    if (conversionRate !== undefined) entry.conversionRate = conversionRate
    return [entry]
  }).slice(-2_000)
}

function sanitizeFinancialSnapshot(value: unknown): FinancialSnapshot | null {
  if (!isObject(value)) return null
  const monthlyRevenueText = boundedString(value.monthlyRevenueText, 100)
  const monthlyNetProfitText = boundedString(value.monthlyNetProfitText, 100)
  const capturedAt = boundedString(value.capturedAt, 80)
  if (!monthlyRevenueText || !monthlyNetProfitText || !capturedAt) return null

  return {
    monthlyRevenueText,
    monthlyNetProfitText,
    evidenceFileNames: stringArray(value.evidenceFileNames, 5, 255),
    capturedAt,
    timeZone: optionalString(value.timeZone, 100),
    locale: optionalString(value.locale, 40),
  }
}

export function sanitizePersistedState(value: unknown): PersistedAppState {
  const defaults = createDefaultPersistedState()
  if (!isObject(value)) return defaults

  const industry = typeof value.industry === 'string' && industryIds.has(value.industry as IndustryId)
    ? value.industry as IndustryId
    : null
  const stage = typeof value.stage === 'string' && stageIds.has(value.stage as StageId)
    ? value.stage as StageId
    : null
  const operationType = typeof value.operationType === 'string' && operationTypeIds.has(value.operationType as OperationType)
    ? value.operationType as OperationType
    : null
  const lastActionDate = isDateKey(value.lastActionDate) ? value.lastActionDate : null

  return {
    industry,
    stage,
    operationType,
    financialSnapshot: sanitizeFinancialSnapshot(value.financialSnapshot),
    answers: sanitizeAnswers(value.answers),
    scores: sanitizeScores(value.scores),
    diagnosisCompleted: value.diagnosisCompleted === true && industry !== null && stage !== null && operationType !== null,
    executionRecords: sanitizeExecutionRecords(value.executionRecords),
    scoreHistory: sanitizeScoreHistory(value.scoreHistory),
    weeklyGoal: sanitizeWeeklyGoal(value.weeklyGoal),
    businessMetrics: sanitizeBusinessMetrics(value.businessMetrics),
    streak: Math.round(boundedNumber(value.streak, 0, 10_000) ?? 0),
    lastActionDate,
  }
}
