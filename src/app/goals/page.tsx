'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Plus,
  CheckCircle,
  Circle,
  Trash2,
  Calendar,
  TrendingUp,
  X,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { INDICATORS, getIndicatorsForOperationType } from '@/data/constants'
import { getTodayActions } from '@/lib/actions'
import { getStatusLevel } from '@/lib/scoring'
import type { OperationType, IndicatorId, WeeklyGoal } from '@/data/types'

export default function GoalsPage() {
  const router = useRouter()
  const {
    scores,
    operationType,
    diagnosisCompleted,
    weeklyGoal,
    setWeeklyGoal,
    executionRecords,
  } = useStore()

  const effectiveOpType: OperationType = operationType ?? 'hall'
  const activeIndicators = getIndicatorsForOperationType(effectiveOpType)

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    targetIndicator: '' as IndicatorId | '',
    endDate: getDefaultEndDate(),
  })

  const [goalCounter, setGoalCounter] = useState(1)

  function getDefaultEndDate() {
    const d = new Date()
    d.setDate(d.getDate() + 6)
    return d.toISOString().split('T')[0]
  }

  const todayActions = getTodayActions(scores, effectiveOpType, [])
  const completedThisWeek = executionRecords.filter((r) => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 6)
    return r.execution_date >= weekAgo.toISOString().split('T')[0]
  })

  function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title || !formData.targetIndicator) return
    const actionIds = todayActions
      .filter((a) => a.related_indicator === formData.targetIndicator)
      .map((a) => a.action_id)

    const goalId = `goal_${goalCounter}`
    setGoalCounter(c => c + 1)
    const goal: WeeklyGoal = {
      id: goalId,
      title: formData.title,
      targetIndicator: formData.targetIndicator as IndicatorId,
      startDate: new Date().toISOString().split('T')[0],
      endDate: formData.endDate,
      targetActions: actionIds,
      completedActions: executionRecords
        .filter((r) => actionIds.includes(r.action_id))
        .map((r) => r.action_id),
    }
    setWeeklyGoal(goal)
    setShowForm(false)
  }

  function getGoalProgress(goal: WeeklyGoal): number {
    if (goal.targetActions.length === 0) return 0
    const done = executionRecords.filter((r) => goal.targetActions.includes(r.action_id)).length
    return Math.min(100, Math.round((done / goal.targetActions.length) * 100))
  }

  if (!diagnosisCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-500 dark:text-slate-400">먼저 진단을 완료해주세요.</p>
        <button
          onClick={() => router.push('/onboarding')}
          className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold"
        >
          진단 시작하기
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 px-4 py-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-500" />
            주간 목표
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            이번 주 집중할 지표와 실행 목표를 설정하세요
          </p>
        </motion.div>

        {/* Weekly Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 flex flex-col gap-1">
            <span className="text-xs text-slate-400">이번 주 완료</span>
            <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {completedThisWeek.length}
            </span>
            <span className="text-xs text-slate-500">개 액션</span>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 flex flex-col gap-1">
            <span className="text-xs text-slate-400">전체 실행 기록</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {executionRecords.length}
            </span>
            <span className="text-xs text-slate-500">개 총 기록</span>
          </div>
        </motion.div>

        {/* Current Goal */}
        {weeklyGoal ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">현재 목표</span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">{weeklyGoal.title}</h2>
              </div>
              <button
                onClick={() => {
                  if (confirm('목표를 삭제하시겠습니까?')) {
                    setWeeklyGoal({
                      ...weeklyGoal,
                      completedActions: [],
                    })
                  }
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Target indicator */}
            {(() => {
              const ind = INDICATORS.find((i) => i.id === weeklyGoal.targetIndicator)
              const score = scores[weeklyGoal.targetIndicator] ?? 0
              const sl = getStatusLevel(score)
              return (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 mb-4">
                  <span className="text-xl">{ind?.icon}</span>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{ind?.label}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full`} style={{ width: `${score}%`, backgroundColor: ind?.color }} />
                      </div>
                      <span className={`text-xs font-bold ${sl.color}`}>{score}점</span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Progress */}
            {(() => {
              const progress = getGoalProgress(weeklyGoal)
              return (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">목표 달성률</span>
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{progress}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-indigo-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
              )
            })()}

            {/* Date range */}
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              {weeklyGoal.startDate} ~ {weeklyGoal.endDate}
            </div>

            {/* Target actions */}
            {weeklyGoal.targetActions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">목표 액션</p>
                <div className="flex flex-col gap-2">
                  {weeklyGoal.targetActions.map((actionId) => {
                    const isDone = executionRecords.some((r) => r.action_id === actionId)
                    const action = todayActions.find((a) => a.action_id === actionId)
                    return (
                      <div
                        key={actionId}
                        className={`flex items-center gap-2 p-2 rounded-xl ${
                          isDone
                            ? 'bg-emerald-50 dark:bg-emerald-950/30'
                            : 'bg-slate-50 dark:bg-slate-700/50'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 dark:text-slate-500 flex-shrink-0" />
                        )}
                        <span className={`text-xs ${isDone ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {action?.title ?? actionId}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowForm(true)}
              className="mt-4 w-full py-2.5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
            >
              목표 변경하기
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-indigo-500" />
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white mb-2">주간 목표가 없습니다</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              이번 주 집중할 지표를 정하고 목표를 설정해보세요.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
              목표 만들기
            </button>
          </motion.div>
        )}

        {/* Indicator suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            지표별 현황 (목표 설정 참고)
          </h2>
          <div className="flex flex-col gap-2">
            {activeIndicators.map((ind) => {
              const score = scores[ind.id as IndicatorId] ?? 0
              const sl = getStatusLevel(score)
              return (
                <div
                  key={ind.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setFormData({
                      title: `${ind.label} 개선 목표`,
                      targetIndicator: ind.id as IndicatorId,
                      endDate: getDefaultEndDate(),
                    })
                    setShowForm(true)
                  }}
                >
                  <span>{ind.icon}</span>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{ind.label}</span>
                  <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: ind.color }} />
                  </div>
                  <span className={`text-sm font-bold ${sl.color} w-8 text-right`}>{score}</span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Goal creation form modal */}
        <AnimatePresence>
          {showForm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={() => setShowForm(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 60 }}
                className="fixed inset-x-4 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-slate-900 dark:text-white">주간 목표 설정</h3>
                  <button onClick={() => setShowForm(false)}>
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <form onSubmit={handleCreateGoal} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      목표 이름 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 이번 주 배달앱 노출 개선"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      집중 지표 <span className="text-red-400">*</span>
                    </label>
                    <select
                      required
                      value={formData.targetIndicator}
                      onChange={(e) => setFormData({ ...formData, targetIndicator: e.target.value as IndicatorId })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-400"
                    >
                      <option value="">지표 선택...</option>
                      {activeIndicators.map((ind) => (
                        <option key={ind.id} value={ind.id}>
                          {ind.icon} {ind.label} ({scores[ind.id as IndicatorId] ?? 0}점)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      목표 종료일
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors"
                  >
                    목표 저장
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
