export type IndustryId = 'restaurant' | 'cafe' | 'accommodation' | 'service' | 'online' | 'other'
export type StageId = 'idea' | 'preparing' | 'pre-open' | 'operating' | 'plateau' | 'expansion'
export type AreaId = 'customer' | 'validation' | 'product' | 'acquisition' | 'revenue' | 'operation' | 'growth'
export type StatusLevel = 'danger' | 'warning' | 'good' | 'excellent'

export type SubIndustryId =
  | 'shopping'
  | 'saas'
  | 'content'
  | 'education'
  | 'marketplace'
  | 'b2c'
  | 'b2b'
  | 'reservation'
  | 'visit'
  | 'subscription'
  | 'hall'
  | 'delivery'
  | 'takeout'
  | 'general_cafe'
  | 'dessert'
  | 'bakery'
  | 'hotel'
  | 'pension'
  | 'airbnb'
  | 'guesthouse'

export type ActionType = 'research' | 'create' | 'test' | 'operate' | 'measure' | 'improve' | 'learn'
export type EvidenceType = 'link' | 'image' | 'number' | 'text'

export interface Industry {
  id: IndustryId
  label: string
  icon: string
  description: string
}

export interface Stage {
  id: StageId
  label: string
  icon: string
  description: string
}

export interface QuestionOption {
  label: string
  score: number
  interpretation: string
}

export interface Question {
  id: string
  text: string
  why: string
  options: QuestionOption[]
  areaId: AreaId
  improvementHint: string
  nextAction?: string
  stageFilter?: StageId[]
  subIndustryFilter?: SubIndustryId[]
}

export interface Area {
  id: AreaId
  label: string
  description: string
  icon: string
  color: string
}

export interface Strategy {
  id: string
  areaId: AreaId
  title: string
  description: string
  steps: string[]
}

export interface Resource {
  id: string
  areaId: AreaId
  title: string
  description: string
  url?: string
  type: 'article' | 'video' | 'tool' | 'template'
}

export interface ActionItem {
  id: string
  title: string
  description: string
  areaId: AreaId
  estimatedTime: string
  criteria: string
  nextActionId?: string
  scoreImpact: number
  actionType: ActionType
  stageFilter?: StageId[]
  industryFilter?: IndustryId[]
  subIndustryFilter?: SubIndustryId[]
  impact?: number
  difficulty?: number
  urgency?: number
  prerequisiteActionIds?: string[]
  requiredEvidenceTypes?: EvidenceType[]
  feedback: {
    completed: string
    partial: string
    skipped: string
  }
}

export interface ActionRecord {
  id: string
  actionId: string
  date: string
  status: 'completed' | 'partial' | 'skipped'
  memo: string
  link: string
  scoreGain: number
  evidence?: { type: EvidenceType; value: string }[]
  evidenceQuality?: 'none' | 'partial' | 'complete'
}

export interface ScoreSnapshot {
  date: string
  scores: Record<AreaId, number>
  totalScore: number
}

export interface SubIndustry {
  id: SubIndustryId
  label: string
  parentIndustry: IndustryId
}

export interface WeeklyGoal {
  id: string
  title: string
  targetAreaId: AreaId
  startDate: string
  endDate: string
  targetActions: string[]
  completedActions: string[]
}

export interface BusinessMetricEntry {
  date: string
  revenue?: number
  customers?: number
  visitors?: number
  reservations?: number
  conversionRate?: number
  reviews?: number
  returnVisitors?: number
  inquiries?: number
}
