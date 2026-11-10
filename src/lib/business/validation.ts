import { isDateKey } from '@/lib/date-time'
import type { AppLocale, AssetCounts, BusinessProfileInput, EvidenceInput, GeneratedPackage, GenerationInput, MetricName, Result } from './types'
import { BUSINESS_STAGES, INDUSTRY_TEMPLATES, profileQuestions } from './industry'

export class InputError extends Error {
  readonly code = 'INVALID_INPUT'
  readonly status = 400
}
export const METRIC_NAMES: MetricName[] = ['visitors', 'purchases', 'revenue', 'cost', 'adSpend', 'returningCustomers', 'customers']
const moneyMetrics = new Set<MetricName>(['revenue', 'cost', 'adSpend'])
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError('Check the submitted information.')
  return value as Record<string, unknown>
}
function string(value: unknown, label: string, max = 2000, optional = false): string {
  if (typeof value !== 'string' || value.length > max || (!optional && !value.trim())) throw new InputError(`Enter a valid ${label}.`)
  return value.trim()
}
function integer(value: unknown, label: string, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > max) throw new InputError(`Enter a valid ${label}.`)
  return value
}
export function parseLocale(value: unknown): AppLocale {
  if (value !== 'en-US' && value !== 'ko-KR') throw new InputError('Choose a supported language.')
  return value
}
export function parseCurrency(value: unknown): string {
  const currency = string(value, 'currency code', 3)
  if (!/^[A-Z]{3}$/.test(currency) || !Intl.supportedValuesOf('currency').includes(currency)) throw new InputError('Use a supported three-letter currency code.')
  try { new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(0) } catch { throw new InputError('Choose a supported currency.') }
  return currency
}
export function createProfileDefaults(timeZone = 'UTC'): BusinessProfileInput {
  return { name: '', industry: '', businessType: 'general', stage: 'not_sure', questionAnswers: {}, entityType: 'individual', teamSize: 1, offering: '', customerType: '', targetMarket: 'United States', goal: 'awareness', salesChannels: [], brandTone: 'Clear, helpful, and professional', website: '', uiLocale: 'en-US', contentLocale: 'en-US', currency: 'USD', timeZone }
}
export function parseProfileInput(value: unknown): BusinessProfileInput {
  const v = object(value)
  if (!['individual', 'company'].includes(String(v.entityType))) throw new InputError('Choose individual or company.')
  if (!['awareness', 'conversion', 'retention', 'profitability', 'operations'].includes(String(v.goal))) throw new InputError('Choose a business goal.')
  const timeZone = string(v.timeZone, 'IANA time zone', 100)
  try { new Intl.DateTimeFormat('en-US', { timeZone }).format() } catch { throw new InputError('Choose a valid IANA time zone.') }
  if (!Array.isArray(v.salesChannels) || v.salesChannels.length > 12) throw new InputError('Enter up to 12 sales channels, or skip if unknown.')
  const website = string(v.website ?? '', 'website URL', 2000, true)
  if (website) {
    try { const url = new URL(website); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error() } catch { throw new InputError('Enter an http or https website URL. URLs are not fetched or analyzed.') }
  }
  const teamSize = integer(v.teamSize, 'team size', 1000000)
  if (teamSize < 1) throw new InputError('Team size must be at least one.')
  const businessType = INDUSTRY_TEMPLATES.find(item => item.id === v.businessType)?.id ?? 'general'
  const stage = BUSINESS_STAGES.find(item => item.id === v.stage)?.id ?? 'not_sure'
  const answers = v.questionAnswers == null ? {} : object(v.questionAnswers)
  const allowedQuestions = new Set(profileQuestions({ businessType, stage }).map(item => item.id))
  const questionAnswers = Object.fromEntries(Object.entries(answers).filter(([id]) => allowedQuestions.has(id)).map(([id, answer]) => [id, string(answer, 'question answer', 3000, true)]))
  return { name: string(v.name ?? '', 'business name', 160, true), industry: string(v.industry ?? '', 'industry', 160, true), businessType, stage, questionAnswers, entityType: v.entityType as BusinessProfileInput['entityType'], teamSize, offering: string(v.offering ?? '', 'product or service', 5000, true), customerType: string(v.customerType ?? '', 'target customer', 2000, true), targetMarket: string(v.targetMarket, 'target market', 160), goal: v.goal as BusinessProfileInput['goal'], salesChannels: v.salesChannels.map(c => string(c, 'channel', 100)), brandTone: string(v.brandTone ?? '', 'brand tone', 1000, true), website, uiLocale: 'en-US', contentLocale: 'en-US', currency: parseCurrency(v.currency), timeZone }
}
export function parseEvidenceInput(value: unknown): EvidenceInput {
  const v = object(value)
  if (!METRIC_NAMES.includes(v.metric as MetricName)) throw new InputError('Choose a supported metric.')
  const metric = v.metric as MetricName
  const unit = moneyMetrics.has(metric) ? 'minor' : 'count'
  if (v.unit !== unit) throw new InputError('The metric unit does not match its value.')
  const currency = unit === 'minor' ? parseCurrency(v.currency) : null
  if (unit === 'count' && v.currency != null && v.currency !== '') throw new InputError('Counts must not have a currency.')
  if (!isDateKey(v.periodStart) || !isDateKey(v.periodEnd) || v.periodEnd < v.periodStart) throw new InputError('Enter a valid start and end date.')
  if (v.source !== 'manual') throw new InputError('Only manually entered evidence is currently available.')
  return { metric, value: integer(v.value, 'metric value'), unit, currency, periodStart: v.periodStart, periodEnd: v.periodEnd, source: 'manual', sourceNote: string(v.sourceNote, 'source description', 1000) }
}
export function parseResultInput(value: unknown): Omit<Result, 'id' | 'recordedAt'> {
  const v = object(value)
  const evidence = parseEvidenceInput(v)
  const adSpendMinor = v.adSpendMinor == null ? null : integer(v.adSpendMinor, 'advertising spend')
  const adSpendCurrency = adSpendMinor === null ? null : parseCurrency(v.adSpendCurrency)
  return { ...evidence, executionId: string(v.executionId, 'execution ID', 200), adSpendMinor, adSpendCurrency, priceChangeNote: string(v.priceChangeNote ?? '', 'price change note', 2000, true), notes: string(v.notes ?? '', 'result notes', 5000, true) }
}
export function parseGenerationInput(value: unknown): GenerationInput {
  const v = object(value)
  const c = object(v.counts)
  const counts: AssetCounts = { hooks: integer(c.hooks, 'hook count', 5), adCopy: integer(c.adCopy, 'ad copy count', 5), scripts: integer(c.scripts, 'script count', 5), ctas: integer(c.ctas, 'CTA count', 5) }
  if (Object.values(counts).reduce((a, b) => a + b, 0) < 1) throw new InputError('Request at least one asset.')
  const idempotencyKey = string(v.idempotencyKey, 'request key', 128)
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(idempotencyKey)) throw new InputError('Use a valid request key.')
  const referenceText = string(v.referenceText ?? '', 'reference text', 12000, true)
  const referenceSource = string(v.referenceSource ?? '', 'reference source', 2000, true)
  if (referenceText && !referenceSource) throw new InputError('Describe the source of the reference material.')
  if (v.useApprovedContext !== undefined && typeof v.useApprovedContext !== 'boolean') throw new InputError('Choose whether to use approved wording.')
  return { assessmentId: string(v.assessmentId, 'assessment ID', 200), actionId: string(v.actionId, 'action ID', 200), idempotencyKey, counts, referenceText: referenceText || undefined, referenceSource: referenceText ? referenceSource : undefined, replacesJobId: v.replacesJobId ? string(v.replacesJobId, 'previous job ID', 200) : undefined, useApprovedContext: v.useApprovedContext === true ? true : undefined }
}
export function validateGeneratedPackage(value: unknown, counts: AssetCounts, expectedLocale: AppLocale, hasReference = false): GeneratedPackage {
  const v = object(value)
  if (v.language !== expectedLocale) throw new InputError('The generated language does not match the requested language. Please try again.')
  if (!Array.isArray(v.assets) || v.assets.length !== Object.values(counts).reduce((a,b) => a+b,0)) throw new InputError('The generated package is incomplete. Please try again.')
  const actual: Record<string, number> = { hook: 0, ad_copy: 0, short_script: 0, cta: 0 }
  const assets = v.assets.map(item => {
    const a = object(item)
    if (!Object.hasOwn(actual, String(a.kind))) throw new InputError('The provider returned an unsupported asset type.')
    actual[String(a.kind)]++
    if (!METRIC_NAMES.includes(a.measurementMetric as MetricName)) throw new InputError('The generated measurement metric is invalid.')
    if (!Array.isArray(a.claimsToVerify) || a.claimsToVerify.length > 20) throw new InputError('The generated claims checklist is invalid.')
    return { kind: a.kind as GeneratedPackage['assets'][number]['kind'], title: string(a.title, 'asset title', 200), body: string(a.body, 'asset body', 12000), linkedProblem: string(a.linkedProblem, 'linked problem', 2000), target: string(a.target, 'target customer', 2000), keyMessage: string(a.keyMessage, 'key message', 2000), channel: string(a.channel, 'channel', 200), expectedAction: string(a.expectedAction, 'expected action', 1000), measurementMetric: a.measurementMetric as MetricName, claimsToVerify: a.claimsToVerify.map(c => string(c, 'claim to verify', 1000)) }
  })
  if (actual.hook !== counts.hooks || actual.ad_copy !== counts.adCopy || actual.short_script !== counts.scripts || actual.cta !== counts.ctas) throw new InputError('The provider returned the wrong mix of assets. Please try again.')
  if (!hasReference && v.referenceAnalysis !== null) throw new InputError('Reference analysis was returned without supplied reference material.')
  return { language: expectedLocale, referenceAnalysis: hasReference && v.referenceAnalysis !== null ? string(v.referenceAnalysis, 'reference analysis', 6000) : null, assets }
}
