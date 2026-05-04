export type IndustryId = 'restaurant' | 'cafe' | 'accommodation' | 'service' | 'online' | 'other'
export type StageId = 'idea' | 'preparing' | 'pre-open' | 'operating' | 'plateau' | 'expansion'
export type AreaId = 'customer' | 'validation' | 'product' | 'acquisition' | 'revenue' | 'operation' | 'growth'
export type StatusLevel = 'danger' | 'warning' | 'good' | 'excellent'

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
}

export interface ActionRecord {
  id: string
  actionId: string
  date: string
  status: 'completed' | 'partial' | 'skipped'
  memo: string
  link: string
  scoreGain: number
}

export interface ScoreSnapshot {
  date: string
  scores: Record<AreaId, number>
  totalScore: number
}
