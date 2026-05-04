'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { IndustryId, StageId, AreaId, ActionRecord, ScoreSnapshot } from '@/data/types'

interface AppStore {
  // 온보딩
  industry: IndustryId | null
  stage: StageId | null

  // 진단
  answers: Record<string, number>
  scores: Record<AreaId, number>
  diagnosisCompleted: boolean

  // 실행
  todayActionIds: string[]
  actionRecords: ActionRecord[]

  // 히스토리
  scoreHistory: ScoreSnapshot[]

  // 액션
  setIndustry: (industry: IndustryId) => void
  setStage: (stage: StageId) => void
  setAnswer: (questionId: string, score: number) => void
  setScores: (scores: Record<AreaId, number>) => void
  completeDiagnosis: (scores: Record<AreaId, number>) => void
  setTodayActions: (actionIds: string[]) => void
  addActionRecord: (record: ActionRecord) => void
  updateScores: (newScores: Record<AreaId, number>) => void
  resetDiagnosis: () => void
  reset: () => void
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
      answers: {},
      scores: { ...defaultScores },
      diagnosisCompleted: false,
      todayActionIds: [],
      actionRecords: [],
      scoreHistory: [],

      setIndustry: (industry) => set({ industry }),
      setStage: (stage) => set({ stage }),
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
          answers: {},
          scores: { ...defaultScores },
          diagnosisCompleted: false,
          todayActionIds: [],
          actionRecords: [],
          scoreHistory: [],
        }),
    }),
    {
      name: 'startup-platform-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
