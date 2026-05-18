'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BarChart2,
  Flame,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Zap,
  Clock,
  WalletCards,
} from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useStore } from '@/lib/store'
import { INDICATORS, getIndicatorsForOperationType } from '@/data/constants'
import {
  getTotalScore,
  getStatusLevel,
  getTopRiskIndicators,
  getSortedIndicatorsByScore,
} from '@/lib/scoring'
import { getTodayActions } from '@/lib/actions'
import { analyzeFinancialSnapshot } from '@/lib/financial'
import { getRewardState } from '@/lib/rewards'
import type { OperationType, IndicatorId } from '@/data/types'

export default function DashboardPage() {
  const router = useRouter()
  const {
    scores,
    operationType,
    financialSnapshot,
    diagnosisCompleted,
    executionRecords,
    weeklyGoal,
    streak,
    calculateStreak,
    resetDiagnosis,
  } = useStore()

  const effectiveOpType: OperationType = operationType ?? 'hall'

  useEffect(() => {
    calculateStreak()
  }, [calculateStreak])

  useEffect(() => {
    if (!diagnosisCompleted) {
      router.replace('/onboarding')
    }
  }, [diagnosisCompleted, router])

  if (!diagnosisCompleted) return null

  const totalScore = getTotalScore(scores, effectiveOpType)
  const status = getStatusLevel(totalScore)
  const topRisks = getTopRiskIndicators(scores, effectiveOpType)
  const sortedIndicators = getSortedIndicatorsByScore(scores, effectiveOpType)
  const activeIndicators = getIndicatorsForOperationType(effectiveOpType)
  const todayActions = getTodayActions(
    scores,
    effectiveOpType,
    executionRecords.map((r) => r.action_id)
  )
  const nextAction = todayActions[0]
  const financialAnalysis = analyzeFinancialSnapshot(financialSnapshot)
  const rewardState = getRewardState(executionRecords, weeklyGoal)

  // Radar chart data
  const radarData = activeIndicators.map((ind) => ({
    subject: ind.label.length > 5 ? ind.label.slice(0, 5) + '…' : ind.label,
    fullLabel: ind.label,
    score: scores[ind.id as IndicatorId] ?? 0,
    max: 100,
  }))

  const opTypeLabels: Record<string, string> = {
    hall: '홀 중심',
    delivery: '배달 중심',
    takeout: '테이크아웃 중심',
    boutique: '부티크/감성형',
    social: '소셜/로컬형',
    stay: '장기체류형',
    cafe_takeout: '테이크아웃/배달형',
    cafe_stay: '좌석 체류형',
    cafe_dessert: '디저트/미식형',
    cafe_craft: '개인 브랜딩/크래프트형',
    cafe_local: '로컬 앵커형',
  }
  const diffLabels: Record<string, string> = { easy: '쉬움', normal: '보통', hard: '어려움' }
  const impactColors: Record<string, string> = {
    low: 'text-slate-400',
    medium: 'text-amber-500',
    high: 'text-red-500',
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] dark:bg-[#191919] px-4 py-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">대시보드</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {opTypeLabels[effectiveOpType]} · 오늘도 한 걸음씩
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-2xl">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-extrabold text-orange-600 dark:text-orange-400">{streak}</span>
            <span className="text-xs text-orange-500">일 연속</span>
          </div>
        </motion.div>

        {/* Next Best Action */}
        {nextAction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="bg-white dark:bg-[#202020] rounded-2xl border border-[#e9e9e7] dark:border-[#313131] p-6 text-slate-900 dark:text-white"
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold">지금 먼저 할 일</h2>
              <span className="ml-auto text-xs text-slate-400">오늘 기준</span>
            </div>
            <p className="text-lg font-extrabold leading-relaxed">{nextAction.title}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {nextAction.expected_time}
              </span>
              <span>난이도: {diffLabels[nextAction.difficulty]}</span>
              <span>효과: {nextAction.impact === 'high' ? '높음' : nextAction.impact === 'medium' ? '중간' : '낮음'}</span>
            </div>
            <button
              onClick={() => router.push('/action')}
              className="mt-4 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
            >
              실행 기록하기
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="bg-white dark:bg-[#202020] rounded-2xl border border-[#e9e9e7] dark:border-[#313131] p-6"
        >
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">실행 보상 진행도</p>
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white">실행할수록 더 많은 분석을 받을 수 있습니다</h2>
            </div>
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-right">
              <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">{rewardState.completedCount}</p>
              <p className="text-[11px] text-slate-400">누적 실행</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
              <p className="text-xs text-slate-400 mb-1">받은 보상</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">{rewardState.unlockedRewards.length}개</p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
              <p className="text-xs text-slate-400 mb-1">주간 목표</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {rewardState.weeklyGoalCompleted ? '달성됨' : '진행 중'}
              </p>
            </div>
          </div>

          {rewardState.nextReward ? (
            <div className="rounded-2xl bg-slate-950 dark:bg-slate-800 p-4 text-white">
              <p className="text-xs font-bold text-emerald-300 mb-1">다음 보상</p>
              <p className="text-sm font-extrabold leading-relaxed">{rewardState.nextReward.title}</p>
              <p className="text-xs text-slate-300 mt-2">
                {rewardState.nextReward.requiredCount - rewardState.completedCount}개 실행을 더 기록하면 받을 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4">
              <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">월간 성장 리포트까지 모두 받을 수 있습니다.</p>
            </div>
          )}
        </motion.div>

        {/* Financial Snapshot */}
        {financialAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white dark:bg-[#202020] rounded-2xl border border-[#e9e9e7] dark:border-[#313131] p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <WalletCards className="w-5 h-5 text-emerald-500" />
              <h2 className="font-bold text-slate-900 dark:text-white">재무 상태</h2>
              <span className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${financialAnalysis.status.bg} ${financialAnalysis.status.color}`}>
                {financialAnalysis.status.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
              {financialAnalysis.headline}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
              {financialAnalysis.recommendation}
            </p>
          </motion.div>
        )}

        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-[#202020] rounded-2xl border border-[#e9e9e7] dark:border-[#313131] p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-500" />
              전체 점수
            </h2>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${status.bg} ${status.color}`}>
              {status.label} {totalScore}점
            </div>
          </div>

          {/* Radar Chart */}
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <Radar
                dataKey="score"
                stroke="#059669"
                fill="#059669"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip
                formatter={(value, name, props) => [
                  `${value}점`,
                  props.payload?.fullLabel ?? name,
                ]}
                contentStyle={{
                  background: '#1e293b',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Per-Indicator Scores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#202020] rounded-2xl border border-[#e9e9e7] dark:border-[#313131] p-6"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            지표별 점수
          </h2>
          <div className="flex flex-col gap-3">
            {sortedIndicators.map((ind, i) => {
              const sl = getStatusLevel(ind.score)
              return (
                <motion.div
                  key={ind.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.03 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-lg w-7 text-center">{ind.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{ind.label}</span>
                      <span className={`text-sm font-extrabold ml-2 ${sl.color}`}>{ind.score}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full`}
                        style={{ backgroundColor: ind.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${ind.score}%` }}
                        transition={{ duration: 0.5, delay: 0.15 + i * 0.03 }}
                      />
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${sl.bg} ${sl.color}`}>
                    {sl.label}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Top Risk Indicators */}
        {topRisks.some((r) => r.risk !== 'low') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-3xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="font-bold text-red-700 dark:text-red-400">위험 지표</h2>
            </div>
            <div className="flex flex-col gap-2">
              {topRisks
                .filter((r) => r.risk !== 'low')
                .map(({ indicator, score, risk }) => {
                  const info = INDICATORS.find((i) => i.id === indicator)
                  return (
                    <div key={indicator} className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl p-3">
                      <span className="text-xl">{info?.icon}</span>
                      <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{info?.label}</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          risk === 'high'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                        }`}
                      >
                        {score}점
                      </span>
                    </div>
                  )
                })}
            </div>
          </motion.div>
        )}

        {/* Today's Recommended Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#202020] rounded-2xl border border-[#e9e9e7] dark:border-[#313131] p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              추가 추천 액션
            </h2>
            <button
              onClick={() => router.push('/action')}
              className="text-xs font-semibold text-emerald-600 flex items-center gap-1"
            >
              전체 보기 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {todayActions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              오늘 실행할 액션이 없습니다. 모든 지표를 잘 관리하고 있습니다!
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {todayActions.map((action, i) => (
                <motion.div
                  key={action.action_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.07 }}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">{action.title}</p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {action.expected_time}
                    </span>
                    <span className="text-xs text-slate-500">난이도: {diffLabels[action.difficulty]}</span>
                    <span className={`text-xs font-semibold ${impactColors[action.impact]}`}>
                      효과: {action.impact === 'high' ? '높음' : action.impact === 'medium' ? '중간' : '낮음'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push('/action')}
            className="mt-4 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
          >
            실행 기록하기
          </button>
        </motion.div>

        {/* Re-diagnosis Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <button
            onClick={() => {
              resetDiagnosis()
              router.push('/diagnosis')
            }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            재진단 하기
          </button>
        </motion.div>
      </div>
    </div>
  )
}
