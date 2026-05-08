'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingUp, Calendar, Clock, BarChart2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { INDICATORS } from '@/data/constants'
import { getActionById } from '@/data/actions'
import { getStatusLevel } from '@/lib/scoring'
import type { RestaurantIndicatorId } from '@/data/types'

export default function HistoryPage() {
  const router = useRouter()
  const { scoreHistory, executionRecords, diagnosisCompleted } = useStore()

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

  // Prepare score trend data
  const trendData = scoreHistory.map((snap) => ({
    date: snap.date.slice(5), // MM-DD
    fullDate: snap.date,
    전체점수: snap.totalScore,
    ...Object.fromEntries(
      INDICATORS.map((ind) => [
        ind.label.length > 4 ? ind.label.slice(0, 4) : ind.label,
        snap.scores[ind.id as RestaurantIndicatorId] ?? 0,
      ])
    ),
  }))

  // Per-indicator latest scores
  const latestScores =
    scoreHistory.length > 0
      ? scoreHistory[scoreHistory.length - 1].scores
      : null

  // Execution records sorted by date desc
  const sortedRecords = [...executionRecords].sort((a, b) =>
    b.execution_date.localeCompare(a.execution_date)
  )

  // Group records by date
  const grouped: Record<string, typeof sortedRecords> = {}
  sortedRecords.forEach((rec) => {
    if (!grouped[rec.execution_date]) grouped[rec.execution_date] = []
    grouped[rec.execution_date].push(rec)
  })
  const groupedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const CHART_COLORS = [
    '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
    '#14b8a6', '#f97316', '#eab308', '#22c55e', '#a855f7', '#ef4444',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 px-4 py-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            히스토리
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            점수 변화와 실행 기록을 확인하세요
          </p>
        </motion.div>

        {/* Score Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            전체 점수 추이
          </h2>
          {trendData.length < 2 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              진단을 2회 이상 완료하면 점수 추이가 표시됩니다.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="전체점수"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#6366f1' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Per-Indicator Score History */}
        {trendData.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6"
          >
            <h2 className="font-bold text-slate-900 dark:text-white mb-4">지표별 점수 추이</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '11px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
                  iconSize={8}
                />
                {INDICATORS.map((ind, i) => {
                  const key = ind.label.length > 4 ? ind.label.slice(0, 4) : ind.label
                  return (
                    <Line
                      key={ind.id}
                      type="monotone"
                      dataKey={key}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Latest Per-Indicator Scores */}
        {latestScores && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6"
          >
            <h2 className="font-bold text-slate-900 dark:text-white mb-4">최근 지표별 점수</h2>
            <div className="flex flex-col gap-2">
              {INDICATORS.map((ind) => {
                const score = latestScores[ind.id as RestaurantIndicatorId] ?? 0
                const sl = getStatusLevel(score)
                return (
                  <div key={ind.id} className="flex items-center gap-3">
                    <span className="w-6 text-center">{ind.icon}</span>
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{ind.label}</span>
                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${score}%`, backgroundColor: ind.color }}
                      />
                    </div>
                    <span className={`w-10 text-right text-sm font-bold ${sl.color}`}>{score}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Execution Records Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            실행 기록 타임라인
          </h2>
          {sortedRecords.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              아직 실행 기록이 없습니다. 액션을 실행하고 기록해보세요!
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {groupedDates.map((date) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{date}</span>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
                    <span className="text-xs text-slate-400">{grouped[date].length}개 완료</span>
                  </div>
                  <div className="flex flex-col gap-3 ml-4 border-l-2 border-indigo-100 dark:border-indigo-900 pl-4">
                    {grouped[date].map((rec) => {
                      const action = getActionById(rec.action_id)
                      return (
                        <div
                          key={rec.id}
                          className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {action?.title ?? rec.action_id}
                            </p>
                            <span className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {rec.time_spent}
                            </span>
                          </div>
                          {rec.result_memo && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {rec.result_memo}
                            </p>
                          )}
                          {rec.difficulty_note && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              어려웠던 점: {rec.difficulty_note}
                            </p>
                          )}
                          {rec.next_recommended_action && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                              다음 목표: {rec.next_recommended_action}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
