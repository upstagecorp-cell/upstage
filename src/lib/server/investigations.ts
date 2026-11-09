import { randomUUID } from 'node:crypto'
import type { BusinessProfile, WorkspaceData } from '@/lib/business/types'
import type {
  FocusedCheckin,
  FocusedCosts,
  FocusedFeedback,
  FocusedInput,
  FocusedIntent,
  FocusedInvestigation,
  FocusedMetrics,
  ProductEvent,
  ProductEventType,
} from '@/lib/business/focused-types'
import { getLocalDateKey, isDateKey } from '@/lib/date-time'
import {
  diagnoseInput,
  FOCUSED_ANSWER_OPTIONS,
} from '@/lib/business/focused-diagnosis'
import { calculateCosts } from '@/lib/business/focused-artifacts'
import {
  getRecord,
  listRecords,
  saveRecord,
  transaction,
  workspace,
} from './database'
import { HttpError, invalid, objectInput, textInput } from './errors'

const intents: FocusedIntent[] = [
  'draft',
  'diagnose',
  'artifact',
  'plan',
  'checkin',
]
const metricKeys = ['visits', 'views', 'carts', 'checkouts', 'orders'] as const
const costKeys = [
  'price',
  'productCost',
  'packaging',
  'fulfillment',
  'shippingCost',
  'shippingCharged',
  'paymentPercent',
  'paymentFixed',
] as const
const rank = { draft: 0, diagnosed: 1, artifact: 2, planned: 3, reviewed: 4 }
const targetStage = {
  draft: 'draft',
  diagnose: 'diagnosed',
  artifact: 'artifact',
  plan: 'planned',
  checkin: 'reviewed',
} as const
const completionEvent: Partial<Record<FocusedIntent, ProductEventType>> = {
  diagnose: 'diagnosis_completed',
  artifact: 'artifact_completed',
  plan: 'experiment_started',
  checkin: 'checkin_completed',
}
const now = () => new Date().toISOString()

function nullableNumber(
  value: unknown,
  label: string,
  integer = false,
): number | null {
  if (value === null) return null
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1e12 ||
    (integer && !Number.isSafeInteger(value))
  )
    invalid(`Enter a nonnegative ${label}, or leave it unknown.`)
  return value
}
function parseMetrics(raw: unknown): FocusedMetrics {
  const v = objectInput(raw)
  if (
    !Number.isSafeInteger(v.days) ||
    (v.days as number) < 1 ||
    (v.days as number) > 3660
  )
    invalid('Enter a reporting duration between 1 and 3660 days.')
  return {
    ...Object.fromEntries(
      metricKeys.map((key) => [key, nullableNumber(v[key], key, true)]),
    ),
    days: v.days,
  } as FocusedMetrics
}
function parseCosts(raw: unknown): FocusedCosts {
  const v = objectInput(raw)
  const costs = Object.fromEntries(
    costKeys.map((key) => [key, nullableNumber(v[key], key)]),
  ) as unknown as FocusedCosts
  if (costs.paymentPercent !== null && costs.paymentPercent > 100)
    invalid('Payment percentage must be between 0 and 100.')
  return costs
}
function bool(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') invalid(`Confirm ${label}.`)
  return value
}
function dates(
  start: string,
  end: string,
  days: number,
  timeZone: string,
  required: boolean,
): void {
  if (!start && !end && !required) return
  if (!isDateKey(start) || !isDateKey(end) || end < start)
    invalid('Enter a valid reporting start and end date.')
  if (end > getLocalDateKey(new Date(), timeZone))
    invalid(
      'Measured reporting periods cannot end in the future in your business time zone.',
    )
  const duration =
    Math.round(
      (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) /
        86400000,
    ) + 1
  if (duration !== days)
    invalid(
      'The reporting duration must match the inclusive start and end dates.',
    )
}
function parseCheckin(raw: unknown): FocusedCheckin | null {
  if (raw === null) return null
  const v = objectInput(raw)
  return {
    periodStart: textInput(v.periodStart, 'check-in start date', 10, false),
    periodEnd: textInput(v.periodEnd, 'check-in end date', 10, false),
    source: textInput(v.source, 'check-in source', 1000, false),
    comparable: bool(
      v.comparable,
      'whether the check-in definitions and population are comparable',
    ),
    metrics: parseMetrics(v.metrics),
    changed: textInput(v.changed, 'changes during the experiment', 3000, false),
    notes: textInput(v.notes, 'check-in notes', 5000, false),
  }
}
function parseInput(raw: unknown): FocusedInput {
  const v = objectInput(raw)
  const answers = objectInput(v.answers)
  if (Object.keys(answers).length > 30)
    invalid('Keep up to 30 diagnostic answers.')
  for (const [key, value] of Object.entries(answers)) {
    if (
      !Object.hasOwn(FOCUSED_ANSWER_OPTIONS, key) ||
      typeof value !== 'string' ||
      !FOCUSED_ANSWER_OPTIONS[key].includes(value)
    )
      invalid('Choose a supported answer to a diagnostic question.')
  }
  const plan = objectInput(v.plan)
  return {
    product: textInput(v.product, 'product', 1000, false),
    channel: textInput(v.channel, 'sales channel', 200, false),
    periodStart: textInput(v.periodStart, 'start date', 10, false),
    periodEnd: textInput(v.periodEnd, 'end date', 10, false),
    source: textInput(v.source, 'measurement source', 1000, false),
    comparable: bool(
      v.comparable,
      'whether funnel definitions and populations match',
    ),
    metrics: parseMetrics(v.metrics),
    answers: Object.fromEntries(
      Object.entries(answers)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => [
          textInput(key, 'question key', 100),
          textInput(value, 'answer', 3000, false),
        ]),
    ),
    costs: parseCosts(v.costs),
    plan: {
      change: textInput(plan.change, 'proposed change', 5000, false),
      reviewDate: textInput(plan.reviewDate, 'review date', 10, false),
      successRule: textInput(plan.successRule, 'success rule', 2000, false),
      guardrail: textInput(plan.guardrail, 'experiment guardrail', 2000, false),
    },
    checkin: parseCheckin(v.checkin),
  }
}
function requiredInvestigation(
  owner: string,
  id: string,
): FocusedInvestigation {
  const value = getRecord<FocusedInvestigation>(owner, 'investigation', id)
  if (!value)
    throw new HttpError(
      404,
      'NOT_FOUND',
      'This investigation was not found in your account.',
    )
  return value
}
function baseline(input: FocusedInput): string {
  // Parse into a fixed-key representation before comparing; client object order is irrelevant.
  const { checkin: _checkin, plan: _plan, ...value } = input
  void _checkin
  void _plan
  return JSON.stringify(value)
}
function validateReady(
  input: FocusedInput,
  profile: BusinessProfile,
  intent: FocusedIntent,
  previous: FocusedInvestigation | null,
  startedAt?: string,
): void {
  dates(
    input.periodStart,
    input.periodEnd,
    input.metrics.days,
    profile.timeZone,
    intent !== 'draft',
  )
  if (profile.businessType !== 'ecommerce')
    invalid(
      'This focused investigation currently supports online retail businesses. Choose that business type in your profile.',
    )
  if (intent !== 'draft') {
    if (!input.product || !input.channel || !input.source)
      invalid(
        'Add a product, channel, reporting dates, and measurement source before diagnosing.',
      )
  }
  // Counts only form a nested funnel when the user confirms matching definitions/populations.
  if (input.comparable) {
    const known = metricKeys
      .map((key) => input.metrics[key])
      .filter((value): value is number => value !== null)
    if (known.some((value, index) => index > 0 && value > known[index - 1]))
      invalid(
        'A later funnel count cannot exceed an earlier count when the populations are declared comparable. Check the definitions or turn off comparability.',
      )
  }
  if (
    intent === 'artifact' &&
    (!previous || rank[previous.stage] < rank.diagnosed)
  )
    invalid('Save your diagnosis before completing an artifact.')
  if (intent === 'plan' && (!previous || rank[previous.stage] < rank.artifact))
    invalid('Complete your action artifact before starting the experiment.')
  if (intent === 'artifact' || intent === 'plan') {
    const diagnosis = diagnoseInput(input, profile)
    if (diagnosis.question)
      invalid(
        'Answer and save the remaining follow-up question before completing your work product or experiment.',
      )
    if (previous && diagnoseInput(previous, profile).question)
      invalid('Save your follow-up answers before completing the work product.')
    if (
      diagnosis.artifact === 'cost' &&
      !calculateCosts(input.costs, profile.currency).complete
    )
      invalid(
        'Complete the unit cost worksheet with actual amounts before finishing this cost investigation.',
      )
  }
  if (intent === 'artifact') {
    if (!input.plan.change)
      invalid(
        'Write the concrete change or measurement setup you will take away from this investigation.',
      )
  }
  if (intent === 'plan') {
    if (
      !input.plan.change ||
      !input.plan.successRule ||
      !input.plan.guardrail ||
      !isDateKey(input.plan.reviewDate)
    )
      invalid(
        'Complete the change, review date, success rule, and guardrail before starting the experiment.',
      )
    if (
      input.plan.reviewDate <= input.periodEnd ||
      input.plan.reviewDate < getLocalDateKey(new Date(), profile.timeZone)
    )
      invalid(
        'Choose a review date on or after today and after your baseline reporting period.',
      )
  }
  if (
    intent !== 'checkin' &&
    JSON.stringify(input.checkin) !== JSON.stringify(previous?.checkin ?? null)
  )
    invalid(
      'Save changed check-in observations using the check-in action after starting the experiment.',
    )
  if (intent === 'checkin') {
    if (!previous || rank[previous.stage] < rank.planned)
      invalid('Start an experiment before recording a check-in.')
    const checkin = input.checkin
    if (!checkin || !checkin.source)
      invalid('Add the check-in reporting dates and measurement source.')
    dates(
      checkin.periodStart,
      checkin.periodEnd,
      checkin.metrics.days,
      profile.timeZone,
      true,
    )
    if (checkin.periodStart <= input.periodEnd)
      invalid('The check-in period must begin after the baseline period.')
    if (
      startedAt &&
      checkin.periodStart <
        getLocalDateKey(new Date(startedAt), profile.timeZone)
    )
      invalid(
        'Follow-up observations must begin on or after the experiment was started. Keep earlier measurements as baseline evidence.',
      )
    if (!metricKeys.some((key) => checkin.metrics[key] !== null))
      invalid(
        'Record at least one check-in measurement; unknown values must remain blank.',
      )
    if (checkin.comparable) {
      if (!input.comparable || checkin.metrics.days !== input.metrics.days)
        invalid(
          'Comparisons need matching reporting durations and comparable baseline definitions. Turn off comparability to save observations only.',
        )
      const known = metricKeys
        .map((key) => checkin.metrics[key])
        .filter((value): value is number => value !== null)
      if (known.some((value, index) => index > 0 && value > known[index - 1]))
        invalid(
          'Check the check-in funnel counts or mark the observations as not comparable.',
        )
    }
  }
}
function event(
  owner: string,
  type: ProductEventType,
  investigationId: string | null,
  source: ProductEvent['source'],
  questionKey?: string,
): ProductEvent {
  const item: ProductEvent = {
    id: randomUUID(),
    type,
    investigationId,
    source,
    recordedAt: now(),
    ...(questionKey ? { questionKey } : {}),
  }
  saveRecord(owner, 'product_event', item.id, item)
  return item
}

export function saveInvestigation(
  owner: string,
  raw: unknown,
  id?: string,
): WorkspaceData {
  const v = objectInput(raw)
  if (!intents.includes(v.intent as FocusedIntent))
    invalid('Choose a supported investigation action.')
  const intent = v.intent as FocusedIntent
  const input = parseInput(v.input)
  transaction(() => {
    const previous = id ? requiredInvestigation(owner, id) : null
    if (
      previous &&
      (!Number.isSafeInteger(v.revision) || v.revision !== previous.revision)
    )
      throw new HttpError(
        409,
        'VERSION_CONFLICT',
        'This investigation changed in another tab. Refresh before saving your changes.',
      )
    const profile =
      previous?.profileSnapshot ??
      getRecord<BusinessProfile>(owner, 'profile', 'current')
    if (!profile)
      invalid('Save a business profile before starting an investigation.')
    if (previous && rank[previous.stage] >= rank.planned) {
      if (
        baseline(input) !== baseline(parseInput(previous)) ||
        JSON.stringify(input.plan) !== JSON.stringify(previous.plan)
      )
        throw new HttpError(
          409,
          'BASELINE_LOCKED',
          'This experiment has started. Its baseline and planned criteria are preserved; start a new investigation to change them.',
        )
      if (
        previous.stage === 'reviewed' &&
        JSON.stringify(input.checkin) !== JSON.stringify(previous.checkin)
      )
        throw new HttpError(
          409,
          'CHECKIN_LOCKED',
          'This completed check-in is preserved. Start a new investigation for the next experiment.',
        )
    }
    const startedAt =
      previous && rank[previous.stage] >= rank.planned
        ? listRecords<ProductEvent>(owner, 'product_event').find(
            (item) =>
              item.investigationId === previous.id &&
              item.type === 'experiment_started',
          )?.recordedAt
        : undefined
    validateReady(input, profile, intent, previous, startedAt)
    const coreChanged =
      previous &&
      (baseline(input) !== baseline(parseInput(previous)) ||
        input.plan.change !== previous.plan.change)
    if (intent === 'plan' && previous?.stage === 'artifact' && coreChanged)
      throw new HttpError(
        409,
        'ARTIFACT_CHANGED',
        'Your work product changed. Complete and save it again before starting the experiment.',
      )
    const candidate = targetStage[intent]
    let stage =
      previous && rank[previous.stage] > rank[candidate]
        ? previous.stage
        : candidate
    // A completed work product is tied to the evidence, answers, costs, and exact change reviewed.
    if (
      previous?.stage === 'artifact' &&
      coreChanged &&
      (intent === 'draft' || intent === 'diagnose')
    )
      stage = 'diagnosed'
    const recordedAt = now()
    const investigation: FocusedInvestigation = {
      ...input,
      id: previous?.id ?? randomUUID(),
      profileId: profile.id,
      profileSnapshot: profile,
      revision: (previous?.revision ?? 0) + 1,
      createdAt: previous?.createdAt ?? recordedAt,
      updatedAt: recordedAt,
      stage,
    }
    saveRecord(owner, 'investigation', investigation.id, investigation)
    if (intent === 'diagnose') {
      for (const [key, answer] of Object.entries(input.answers)) {
        if (answer && answer !== previous?.answers[key])
          event(owner, 'question_answered', investigation.id, 'server', key)
      }
    }
    const type = completionEvent[intent]
    const recorded =
      type &&
      listRecords<ProductEvent>(owner, 'product_event').some(
        (item) =>
          item.investigationId === investigation.id && item.type === type,
      )
    const complete =
      intent !== 'diagnose' || diagnoseInput(input, profile).question === null
    if (type && complete && !recorded)
      event(owner, type, investigation.id, 'server')
  })
  return workspace(owner)
}

export function recordProductEvent(owner: string, raw: unknown): ProductEvent {
  const v = objectInput(raw)
  if (v.type !== 'flow_opened' && v.type !== 'return_visit')
    invalid('Choose a supported client event.')
  const type = v.type
  const id =
    v.investigationId == null
      ? null
      : textInput(v.investigationId, 'investigation ID', 200)
  return transaction(() => {
    const investigation = id ? requiredInvestigation(owner, id) : null
    const events = listRecords<ProductEvent>(owner, 'product_event')
    const currentTime = new Date()
    if (type === 'flow_opened') {
      const recent = [...events]
        .reverse()
        .find(
          (item) =>
            item.type === type &&
            currentTime.getTime() - Date.parse(item.recordedAt) < 30 * 60_000,
        )
      if (recent) return recent
    } else {
      if (!investigation) invalid('Select the investigation being revisited.')
      const timeZone = investigation.profileSnapshot.timeZone
      const today = getLocalDateKey(currentTime, timeZone)
      if (today <= getLocalDateKey(new Date(investigation.createdAt), timeZone))
        invalid(
          'A return visit must occur on a later local date than the investigation was created.',
        )
      const todayVisit = events.find(
        (item) =>
          item.type === type &&
          item.investigationId === id &&
          getLocalDateKey(new Date(item.recordedAt), timeZone) === today,
      )
      if (todayVisit) return todayVisit
    }
    return event(owner, type, id, 'client')
  })
}
export function productEvents(owner: string): ProductEvent[] {
  return listRecords<ProductEvent>(owner, 'product_event').slice(-500)
}
export function recordFeedback(owner: string, raw: unknown): FocusedFeedback {
  const v = objectInput(raw)
  const investigationId = textInput(v.investigationId, 'investigation ID', 200)
  requiredInvestigation(owner, investigationId)
  if (!['useful', 'unclear', 'not_useful'].includes(String(v.rating)))
    invalid('Choose a feedback rating.')
  const note = textInput(v.note ?? '', 'feedback note', 5000, false)
  const feedback: FocusedFeedback = {
    id: randomUUID(),
    investigationId,
    rating: v.rating as FocusedFeedback['rating'],
    note,
    recordedAt: now(),
  }
  saveRecord(owner, 'focused_feedback', feedback.id, feedback)
  return feedback
}

export function focusedFeedback(owner: string): FocusedFeedback[] {
  return listRecords<FocusedFeedback>(owner, 'focused_feedback').slice(-500)
}
