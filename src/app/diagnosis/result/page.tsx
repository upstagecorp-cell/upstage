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
  WalletCards,
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
import { analyzeFinancialSnapshot } from '@/lib/financial'
import type { OperationType, IndicatorId, ActionCard } from '@/data/types'
import type { FinancialAnalysis } from '@/lib/financial'

export default function DiagnosisResultPage() {
  const router = useRouter()
  const {
    scores,
    operationType,
    financialSnapshot,
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
  const feedbacks = generateDiagnosisFeedback(scores, effectiveOpType)
  const financialAnalysis = analyzeFinancialSnapshot(financialSnapshot)
  const todayActions = prioritizeActionsByFinancial(getTodayActions(scores, effectiveOpType, []), financialAnalysis)
  const weekActions = prioritizeActionsByFinancial(getWeekActions(scores, effectiveOpType, []), financialAnalysis)
  const primaryRisk = topRisks[0]
  const primaryIndicator = primaryRisk ? INDICATORS.find((ind) => ind.id === primaryRisk.indicator) : null
  const primaryAction = todayActions[0] ?? weekActions[0]
  const resultSummary = buildResultSummary(financialAnalysis, primaryIndicator?.label, primaryAction?.title)

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Priority Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8"
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300 mb-2">진단 완료 · 맞춤 우선순위</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 dark:text-white leading-tight">
                지금 가장 먼저 고쳐야 할 1가지
              </h1>
            </div>
            <div className={`flex-shrink-0 rounded-2xl px-4 py-3 text-center ${status.bg}`}>
              <p className={`text-2xl font-extrabold ${status.color}`}>{totalScore}</p>
              <p className="text-[11px] font-bold text-slate-400">전체 점수</p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 dark:bg-slate-800 border border-slate-900 dark:border-slate-700 p-4 mb-4">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-300 mb-1">우선 개선 1순위</p>
                <p className="font-extrabold text-white leading-relaxed">
                  {resultSummary.primary}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 p-4">
              <p className="text-xs font-bold text-slate-400 mb-1">왜 매출/이익이 막혔나</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                {resultSummary.reason}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 p-4">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300 mb-1">이번 주 예상 개선 방향</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                {resultSummary.weekPlan}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Financial Snapshot */}
        {financialAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <WalletCards className="w-5 h-5 text-emerald-500" />
              <h2 className="font-bold text-slate-900 dark:text-white">재무 스냅샷</h2>
              <span className={`ml-auto text-xs px-2 py-1 rounded-full font-bold ${financialAnalysis.status.bg} ${financialAnalysis.status.color}`}>
                {financialAnalysis.status.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
              {financialAnalysis.headline}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
              {financialAnalysis.recommendation}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 p-3">
                <p className="text-xs text-slate-400 mb-1">월평균 매출</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{financialSnapshot?.monthlyRevenueText}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 p-3">
                <p className="text-xs text-slate-400 mb-1">월평균 순이익</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{financialSnapshot?.monthlyNetProfitText}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              증빙 자료: {financialAnalysis.hasEvidence ? `${financialSnapshot?.evidenceFileNames.length ?? 0}개 첨부됨` : '자가 입력 기준'}
            </p>
          </motion.div>
        )}

        {/* Top Risk Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6"
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
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-emerald-500" />
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
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-slate-900 dark:text-white">오늘 바로 할 1가지</h2>
            <span className="ml-auto text-xs text-slate-400">우선 실행</span>
          </div>
          {todayActions[0] && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`p-5 rounded-2xl border-2 ${
                completedActionIds.includes(todayActions[0].action_id)
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start gap-3">
                {completedActionIds.includes(todayActions[0].action_id) ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-emerald-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-base font-extrabold text-slate-900 dark:text-white leading-relaxed">{todayActions[0].title}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {todayActions[0].expected_time}
                    </span>
                    <span className="text-xs text-slate-500">난이도: {diffLabels[todayActions[0].difficulty]}</span>
                    <span className="text-xs text-slate-500">효과: {impactLabels[todayActions[0].impact]}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {todayActions.length > 1 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400 mb-2">추가로 여유가 있으면</p>
              <div className="flex flex-col gap-2">
                {todayActions.slice(1).map((action, i) => (
                  <div key={action.action_id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                    <span className="text-xs text-slate-400 w-5 font-bold">{i + 2}</span>
                    <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{action.title}</p>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {action.expected_time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => router.push('/action')}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
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
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6"
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
          className="bg-slate-950 dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-900 dark:border-slate-800 p-6 text-white"
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
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg transition-colors shadow-lg shadow-emerald-200 dark:shadow-emerald-950"
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

const PROFIT_PRIORITY_INDICATORS = new Set<IndicatorId>([
  'menu_cost_rate',
  'avg_spending_per_customer',
  'table_turnover',
  'menu_cost_rate_cafe',
  'avg_basket_size',
  'space_productivity',
  'adr_revpar',
  'occupancy_rate',
  'direct_booking_share',
  'housekeeping_efficiency',
])

function prioritizeActionsByFinancial(
  actions: ActionCard[],
  financialAnalysis: FinancialAnalysis | null
): ActionCard[] {
  if (!financialAnalysis || !['loss', 'danger', 'warning'].includes(financialAnalysis.status.level)) {
    return actions
  }

  return [...actions].sort((a, b) => {
    const aPriority = PROFIT_PRIORITY_INDICATORS.has(a.related_indicator) ? 1 : 0
    const bPriority = PROFIT_PRIORITY_INDICATORS.has(b.related_indicator) ? 1 : 0
    return bPriority - aPriority
  })
}

function buildResultSummary(
  financialAnalysis: FinancialAnalysis | null,
  primaryIndicatorLabel?: string,
  primaryActionTitle?: string
) {
  const fallbackIndicator = primaryIndicatorLabel ?? '가장 낮은 핵심 지표'
  const fallbackAction = primaryActionTitle ?? `${fallbackIndicator} 개선 액션`
  const margin = financialAnalysis?.netProfitMargin
  const formattedMargin = typeof margin === 'number' ? `${margin.toFixed(1)}%` : null

  if (financialAnalysis?.status.level === 'loss') {
    return {
      primary: `신규 광고보다 ${fallbackAction}을 먼저 실행하세요.`,
      reason: `최근 3개월 기준 순이익률이 ${formattedMargin ?? '적자'}로 적자 상태입니다. 지금은 유입을 늘리기보다 비용 누수와 객단가 구조를 먼저 잡아야 합니다.`,
      weekPlan: `${fallbackIndicator}를 중심으로 원가율, 객단가, 반복 비용을 점검하고 바로 줄일 수 있는 지출부터 정리하세요.`,
    }
  }

  if (financialAnalysis?.status.level === 'danger') {
    return {
      primary: `광고 확대보다 ${fallbackAction}을 먼저 실행하세요.`,
      reason: `최근 3개월 평균 순이익률이 ${formattedMargin}로 낮습니다. 매출을 더 만들어도 원가율이나 객단가가 그대로면 남는 돈이 크게 늘지 않습니다.`,
      weekPlan: `${fallbackIndicator}를 우선 개선하고, 고마진 상품 구성이나 가격/패키지 조정을 함께 점검하세요.`,
    }
  }

  if (financialAnalysis?.status.level === 'warning') {
    return {
      primary: `${fallbackAction}부터 실행하세요.`,
      reason: `순이익률이 ${formattedMargin}로 개선 여지가 있습니다. 신규 유입과 이익률 개선을 함께 봐야 실제 남는 돈이 늘어납니다.`,
      weekPlan: `${fallbackIndicator} 개선 액션을 실행하면서 객단가, 재방문, 비용 구조 중 하나를 같이 올려보세요.`,
    }
  }

  if (financialAnalysis && ['good', 'excellent'].includes(financialAnalysis.status.level)) {
    return {
      primary: `${fallbackAction}부터 실행하세요.`,
      reason: `현재 이익 구조는 비교적 버틸 수 있는 편입니다. 그래서 가장 낮은 운영 지표를 먼저 개선하면 성장 폭이 더 커질 수 있습니다.`,
      weekPlan: `${fallbackIndicator}를 끌어올리고, 효과가 보이면 유입 확대나 상품 확장으로 이어가세요.`,
    }
  }

  return {
    primary: `${fallbackAction}부터 실행하세요.`,
    reason: `현재 진단에서 ${fallbackIndicator}가 가장 먼저 손봐야 할 가능성이 높습니다. 재무 입력값이 추가되면 매출/이익 기준으로 더 정확히 우선순위를 잡을 수 있습니다.`,
    weekPlan: `이번 주는 ${fallbackAction}을 실행하고, 결과를 기록해 다음 진단의 기준값으로 남기세요.`,
  }
}
