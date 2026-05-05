'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { IndustryId, StageId, AreaId, ActionRecord, ScoreSnapshot, SubIndustryId, WeeklyGoal, BusinessMetricEntry } from '@/data/types'

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
        const snapshot: ScoreSnapshot = {
          date: new Date().toISOString().split('T')[0],
          scores,
          totalScore: Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 7),
        }
        set(state => ({
          scores,
          diagnosisCompleted: true,
          scoreHistory: [...state.scoreHistory, snapshot],
        }))
      },
      setTodayActions: (actionIds) => set({ todayActionIds: actionIds }),
      addActionRecord: (record) =>
        set(state => ({ actionRecords: [record, ...state.actionRecords] })),
      updateScores: (newScores) => {
        const snapshot: ScoreSnapshot = {
          date: new Date().toISOString().split('T')[0],
          scores: newScores,
          totalScore: Math.round(Object.values(newScores).reduce((a, b) => a + b, 0) / 7),
        }
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
      setWeeklyGoal: (goal) => set({ weeklyGoal: goal }),
      addBusinessMetric: (entry) =>
        set(state => ({ businessMetrics: [...state.businessMetrics, entry] })),
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
