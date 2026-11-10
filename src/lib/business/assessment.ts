import { differenceInCalendarDays } from '@/lib/date-time'
import { formatMetric } from './format'
import type { Assessment, AssessmentArea, BusinessProfile, Evidence, Finding, MetricName, RecommendedAction, Result } from './types'
import { actionInvestigationNote, industryTemplate, profileQuestions } from './industry'
import { guidesForAction } from './guides'

const areas: Record<MetricName, AssessmentArea> = { visitors: 'acquisition', purchases: 'conversion', revenue: 'profitability', cost: 'profitability', adSpend: 'acquisition', returningCustomers: 'retention', customers: 'retention' }
const labels: Record<MetricName, string> = { visitors: 'Visitors', purchases: 'Purchases', revenue: 'Revenue', cost: 'Recorded costs', adSpend: 'Advertising spend', returningCustomers: 'Returning customers', customers: 'Customers' }

function comparable(a: Evidence, b: Evidence) {
  return a.periodStart === b.periodStart && a.periodEnd === b.periodEnd && a.unit === b.unit && a.currency === b.currency
}

/** Rules describe reported evidence, never infer business success from task completion. */
export function createAssessment(profile: BusinessProfile, input: Evidence[], previousAssessmentId: string | null = null): Assessment {
  const evidence = input.filter(e => e.profileId === profile.id)
  const facts: Finding[] = evidence.map(e => ({ area: areas[e.metric], description: `${labels[e.metric]}: ${formatMetric(e.value, e.unit, e.currency)} for ${e.periodStart} through ${e.periodEnd}. Source: ${e.sourceNote} (manual, not independently verified).`, evidenceIds: [e.id] }))
  const opportunities: Finding[] = []
  const possibleCauses: string[] = []
  const alternativeExplanations = ['Seasonality, changes in prices or advertising spend, channel mix, and other changes may explain observed differences. This assessment does not establish causation.']
  const missingInformation: string[] = []
  const actions: RecommendedAction[] = []
  const addAction = (kind: RecommendedAction['kind'], area: AssessmentArea, title: string, reason: string, metric: MetricName, priority: number) => {
    actions.push({ id: `${kind}_${area}`, kind, area, title, reason, metric, priority })
  }
  const recentFirst = (a: Evidence, b: Evidence) => b.periodEnd.localeCompare(a.periodEnd) || b.recordedAt.localeCompare(a.recordedAt) || evidence.indexOf(b)-evidence.indexOf(a)
  const latest = (metric: MetricName) => evidence.filter(e => e.metric === metric).sort(recentFirst)[0]
  const matched = (a: MetricName, b: MetricName) => {
    // Find a genuinely aligned pair, rather than comparing two unrelated latest values.
    const rows = evidence.filter(e => e.metric === a).sort(recentFirst)
    for (const x of rows) {
      const y = evidence.filter(e => e.metric === b && comparable(x,e)).sort(recentFirst)[0]
      if (y) return [x,y] as const
    }
    return null
  }
  const groups = new Map<string,Evidence[]>()
  for (const row of evidence) {
    const key = [row.metric,row.unit,row.currency,row.periodStart,row.periodEnd].join(':')
    groups.set(key,[...(groups.get(key) ?? []),row])
  }
  for (const rows of groups.values()) {
    if (new Set(rows.map(row=>row.value)).size > 1) missingInformation.push(`Different ${labels[rows[0].metric].toLowerCase()} values were reported for ${rows[0].periodStart} through ${rows[0].periodEnd}. Derived figures use the latest recorded value; verify which source is correct.`)
  }
  const moneyPair = matched('revenue','cost')
  if (moneyPair) {
    const [revenue,cost] = moneyPair
    const net = revenue.value - cost.value
    facts.push({ area: 'profitability', description: `Revenue minus recorded costs: ${formatMetric(net, 'minor', revenue.currency)} for ${revenue.periodStart} through ${revenue.periodEnd}. This is not verified accounting profit; completeness of costs must be checked.`, evidenceIds: [revenue.id,cost.id] })
    if (net < 0) {
      opportunities.push({ area: 'profitability', description: 'Recorded costs exceed revenue for this period. Check cost completeness, fixed costs, and contribution margins before increasing paid acquisition.', evidenceIds: [revenue.id,cost.id] })
      possibleCauses.push('High fixed costs, low contribution margins, or a temporary revenue shortfall could explain the recorded loss. The available totals cannot distinguish these causes.')
      addAction('review_costs','profitability','Review costs and contribution margins','Recorded costs exceed revenue. Identify whether the issue is fixed costs, unit economics, or missing revenue before increasing advertising spend.','cost',1)
    } else {
      opportunities.push({ area: 'profitability', description: 'Recorded revenue covers recorded costs. Verify all expenses before treating the difference as profit.', evidenceIds: [revenue.id,cost.id] })
    }
  } else {
    missingInformation.push('Add revenue and complete costs for the same period and currency to evaluate profitability. Different currencies and periods are never combined.')
  }
  const conversionPair = matched('visitors','purchases')
  if (conversionPair) {
    const [visitors,purchases] = conversionPair
    if (visitors.value === 0) {
      missingInformation.push('Conversion rate is unavailable because the reported visitor count is zero. Check the source and period; no division by zero was performed.')
    } else if (purchases.value > visitors.value) {
      missingInformation.push('Purchases exceed visitors. Confirm that these are comparable visitor and purchase populations before calculating conversion.')
    } else {
      facts.push({ area: 'conversion', description: `Visitor-to-purchase conversion: ${(purchases.value / visitors.value * 100).toFixed(2)}% (${purchases.value} purchases / ${visitors.value} visitors), ${visitors.periodStart} through ${visitors.periodEnd}. Only valid if both counts describe the same channel and population; source definitions have not been verified. This is a reported rate, not an industry benchmark.`, evidenceIds: [visitors.id,purchases.id] })
      if (purchases.value === 0) {
        opportunities.push({ area: 'conversion', description: 'Visitors were reported without purchases. Investigate tracking, offer clarity, pricing, and checkout friction before assuming a content problem.', evidenceIds: [visitors.id,purchases.id] })
        possibleCauses.push('Unclear product information, a mismatched audience, pricing, checkout friction, or incomplete purchase tracking may contribute to the lack of reported purchases.')
      }
    }
  } else {
    missingInformation.push('Add visitors and purchases for the same period and population to calculate visitor-to-purchase conversion.')
  }
  const retentionPair = matched('customers','returningCustomers')
  if (retentionPair) {
    const [customers,returning] = retentionPair
    if (customers.value > 0 && returning.value <= customers.value) {
      facts.push({ area: 'retention', description: `Returning-customer share: ${(returning.value / customers.value * 100).toFixed(2)}% (${returning.value} returning / ${customers.value} total customers), ${customers.periodStart} through ${customers.periodEnd}. Confirm unique-customer definitions.`, evidenceIds: [customers.id,returning.id] })
    } else missingInformation.push('Check total and returning-customer counts. The denominator must be positive and include the returning-customer population.')
  } else missingInformation.push('Customer and returning-customer counts with matching definitions and periods are needed to evaluate retention.')
  if (evidence.length === 0) missingInformation.unshift('No performance metrics were supplied. Recommendations below are planning suggestions based on your business profile, not measured findings.')
  if (!latest('adSpend')) missingInformation.push('Advertising spend is unknown. No ROAS or paid-channel efficiency claim can be made.')
  const needsBaselineData = missingInformation.length > 0
  missingInformation.push('Operational capacity, fulfillment quality, and bottlenecks have not been measured. No operational health score is available.')
  if (needsBaselineData) addAction('collect_data','operations','Collect the missing baseline data','Use a consistent reporting period, source, population, and currency. Missing values are not treated as zero.',profile.goal==='profitability'?'cost':profile.goal==='retention'?'returningCustomers':profile.goal==='conversion'||profile.goal==='operations'?'purchases':'visitors',moneyPair && moneyPair[0].value < moneyPair[1].value ? 2 : 1)
  if (profile.goal === 'profitability' && !actions.some(a => a.kind === 'review_costs')) {
    addAction('review_costs','profitability','Review your pricing and complete cost breakdown','Your stated goal is profitability. Validate direct and fixed costs before deciding whether more marketing is the right intervention.','cost',2)
  }
  if (profile.goal === 'operations') addAction('review_operations','operations','Document one operational bottleneck','Measure the time and error rate of one recurring process before choosing an automation or content service.','purchases',2)
  if (profile.goal === 'retention') addAction('review_retention','retention','Review repeat-customer feedback','Identify a reason for customers to return and verify permission before contacting them.','returningCustomers',2)
  if (profile.goal === 'awareness' || profile.goal === 'conversion' || profile.goal === 'retention') {
    const area = profile.goal === 'awareness' ? 'acquisition' : profile.goal
    const metric = profile.goal === 'awareness' ? 'visitors' : profile.goal === 'conversion' ? 'purchases' : 'returningCustomers'
    addAction('marketing_assets',area,profile.goal === 'conversion' ? 'Create offer-focused marketing drafts' : profile.goal === 'retention' ? 'Create repeat-customer marketing drafts' : 'Create audience-focused marketing drafts',`Your stated goal is ${profile.goal}. Drafts will use the saved profile and available evidence; they do not establish that content is the cause of a business problem.`,metric,10)
  }
  const template = industryTemplate(profile)
  const questions = profileQuestions(profile).map(question=>({ id: question.id, question: question.question, answer: profile.questionAnswers?.[question.id]?.trim() || null, evidenceHint: question.evidenceHint }))
  for (const question of questions.filter(item=>!item.answer)) missingInformation.push(`${question.question} Helpful records: ${question.evidenceHint}`)
  if (profile.stage === 'planning' || profile.stage === 'launching') missingInformation.push('This business is planning or preparing to launch. Forecasts and intentions are not recorded operating performance; validate assumptions before drawing performance conclusions.')
  for (const action of actions) {
    action.guideIds = guidesForAction(action,template.id)
    const note = actionInvestigationNote(profile,action)
    if (note) action.reason += ` ${note}`
  }
  return { id: crypto.randomUUID(), profileId: profile.id, profileVersion: profile.version, profileSnapshot: structuredClone(profile), createdAt: new Date().toISOString(), evidenceIds: evidence.map(e => e.id), facts, opportunities, possibleCauses, alternativeExplanations, missingInformation, recommendedActions: actions.sort((a,b) => a.priority - b.priority), previousAssessmentId, industryContext: { businessType: template.id, label: template.label, stage: profile.stage ?? 'not_sure', interpretations: template.interpretations, questions } }
}

export function resultToEvidence(result: Result, profileId: string): Evidence {
  return { id: `result_${result.id}`, profileId, metric: result.metric, value: result.value, unit: result.unit, currency: result.currency, periodStart: result.periodStart, periodEnd: result.periodEnd, source: result.source, sourceNote: `${result.sourceNote}; linked execution ${result.executionId}`, recordedAt: result.recordedAt }
}

export interface ResultComparison { comparable: boolean; difference: number | null; percentChange: number | null; reason: string; caveats: string[] }
export function compareResults(before: Pick<Evidence,'metric'|'value'|'unit'|'currency'|'periodStart'|'periodEnd'>, after: Pick<Evidence,'metric'|'value'|'unit'|'currency'|'periodStart'|'periodEnd'>): ResultComparison {
  const unavailable = (reason: string): ResultComparison => ({ comparable: false, difference: null, percentChange: null, reason, caveats: [] })
  if (before.metric !== after.metric || before.unit !== after.unit || before.currency !== after.currency) return unavailable('The metric, unit, and currency must match. No conversion or aggregation was performed.')
  if (after.periodStart <= before.periodEnd) return unavailable('Before and after reporting periods must not overlap.')
  const beforeDays = differenceInCalendarDays(before.periodEnd,before.periodStart)+1
  const afterDays = differenceInCalendarDays(after.periodEnd,after.periodStart)+1
  if (beforeDays !== afterDays) return unavailable('Reporting periods have different lengths. Compare matching durations.')
  const caveats = ['This is a descriptive comparison. It does not show that NEXORA or the asset caused the change. Review advertising spend, price changes, seasonality, and other interventions.']
  if (beforeDays < 7) caveats.push('The observation period is short. Collect more observations before drawing conclusions.')
  if (before.unit === 'count' && (before.value < 20 || after.value < 20)) caveats.push('The recorded counts are small. This comparison does not establish a reliable trend or statistical significance.')
  return { comparable: true, difference: after.value-before.value, percentChange: before.value === 0 ? null : (after.value-before.value)/before.value*100, reason: before.value === 0 ? 'Percentage change is undefined because the baseline is zero.' : 'Matching metric, currency, and non-overlapping periods of equal duration.', caveats }
}
