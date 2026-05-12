'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  IndustryId,
  StageId,
  OperationType,
  IndicatorId,
  ExecutionRecord,
  ScoreSnapshot,
  WeeklyGoal,
  BusinessMetricEntry,
  FinancialSnapshot,
} from '@/data/types'
import { getActionById } from '@/data/actions'

interface AppStore {
  // 온보딩
  industry: IndustryId | null
  stage: StageId | null
  operationType: OperationType | null
  financialSnapshot: FinancialSnapshot | null

  // 진단
  answers: Record<string, number>
  scores: Record<IndicatorId, number>
  diagnosisCompleted: boolean

  // 실행
  todayActionIds: string[]
  executionRecords: ExecutionRecord[]

  // 히스토리
  scoreHistory: ScoreSnapshot[]

  // 주간 목표
  weeklyGoal: WeeklyGoal | null

  // 비즈니스 지표
  businessMetrics: BusinessMetricEntry[]

  // 스트릭
  streak: number
  lastActionDate: string | null

  // 액션
  setIndustry: (industry: IndustryId) => void
  setStage: (stage: StageId) => void
  setOperationType: (type: OperationType) => void
  setFinancialSnapshot: (snapshot: FinancialSnapshot | null) => void
  setAnswer: (questionId: string, score: number) => void
  setScores: (scores: Record<IndicatorId, number>) => void
  completeDiagnosis: (scores: Record<IndicatorId, number>) => void
  setTodayActions: (actionIds: string[]) => void
  addExecutionRecord: (record: ExecutionRecord) => void
  updateScores: (newScores: Record<IndicatorId, number>) => void
  resetDiagnosis: () => void
  reset: () => void
  setWeeklyGoal: (goal: WeeklyGoal) => void
  addBusinessMetric: (entry: BusinessMetricEntry) => void
  calculateStreak: () => void
}

const defaultScores: Record<IndicatorId, number> = {
  main_customer: 0,
  commercial_traffic: 0,
  sales_time_diff: 0,
  menu_competitiveness: 0,
  menu_cost_rate: 0,
  avg_spending_per_customer: 0,
  table_turnover: 0,
  delivery_app_exposure: 0,
  review_rating: 0,
  naver_place_status: 0,
  revisit_rate: 0,
  lodging_positioning: 0,
  occupancy_rate: 0,
  adr_revpar: 0,
  direct_booking_share: 0,
  ota_dependency: 0,
  weekday_weekend_gap: 0,
  visual_content_ctr: 0,
  conversion_rate: 0,
  reply_speed: 0,
  review_reputation: 0,
  naver_trust_layer: 0,
  amenity_transparency: 0,
  ugc_sns: 0,
  housekeeping_efficiency: 0,
  cancellation_rate: 0,
  cafe_positioning: 0,
  signature_menu: 0,
  menu_cost_rate_cafe: 0,
  avg_basket_size: 0,
  peak_wait_time: 0,
  digital_ordering: 0,
  wallet_loyalty: 0,
  local_seo: 0,
  review_response: 0,
  sns_shortform_ugc: 0,
  local_partnership: 0,
  retention_winback: 0,
  space_productivity: 0,
  sourcing_story: 0,
}

function getTotalScoreFromScores(scores: Record<IndicatorId, number>) {
  const values = Object.values(scores)
  return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
}

function buildScoreSnapshot(scores: Record<IndicatorId, number>): ScoreSnapshot {
  return {
    date: new Date().toISOString().split('T')[0],
    scores,
    totalScore: getTotalScoreFromScores(scores),
  }
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      industry: null,
      stage: null,
      operationType: null,
      financialSnapshot: null,
      answers: {},
      scores: { ...defaultScores },
      diagnosisCompleted: false,
      todayActionIds: [],
      executionRecords: [],
      scoreHistory: [],
      weeklyGoal: null,
      businessMetrics: [],
      streak: 0,
      lastActionDate: null,

      setIndustry: (industry) => set({ industry }),
      setStage: (stage) => set({ stage }),
      setOperationType: (type) => set({ operationType: type }),
      setFinancialSnapshot: (snapshot) => set({ financialSnapshot: snapshot }),
      setAnswer: (questionId, score) =>
        set(state => ({ answers: { ...state.answers, [questionId]: score } })),
      setScores: (scores) => set({ scores }),
      completeDiagnosis: (scores) => {
        const snapshot = buildScoreSnapshot(scores)
        set(state => ({
          scores,
          diagnosisCompleted: true,
          scoreHistory: [...state.scoreHistory, snapshot],
        }))
      },
      setTodayActions: (actionIds) => set({ todayActionIds: actionIds }),
      addExecutionRecord: (record) =>
        set(state => {
          const newRecords = [record, ...state.executionRecords]
          // 액션 완료 시 관련 지표 점수 자동 향상 (PDF: 실행 → 점수 반영)
          const action = getActionById(record.action_id)
          if (action) {
            const indicator = action.related_indicator
            const currentScore = state.scores[indicator] || 0
            // 근거 자료가 있으면 +5, 없으면 +3
            const gain = record.evidence ? 5 : 3
            const newScore = Math.min(100, currentScore + gain)
            const newScores = { ...state.scores, [indicator]: newScore }
            const snapshot: ScoreSnapshot = {
              date: new Date().toISOString().split('T')[0],
              scores: newScores,
              totalScore: Math.round(Object.values(newScores).reduce((a, b) => a + b, 0) / Object.keys(newScores).length),
            }
            return {
              executionRecords: newRecords,
              scores: newScores,
              scoreHistory: [...state.scoreHistory, snapshot],
            }
          }
          return { executionRecords: newRecords }
        }),
      updateScores: (newScores) => {
        const snapshot = buildScoreSnapshot(newScores)
        set(state => ({
          scores: newScores,
          scoreHistory: [...state.scoreHistory, snapshot],
        }))
      },
      resetDiagnosis: () =>
        set({ industry: null, stage: null, operationType: null, financialSnapshot: null, answers: {}, scores: { ...defaultScores }, diagnosisCompleted: false }),
      reset: () =>
        set({
          industry: null,
          stage: null,
          operationType: null,
          financialSnapshot: null,
          answers: {},
          scores: { ...defaultScores },
          diagnosisCompleted: false,
          todayActionIds: [],
          executionRecords: [],
          scoreHistory: [],
          weeklyGoal: null,
          businessMetrics: [],
          streak: 0,
          lastActionDate: null,
        }),
      setWeeklyGoal: (goal) => set({ weeklyGoal: goal }),
      addBusinessMetric: (entry) =>
        set(state => ({ businessMetrics: [...state.businessMetrics, entry] })),
      calculateStreak: () => {
        const { executionRecords } = get()
        if (executionRecords.length === 0) {
          set({ streak: 0, lastActionDate: null })
          return
        }

        const dates = Array.from(
          new Set(executionRecords.map(r => r.execution_date))
        ).sort((a, b) => b.localeCompare(a))

        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        const mostRecent = dates[0]

        if (mostRecent !== today && mostRecent !== yesterday) {
          set({ streak: 0, lastActionDate: mostRecent })
          return
        }

        let streak = 1
        for (let i = 1; i < dates.length; i++) {
          const prev = new Date(dates[i - 1])
          const curr = new Date(dates[i])
          const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000)
          if (diffDays === 1) {
            streak++
          } else {
            break
          }
        }

        set({ streak, lastActionDate: mostRecent })
      },
    }),
    {
      name: 'startup-platform-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
