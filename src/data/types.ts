// ===== 업종 및 운영 유형 =====
export type IndustryId = 'restaurant' | 'cafe' | 'accommodation' | 'service' | 'online' | 'other'
export type OperationType =
  | 'hall'
  | 'delivery'
  | 'takeout'
  | 'boutique'
  | 'social'
  | 'stay'
  | 'cafe_takeout'
  | 'cafe_stay'
  | 'cafe_dessert'
  | 'cafe_craft'
  | 'cafe_local'
export type StageId = 'idea' | 'preparing' | 'pre-open' | 'operating' | 'plateau' | 'expansion'

// ===== 공통 KPI 영역 (공통전략 Section 5) =====
export type KpiAreaId =
  | 'customer_inflow'
  | 'conversion'
  | 'avg_spending'
  | 'operation_efficiency'
  | 'revisit'
  | 'digital_exposure'
  | 'review_reputation'
  | 'data_management'

// ===== 음식점 진단 지표 (음식점 진단 DB Step2) =====
export type RestaurantIndicatorId =
  | 'main_customer'
  | 'commercial_traffic'
  | 'sales_time_diff'
  | 'menu_competitiveness'
  | 'menu_cost_rate'
  | 'avg_spending_per_customer'
  | 'table_turnover'
  | 'delivery_app_exposure'
  | 'review_rating'
  | 'naver_place_status'
  | 'revisit_rate'

export type AccommodationIndicatorId =
  | 'lodging_positioning'
  | 'occupancy_rate'
  | 'adr_revpar'
  | 'direct_booking_share'
  | 'ota_dependency'
  | 'weekday_weekend_gap'
  | 'visual_content_ctr'
  | 'conversion_rate'
  | 'reply_speed'
  | 'review_reputation'
  | 'naver_trust_layer'
  | 'amenity_transparency'
  | 'ugc_sns'
  | 'housekeeping_efficiency'
  | 'cancellation_rate'

export type CafeIndicatorId =
  | 'cafe_positioning'
  | 'signature_menu'
  | 'menu_cost_rate_cafe'
  | 'avg_basket_size'
  | 'peak_wait_time'
  | 'digital_ordering'
  | 'wallet_loyalty'
  | 'local_seo'
  | 'review_response'
  | 'sns_shortform_ugc'
  | 'local_partnership'
  | 'retention_winback'
  | 'space_productivity'
  | 'sourcing_story'

export type IndicatorId = RestaurantIndicatorId | AccommodationIndicatorId | CafeIndicatorId

// ===== 위험도 =====
export type RiskLevel = 'low' | 'medium' | 'high'

// ===== 상태 수준 =====
export type StatusLevel = 'danger' | 'warning' | 'good' | 'excellent'

// ===== 난이도 =====
export type DifficultyLevel = 'easy' | 'normal' | 'hard'

// ===== 매출 영향도 / 비용 =====
export type ImpactLevel = 'low' | 'medium' | 'high'
export type CostLevel = 'none' | 'low' | 'medium'

// ===== 반복 여부 =====
export type RepeatType = 'once' | 'repeatable' | 'required'

// ===== 질문 답변 옵션 (공통전략 Section 9) =====
export interface QuestionAnswerOption {
  label: string
  score: number
  status_text: string
  risk_level: RiskLevel
  recommended_actions: string[]
}

// ===== 질문 구조 (공통전략 Section 8) =====
export interface DiagnosisQuestion {
  question_id: string
  category: IndicatorId
  business_type: IndustryId
  operation_type?: OperationType[]
  question: string
  answer_options: QuestionAnswerOption[]
  benchmark_text: {
    good: string
    normal: string
    danger: string
  }
  weight: Partial<Record<OperationType, number>>
}

// ===== 액션 카드 (공통전략 Section 12) =====
export interface ActionCard {
  action_id: string
  title: string
  difficulty: DifficultyLevel
  expected_time: string
  impact: ImpactLevel
  cost: CostLevel
  solo_possible: boolean
  repeatable: RepeatType
  recurrence_cycle: string
  execution_steps: string[]
  success_condition: string
  related_indicator: IndicatorId
}

// ===== 벤치마크 상태 문장 (공통전략 Section 13) =====
export interface BenchmarkStatus {
  indicator: IndicatorId
  good: string
  normal: string
  danger: string
}

// ===== 점수별 액션 규칙 (공통전략 Section 11) =====
export const SCORE_ACTION_RULES: { score: number; action_count: number; action_type: string }[] = [
  { score: 5, action_count: 0, action_type: '액션 없음' },
  { score: 4, action_count: 1, action_type: '유지 액션' },
  { score: 3, action_count: 1, action_type: '개선 액션' },
  { score: 2, action_count: 2, action_type: '개선 액션' },
  { score: 1, action_count: 3, action_type: '긴급 액션' },
]

// ===== 실행 기록 (음식점 진단 DB Step 9) =====
export interface ExecutionRecord {
  id: string
  action_id: string
  execution_date: string
  time_spent: string
  difficulty_note: string
  result_memo: string
  evidence?: string
  next_recommended_action?: string
}

// ===== 진단 결과 (음식점 진단 DB Step 8) =====
export interface DiagnosisResult {
  total_score: number
  indicator_scores: Record<IndicatorId, number>
  top_risk_indicators: { indicator: IndicatorId; score: number; risk: RiskLevel }[]
  priority_by_operation: IndicatorId[]
  today_actions: string[]
  week_actions: string[]
  learning_content: string[]
}

// ===== 점수 스냅샷 =====
export interface ScoreSnapshot {
  date: string
  scores: Record<IndicatorId, number>
  totalScore: number
}

// ===== 업종 정보 =====
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

// ===== 재무 스냅샷 =====
export interface FinancialSnapshot {
  monthlyRevenueText: string
  monthlyNetProfitText: string
  evidenceFileNames: string[]
  capturedAt: string
}

// ===== 주간 목표 =====
export interface WeeklyGoal {
  id: string
  title: string
  targetIndicator: IndicatorId
  startDate: string
  endDate: string
  targetActions: string[]
  completedActions: string[]
}

// ===== 비즈니스 메트릭 =====
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

// ===== 지표 정보 =====
export interface IndicatorInfo {
  id: IndicatorId
  label: string
  description: string
  icon: string
  color: string
}

// ===== 전략/학습 자료 (공통 strategies) =====
export type AreaId =
  | 'customer'
  | 'validation'
  | 'product'
  | 'acquisition'
  | 'revenue'
  | 'operation'
  | 'growth'

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
  type: 'article' | 'template' | 'tool'
}
