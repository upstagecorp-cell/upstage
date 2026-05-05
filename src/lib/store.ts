'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { IndustryId, StageId, AreaId, ActionRecord, ScoreSnapshot, SubIndustryId, WeeklyGoal, BusinessMetricEntry } from '@/data/types'
import { ACTION_POOL, getActionById } from '@/data/actions'

interface AppStore {
  // 온보딩
  industry: IndustryId | null
  stage: StageId | null
  subIndustry: SubIndustryId | null

  // 진단
  answers: Record<string, number>
  scores: Record<AreaId, number>
  diagnosisCompleted: boolean

  // 실행
  todayActionIds: string[]
  actionRecords: ActionRecord[]

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
  setSubIndustry: (subIndustry: SubIndustryId) => void
  setAnswer: (questionId: string, score: number) => void
  setScores: (scores: Record<AreaId, number>) => void
  completeDiagnosis: (scores: Record<AreaId, number>) => void
  setTodayActions: (actionIds: string[]) => void
  addActionRecord: (record: ActionRecord) => void
  updateScores: (newScores: Record<AreaId, number>) => void
  resetDiagnosis: () => void
  reset: () => void
  setWeeklyGoal: (goal: WeeklyGoal) => void
  addBusinessMetric: (entry: BusinessMetricEntry) => void
  calculateStreak: () => void
}

const defaultScores: Record<AreaId, number> = {
  customer: 0,
  validation: 0,
  product: 0,
  acquisition: 0,
  revenue: 0,
  operation: 0,
  growth: 0,
}

function getTotalScore(scores: Record<AreaId, number>) {
  return Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 7)
}

function buildScoreSnapshot(scores: Record<AreaId, number>): ScoreSnapshot {
  return {
    date: new Date().toISOString().split('T')[0],
    scores,
    totalScore: getTotalScore(scores),
  }
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score))
}

function applyMetricSignals(
  scores: Record<AreaId, number>,
  entry: BusinessMetricEntry
): Record<AreaId, number> {
  const next = { ...scores }
  const bump = (areaId: AreaId) => {
    next[areaId] = clampScore((next[areaId] ?? 0) + 1)
  }

  if (entry.revenue !== undefined) bump('revenue')
  if (entry.customers !== undefined || entry.returnVisitors !== undefined) bump('customer')
  if (entry.visitors !== undefined || entry.inquiries !== undefined) bump('acquisition')
  if (entry.conversionRate !== undefined) bump('validation')
  if (entry.reservations !== undefined) bump('operation')
  if (entry.reviews !== undefined) bump('growth')

  return next
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      industry: null,
      stage: null,
      subIndustry: null,
      answers: {},
      scores: { ...defaultScores },
      diagnosisCompleted: false,
      todayActionIds: [],
      actionRecords: [],
      scoreHistory: [],
      weeklyGoal: null,
      businessMetrics: [],
      streak: 0,
      lastActionDate: null,

      setIndustry: (industry) => set({ industry }),
      setStage: (stage) => set({ stage }),
      setSubIndustry: (subIndustry) => set({ subIndustry }),
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
      addActionRecord: (record) =>
        set(state => {
          const action = getActionById(record.actionId)
          const weeklyGoal = state.weeklyGoal
          const shouldUpdateGoal =
            record.status === 'completed' &&
            action &&
            weeklyGoal &&
            weeklyGoal.targetAreaId === action.areaId &&
            !weeklyGoal.completedActions.includes(record.actionId)

          return {
            actionRecords: [record, ...state.actionRecords],
            weeklyGoal: shouldUpdateGoal
              ? {
                  ...weeklyGoal,
                  targetActions: weeklyGoal.targetActions.includes(record.actionId)
                    ? weeklyGoal.targetActions
                    : [...weeklyGoal.targetActions, record.actionId],
                  completedActions: [...weeklyGoal.completedActions, record.actionId],
                }
              : weeklyGoal,
          }
        }),
      updateScores: (newScores) => {
        const snapshot = buildScoreSnapshot(newScores)
        set(state => ({
          scores: newScores,
          scoreHistory: [...state.scoreHistory, snapshot],
        }))
      },
      resetDiagnosis: () =>
        set({ answers: {}, scores: { ...defaultScores }, diagnosisCompleted: false }),
      reset: () =>
        set({
          industry: null,
          stage: null,
          subIndustry: null,
          answers: {},
          scores: { ...defaultScores },
          diagnosisCompleted: false,
          todayActionIds: [],
          actionRecords: [],
          scoreHistory: [],
          weeklyGoal: null,
          businessMetrics: [],
          streak: 0,
          lastActionDate: null,
        }),
      setWeeklyGoal: (goal) =>
        set(state => {
          const completedIds = new Set(state.actionRecords.map(record => record.actionId))
          const targetActions = ACTION_POOL
            .filter(action => action.areaId === goal.targetAreaId && !completedIds.has(action.id))
            .slice(0, 3)
            .map(action => action.id)

          return {
            weeklyGoal: {
              ...goal,
              targetActions,
              completedActions: goal.completedActions.filter(actionId => targetActions.includes(actionId)),
            },
          }
        }),
      addBusinessMetric: (entry) =>
        set(state => {
          if (!state.diagnosisCompleted) {
            return { businessMetrics: [...state.businessMetrics, entry] }
          }

          const newScores = applyMetricSignals(state.scores, entry)
          return {
            businessMetrics: [...state.businessMetrics, entry],
            scores: newScores,
            scoreHistory: [...state.scoreHistory, buildScoreSnapshot(newScores)],
          }
        }),
      calculateStreak: () => {
        const { actionRecords } = get()
        if (actionRecords.length === 0) {
          set({ streak: 0, lastActionDate: null })
          return
        }

        const completedDates = Array.from(
          new Set(
            actionRecords
              .filter(r => r.status === 'completed')
              .map(r => r.date)
          )
        ).sort((a, b) => b.localeCompare(a))

        if (completedDates.length === 0) {
          set({ streak: 0, lastActionDate: null })
          return
        }

        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        const mostRecent = completedDates[0]

        if (mostRecent !== today && mostRecent !== yesterday) {
          set({ streak: 0, lastActionDate: mostRecent })
          return
        }

        let streak = 1
        for (let i = 1; i < completedDates.length; i++) {
          const prev = new Date(completedDates[i - 1])
          const curr = new Date(completedDates[i])
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
