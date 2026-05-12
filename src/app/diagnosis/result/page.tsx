'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RotateCcw,
  ArrowRight,
  Clock,
  Zap,
  Target,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { INDICATORS } from '@/data/constants'
import { getBenchmark } from '@/data/benchmarks'
import {
  getTotalScore,
  getStatusLevel,
  getTopRiskIndicators,
  getIndicatorsByPriority,
} from '@/lib/scoring'
import { getTodayActions, getWeekActions } from '@/lib/actions'
import { generateDiagnosisFeedback } from '@/lib/ai-feedback'
import type { OperationType, IndicatorId } from '@/data/types'

export default function DiagnosisResultPage() {
  const router = useRouter()
  const {
    scores,
    operationType,
    diagnosisCompleted,
    executionRecords,
    resetDiagnosis,
  } = useStore()

  const effectiveOpType: OperationType = operationType ?? 'hall'

  useEffect(() => {
    if (!diagnosisCompleted) {
      router.replace('/diagnosis')
    }
  }, [diagnosisCompleted, router])

  if (!diagnosisCompleted) return null

  const totalScore = getTotalScore(scores, effectiveOpType)
  const status = getStatusLevel(totalScore)
  const topRisks = getTopRiskIndicators(scores, effectiveOpType)
  const priorityIndicators = getIndicatorsByPriority(effectiveOpType).slice(0, 5)
  const todayActions = getTodayActions(scores, effectiveOpType, [])
  const weekActions = getWeekActions(scores, effectiveOpType, [])
  const feedbacks = generateDiagnosisFeedback(scores, effectiveOpType)

  const completedActionIds = executionRecords.map((r) => r.action_id)

  function handleReDiagnose() {
    resetDiagnosis()
    router.push('/diagnosis')
  }

  const riskLevelColors: Record<string, string> = {
    low: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400',
    medium: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400',
    high: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400',
  }
  const riskLabels: Record<string, string> = { low: '안전', medium: '주의', high: '위험' }
  const diffLabels: Record<string, string> = { easy: '쉬움', normal: '보통', hard: '어려움' }
  const impactLabels: Record<string, string> = { low: '낮음', medium: '중간', high: '높음' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 px-4 py-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Total Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center"
        >
          <h1 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-2">진단 완료</h1>
          <div className="relative inline-flex items-center justify-center w-32 h-32 mx-auto mb-4">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-700" />
              <circle
                cx="50" cy="50" r="44" fill="none"
                stroke="currentColor" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 44 * totalScore / 100} ${2 * Math.PI * 44 * (1 - totalScore / 100)}`}
                className={status.color}
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className={`text-3xl font-extrabold ${status.color}`}>{totalScore}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>
          <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold mb-3 ${status.bg} ${status.color}`}>
            {status.label}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
            {totalScore >= 80
              ? '전반적으로 잘 관리되고 있습니다. 약점 지표를 집중 개선하세요.'
              : totalScore >= 60
              ? '기본은 갖추어져 있습니다. 위험 지표 개선으로 큰 성장이 가능합니다.'
              : totalScore >= 40
              ? '개선이 필요한 영역이 많습니다. 오늘 액션부터 하나씩 시작하세요.'
              : '즉각적인 개선이 필요합니다. 아래 액션을 오늘 바로 실행하세요.'}
          </p>
        </motion.div>

        {/* Top Risk Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="font-bold text-slate-900 dark:text-white">가장 위험한 지표 3개</h2>
          </div>
          <div className="flex flex-col gap-3">
            {topRisks.map(({ indicator, score, risk }, i) => {
              const info = INDICATORS.find((ind) => ind.id === indicator)
              const benchmark = getBenchmark(indicator)
              const statusLevel = getStatusLevel(score)
              return (
                <motion.div
                  key={indicator}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50"
                >
                  <span className="text-2xl">{info?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{info?.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${riskLevelColors[risk]}`}>
                        {riskLabels[risk]}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${statusLevel.color.replace('text-', 'bg-')}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    {benchmark && risk === 'high' && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{benchmark.danger}</p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 font-extrabold text-lg ${statusLevel.color}`}>{score}</span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Priority by Operation Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-slate-900 dark:text-white">
              {getOperationTypeLabel(effectiveOpType)} 운영 핵심 지표
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {priorityIndicators.map((ind, i) => {
              const score = scores[ind.id as IndicatorId] ?? 0
              const sl = getStatusLevel(score)
              return (
                <div key={ind.id} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-5 text-center font-bold">{i + 1}</span>
                  <span className="text-sm">{ind.icon}</span>
                  <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{ind.label}</span>
                  <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${sl.color.replace('text-', 'bg-')}`} style={{ width: `${score}%` }} />
                  </div>
                  <span className={`w-8 text-right text-sm font-bold ${sl.color}`}>{score}</span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Today's Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-slate-900 dark:text-white">오늘 할 일</h2>
            <span className="ml-auto text-xs text-slate-400">{todayActions.length}개 추천</span>
          </div>
          <div className="flex flex-col gap-3">
            {todayActions.map((action, i) => (
              <motion.div
                key={action.action_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                className={`p-4 rounded-2xl border-2 ${
                  completedActionIds.includes(action.action_id)
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
                    : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {completedActionIds.includes(action.action_id) ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{action.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {action.expected_time}
                      </span>
                      <span className="text-xs text-slate-500">난이도: {diffLabels[action.difficulty]}</span>
                      <span className="text-xs text-slate-500">효과: {impactLabels[action.impact]}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <button
            onClick={() => router.push('/action')}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors"
          >
            실행하러 가기
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Weekly Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold text-slate-900 dark:text-white">이번 주 할 일</h2>
          </div>
          <div className="flex flex-col gap-2">
            {weekActions.map((action, i) => (
              <div key={action.action_id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                <span className="text-xs text-slate-400 w-5 font-bold">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{action.title}</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {action.expected_time}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl shadow-xl p-6 text-white"
        >
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            진단 피드백
          </h2>
          <ul className="flex flex-col gap-2">
            {feedbacks.map((fb, i) => (
              <li key={i} className="text-sm opacity-90 flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">•</span>
                {fb}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3"
        >
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900"
          >
            대시보드 보기
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={handleReDiagnose}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:border-slate-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            재진단 하기
          </button>
        </motion.div>
      </div>
    </div>
  )
}

function getOperationTypeLabel(operationType: OperationType): string {
  const labels: Record<OperationType, string> = {
    hall: '홀',
    delivery: '배달',
    takeout: '테이크아웃',
    boutique: '부티크/감성형',
    social: '소셜/로컬형',
    stay: '장기체류형',
    cafe_takeout: '테이크아웃/배달형',
    cafe_stay: '좌석 체류형',
    cafe_dessert: '디저트/미식형',
    cafe_craft: '개인 브랜딩/크래프트형',
    cafe_local: '로컬 앵커형',
  }
  return labels[operationType]
}
