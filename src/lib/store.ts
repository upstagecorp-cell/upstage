'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { IndustryId, StageId, AreaId, ActionRecord, ScoreSnapshot, SubIndustryId, WeeklyGoal, BusinessMetricEntry, LoopPhase, MonthlyReport, StageUnlockStatus } from '@/data/types'
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

  // 14일 루프
  loopPhase: LoopPhase
  loopStartDate: string | null

  // 월간 리포트
  monthlyReports: MonthlyReport[]

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
  setLoopPhase: (phase: LoopPhase) => void
  startNewLoop: () => void
  generateMonthlyReport: () => void
  checkStageUnlock: () => StageUnlockStatus
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
      loopPhase: 'execute',
      loopStartDate: null,
      monthlyReports: [],

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
          loopPhase: 'execute',
          loopStartDate: null,
          monthlyReports: [],
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
      setLoopPhase: (phase) => set({ loopPhase: phase }),
      startNewLoop: () =>
        set({
          loopPhase: 'execute',
          loopStartDate: new Date().toISOString().split('T')[0],
        }),
      generateMonthlyReport: () => {
        const state = get()
        const now = new Date()
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const existing = state.monthlyReports.find(r => r.month === monthStr)
        if (existing) return

        const monthStart = `${monthStr}-01`
        const monthRecords = state.actionRecords.filter(r => r.date >= monthStart)
        const totalActions = monthRecords.filter(r => r.status === 'completed').length

        // score change: compare earliest snapshot in month vs latest
        const monthHistory = state.scoreHistory.filter(s => s.date >= monthStart)
        const scoreChange: Record<AreaId, number> = {
          customer: 0, validation: 0, product: 0,
          acquisition: 0, revenue: 0, operation: 0, growth: 0,
        }
        if (monthHistory.length >= 2) {
          const first = monthHistory[0].scores
          const last = monthHistory[monthHistory.length - 1].scores
          for (const areaId of Object.keys(scoreChange) as AreaId[]) {
            scoreChange[areaId] = (last[areaId] ?? 0) - (first[areaId] ?? 0)
          }
        }

        const topArea = (Object.entries(scoreChange).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'customer') as AreaId

        const topGain = scoreChange[topArea]
        const insight =
          totalActions === 0
            ? '이번 달은 실행 기록이 없습니다. 다음 달에는 꼭 첫 액션을 시작해보세요!'
            : topGain > 0
            ? `이번 달 ${totalActions}개 액션을 완료하고 ${topArea} 영역에서 가장 많이 성장했습니다.`
            : `이번 달 ${totalActions}개 액션을 완료했습니다. 다음 달에는 증거 기록을 더 충실히 해보세요.`

        const report: MonthlyReport = { month: monthStr, totalActions, scoreChange, topArea, insight }
        set(state => ({ monthlyReports: [...state.monthlyReports, report] }))
      },
      checkStageUnlock: (): StageUnlockStatus => {
        const state = get()
        const { stage, scores, actionRecords } = state
        const completedCount = actionRecords.filter(r => r.status === 'completed').length

        const STAGE_ORDER: StageId[] = ['idea', 'preparing', 'pre-open', 'operating', 'plateau', 'expansion']
        const currentIdx = stage ? STAGE_ORDER.indexOf(stage) : -1
        const nextStage = currentIdx >= 0 && currentIdx < STAGE_ORDER.length - 1
          ? STAGE_ORDER[currentIdx + 1]
          : null

        if (!nextStage) return { canUnlock: false, targetStage: null, conditions: [] }

        type UnlockRule = { label: string; met: boolean }
        const rulesMap: Partial<Record<StageId, UnlockRule[]>> = {
          preparing: [
            { label: `고객이해도 40점 이상 (현재 ${scores.customer}점)`, met: scores.customer >= 40 },
            { label: `문제검증도 30점 이상 (현재 ${scores.validation}점)`, met: scores.validation >= 30 },
            { label: `완료 액션 3개 이상 (현재 ${completedCount}개)`, met: completedCount >= 3 },
          ],
          'pre-open': [
            { label: `고객이해도 50점 이상 (현재 ${scores.customer}점)`, met: scores.customer >= 50 },
            { label: `상품경쟁력 50점 이상 (현재 ${scores.product}점)`, met: scores.product >= 50 },
            { label: `완료 액션 7개 이상 (현재 ${completedCount}개)`, met: completedCount >= 7 },
          ],
          operating: [
            { label: `고객이해도 60점 이상 (현재 ${scores.customer}점)`, met: scores.customer >= 60 },
            { label: `문제검증도 50점 이상 (현재 ${scores.validation}점)`, met: scores.validation >= 50 },
            { label: `완료 액션 5개 이상 (현재 ${completedCount}개)`, met: completedCount >= 5 },
          ],
          plateau: [
            { label: `수익성 60점 이상 (현재 ${scores.revenue}점)`, met: scores.revenue >= 60 },
            { label: `운영지속성 55점 이상 (현재 ${scores.operation}점)`, met: scores.operation >= 55 },
            { label: `완료 액션 10개 이상 (현재 ${completedCount}개)`, met: completedCount >= 10 },
          ],
          expansion: [
            { label: `성장가능성 65점 이상 (현재 ${scores.growth}점)`, met: scores.growth >= 65 },
            { label: `수익성 65점 이상 (현재 ${scores.revenue}점)`, met: scores.revenue >= 65 },
            { label: `완료 액션 15개 이상 (현재 ${completedCount}개)`, met: completedCount >= 15 },
          ],
        }

        const conditions: UnlockRule[] = rulesMap[nextStage] ?? []
        const canUnlock = conditions.length > 0 && conditions.every(c => c.met)
        return { canUnlock, targetStage: nextStage, conditions }
      },
    }),
    {
      name: 'startup-platform-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
