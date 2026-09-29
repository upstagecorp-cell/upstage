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
import { getTotalScore } from '@/lib/scoring'
import { getLocalDateKey, getTemporalContext } from '@/lib/date-time'
import { calculateStreakFromDates } from '@/lib/streak'
import {
  createDefaultPersistedState,
  DEFAULT_SCORES,
  sanitizePersistedState,
  type PersistedAppState,
} from '@/lib/store-persistence'

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
  addExecutionRecord: (record: ExecutionRecord) => void
  updateScores: (newScores: Record<IndicatorId, number>) => void
  resetDiagnosis: () => void
  reset: () => void
  setWeeklyGoal: (goal: WeeklyGoal | null) => void
  addBusinessMetric: (entry: BusinessMetricEntry) => void
  calculateStreak: () => void
}

function getTotalScoreFromScores(scores: Record<IndicatorId, number>, operationType: OperationType | null) {
  if (operationType) return getTotalScore(scores, operationType)
  const values = Object.values(scores)
  return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
}

function buildScoreSnapshot(scores: Record<IndicatorId, number>, operationType: OperationType | null): ScoreSnapshot {
  const temporal = getTemporalContext()
  return {
    date: temporal.localDate,
    recordedAt: temporal.recordedAt,
    timeZone: temporal.timeZone,
    locale: temporal.locale,
    scores,
    totalScore: getTotalScoreFromScores(scores, operationType),
  }
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...createDefaultPersistedState(),

      setIndustry: (industry) => set((state) => ({
        industry,
        operationType: state.industry === industry ? state.operationType : null,
      })),
      setStage: (stage) => set({ stage }),
      setOperationType: (type) => set({ operationType: type }),
      setFinancialSnapshot: (snapshot) => set({ financialSnapshot: snapshot }),
      setAnswer: (questionId, score) =>
        set(state => ({ answers: { ...state.answers, [questionId]: score } })),
      setScores: (scores) => set({ scores }),
      completeDiagnosis: (scores) => {
        const snapshot = buildScoreSnapshot(scores, get().operationType)
        set(state => ({
          scores,
          diagnosisCompleted: true,
          scoreHistory: [...state.scoreHistory, snapshot],
        }))
      },
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
            const snapshot = buildScoreSnapshot(newScores, state.operationType)
            return {
              executionRecords: newRecords,
              scores: newScores,
              scoreHistory: [...state.scoreHistory, snapshot],
            }
          }
          return { executionRecords: newRecords }
        }),
      updateScores: (newScores) => {
        const snapshot = buildScoreSnapshot(newScores, get().operationType)
        set(state => ({
          scores: newScores,
          scoreHistory: [...state.scoreHistory, snapshot],
        }))
      },
      resetDiagnosis: () =>
        set({ industry: null, stage: null, operationType: null, financialSnapshot: null, answers: {}, scores: { ...DEFAULT_SCORES }, diagnosisCompleted: false }),
      reset: () =>
        set(createDefaultPersistedState()),
      setWeeklyGoal: (goal) => set({ weeklyGoal: goal }),
      addBusinessMetric: (entry) =>
        set(state => ({
          businessMetrics: [
            ...state.businessMetrics.filter((metric) => metric.date !== entry.date),
            entry,
          ].sort((a, b) => a.date.localeCompare(b.date)),
        })),
      calculateStreak: () => {
        const { executionRecords } = get()
        set(calculateStreakFromDates(
          executionRecords.map((record) => record.execution_date),
          getLocalDateKey()
        ))
      },
    }),
    {
      name: 'startup-platform-store',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState) => sanitizePersistedState(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizePersistedState(persistedState),
      }),
      partialize: (state): PersistedAppState => ({
        industry: state.industry,
        stage: state.stage,
        operationType: state.operationType,
        financialSnapshot: state.financialSnapshot,
        answers: state.answers,
        scores: state.scores,
        diagnosisCompleted: state.diagnosisCompleted,
        executionRecords: state.executionRecords,
        scoreHistory: state.scoreHistory,
        weeklyGoal: state.weeklyGoal,
        businessMetrics: state.businessMetrics,
        streak: state.streak,
        lastActionDate: state.lastActionDate,
      }),
    }
  )
)
