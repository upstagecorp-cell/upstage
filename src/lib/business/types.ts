export type AppLocale = 'en-US' | 'ko-KR'
export type BusinessGoal = 'awareness' | 'conversion' | 'retention' | 'profitability' | 'operations'
export type AssessmentArea = 'acquisition' | 'conversion' | 'retention' | 'profitability' | 'operations'
export type MetricName = 'visitors' | 'purchases' | 'revenue' | 'cost' | 'adSpend' | 'returningCustomers' | 'customers'
export type BusinessStage = 'planning' | 'launching' | 'operating' | 'growing' | 'not_sure'
export type BusinessType = 'general' | 'restaurant' | 'cafe' | 'accommodation' | 'retail' | 'ecommerce' | 'services' | 'creator'
export interface BusinessProfile {
  id: string
  version: number
  name: string
  industry: string
  entityType: 'individual' | 'company'
  teamSize: number
  offering: string
  customerType: string
  targetMarket: string
  goal: BusinessGoal
  salesChannels: string[]
  brandTone: string
  website: string
  uiLocale: AppLocale
  contentLocale: AppLocale
  currency: string
  timeZone: string
  updatedAt: string
  businessType?: BusinessType
  stage?: BusinessStage
  questionAnswers?: Record<string, string>
}
export type BusinessProfileInput = Omit<BusinessProfile, 'id' | 'version' | 'updatedAt'>
export interface Evidence {
  id: string
  profileId: string
  metric: MetricName
  value: number
  unit: 'count' | 'minor'
  currency: string | null
  periodStart: string
  periodEnd: string
  source: 'manual'
  sourceNote: string
  recordedAt: string
}
export type EvidenceInput = Omit<Evidence, 'id' | 'profileId' | 'recordedAt'>
export interface Finding {
  area: AssessmentArea
  description: string
  evidenceIds: string[]
}
export interface RecommendedAction {
  id: string
  area: AssessmentArea
  title: string
  reason: string
  kind: 'collect_data' | 'review_costs' | 'marketing_assets' | 'review_operations' | 'review_retention'
  metric: MetricName
  priority: number
  guideIds?: string[]
}
export interface Assessment {
  id: string
  profileId: string
  profileVersion: number
  profileSnapshot: BusinessProfile
  createdAt: string
  evidenceIds: string[]
  facts: Finding[]
  opportunities: Finding[]
  possibleCauses: string[]
  alternativeExplanations: string[]
  missingInformation: string[]
  recommendedActions: RecommendedAction[]
  previousAssessmentId: string | null
  industryContext?: {
    businessType: BusinessType
    label: string
    stage: BusinessStage
    interpretations: string[]
    questions: Array<{ id: string; question: string; answer: string | null; evidenceHint: string }>
  }
}
export type AssetKind = 'hook' | 'ad_copy' | 'short_script' | 'cta'
export interface AssetVersion {
  version: number
  title: string
  body: string
  createdAt: string
  reviewStatus: 'draft' | 'approved'
  approvedAt: string | null
}
export interface Asset {
  id: string
  jobId: string
  assessmentId: string
  actionId: string
  profileId: string
  kind: AssetKind
  language: AppLocale
  linkedProblem: string
  target: string
  keyMessage: string
  channel: string
  expectedAction: string
  measurementMetric: MetricName
  claimsToVerify: string[]
  versions: AssetVersion[]
  currentVersion: number
}
export interface AssetCounts { hooks: number; adCopy: number; scripts: number; ctas: number }
export interface GenerationInput {
  assessmentId: string
  actionId: string
  idempotencyKey: string
  counts: AssetCounts
  referenceText?: string
  referenceSource?: string
  replacesJobId?: string
}
export interface GeneratedAsset {
  kind: AssetKind
  title: string
  body: string
  linkedProblem: string
  target: string
  keyMessage: string
  channel: string
  expectedAction: string
  measurementMetric: MetricName
  claimsToVerify: string[]
}
export interface GeneratedPackage {
  language: AppLocale
  referenceAnalysis: string | null
  assets: GeneratedAsset[]
}
export interface ExecutionJob {
  id: string
  assessmentId: string
  actionId: string
  status: 'running' | 'succeeded' | 'failed'
  provider: string
  model: string
  idempotencyKey: string
  createdAt: string
  completedAt: string | null
  errorCode: string | null
  referenceAnalysis: string | null
  referenceSource: string | null
  replacesJobId: string | null
}
export interface AssetExecution {
  id: string
  assetId: string | null
  assetVersion: number | null
  assessmentId?: string
  actionId?: string
  channel: string
  usedAt: string
  recordedAt: string
  notes: string
  status: 'used'
}
export interface Result {
  id: string
  executionId: string
  metric: MetricName
  value: number
  unit: 'count' | 'minor'
  currency: string | null
  periodStart: string
  periodEnd: string
  adSpendMinor: number | null
  adSpendCurrency: string | null
  priceChangeNote: string
  source: 'manual'
  sourceNote: string
  notes: string
  recordedAt: string
}
export interface UsageRecord {
  id: string
  jobId: string
  operation: 'marketing_package'
  provider: string
  model: string
  status: 'succeeded' | 'failed'
  inputTokens: number | null
  outputTokens: number | null
  estimated: boolean
  recordedAt: string
}
export interface SessionUser { id: string; email: string; locale: AppLocale }
export interface LegacyImport {
  importedAt: string
  locale: AppLocale | null
  currency: 'KRW'
  data: Record<string, unknown>
}
export interface WorkspaceData {
  profile: BusinessProfile | null
  evidence: Evidence[]
  assessments: Assessment[]
  jobs: ExecutionJob[]
  assets: Asset[]
  executions: AssetExecution[]
  results: Result[]
  usage: UsageRecord[]
  legacyImport: LegacyImport | null
  generationAvailable: boolean
  weeklyPlans: WeeklyPlan[]
}

export type PlanStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'
export interface WeeklyPlan {
  id: string
  profileId: string
  assessmentId: string
  actionId: string
  title: string
  weekStart: string
  dueDate: string
  timeZone: string
  status: PlanStatus
  evaluationMetric: MetricName
  assetLinks: Array<{ assetId: string; version: number }>
  notes: string
  createdAt: string
  updatedAt: string
}
