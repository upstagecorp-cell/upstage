'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { useStore } from '@/lib/store'
import { RESTAURANT_QUESTIONS } from '@/data/questions'
import { calculateIndicatorScores } from '@/lib/scoring'
import { getTodayActions } from '@/lib/actions'
import type { OperationType } from '@/data/types'

export default function DiagnosisPage() {
  const router = useRouter()
  const {
    industry,
    operationType,
    answers,
    setAnswer,
    completeDiagnosis,
    setTodayActions,
    diagnosisCompleted,
    resetDiagnosis,
  } = useStore()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)

  // Filter questions (for now, restaurant only)
  const questions = RESTAURANT_QUESTIONS

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const selectedScore = currentQuestion ? answers[currentQuestion.question_id] : undefined

  useEffect(() => {
    if (!industry) {
      router.replace('/onboarding')
      return
    }
    if (diagnosisCompleted) {
      router.replace('/diagnosis/result')
    }
  }, [industry, diagnosisCompleted, router])

  function handleSelectAnswer(score: number) {
    if (!currentQuestion) return
    setAnswer(currentQuestion.question_id, score)
  }

  function handleNext() {
    if (selectedScore === undefined) return
    if (currentIndex < questions.length - 1) {
      setDirection(1)
      setCurrentIndex(currentIndex + 1)
    } else {
      // All done — calculate scores
      const effectiveOpType: OperationType = operationType ?? 'hall'
      const scores = calculateIndicatorScores(answers, questions, effectiveOpType)
      const todayActions = getTodayActions(scores, effectiveOpType, [])
      completeDiagnosis(scores)
      setTodayActions(todayActions.map((a) => a.action_id))
      router.push('/diagnosis/result')
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex(currentIndex - 1)
    }
  }

  const difficultyLabel: Record<string, string> = {
    hall: '홀 중심',
    delivery: '배달 중심',
    takeout: '테이크아웃 중심',
  }

  if (!currentQuestion) return null

  const answeredCount = Object.keys(answers).length
  const isLast = currentIndex === questions.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                const choice = confirm('진단을 중단하시겠습니까?\n\n확인: 처음부터 다시 시작 (업종 선택부터)\n취소: 진단 계속하기')
                if (choice) {
                  resetDiagnosis()
                  router.push('/')
                }
              }}
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              &#x2715; 나가기
            </button>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {operationType ? difficultyLabel[operationType] : ''} 진단
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400">
              {answeredCount}개 완료
            </span>
            <span className="text-xs text-slate-400">
              남은 질문: {questions.length - currentIndex - 1}개
            </span>
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestion.question_id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 md:p-8 mb-6"
          >
            {/* Category badge */}
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 mb-4">
              {getCategoryLabel(currentQuestion.category)}
            </span>

            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6 leading-snug">
              {currentQuestion.question}
            </h2>

            {/* Answer options */}
            <div className="flex flex-col gap-3">
              {currentQuestion.answer_options.map((option, i) => {
                const isSelected = selectedScore === option.score
                const riskColors: Record<string, string> = {
                  low: 'border-emerald-200 dark:border-emerald-700',
                  medium: 'border-amber-200 dark:border-amber-700',
                  high: 'border-red-200 dark:border-red-700',
                }
                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectAnswer(option.score)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-400'
                        : `${riskColors[option.risk_level]} bg-slate-50 dark:bg-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-500`
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-slate-300 dark:border-slate-500'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white text-sm leading-relaxed">
                        {option.label}
                      </p>
                      {isSelected && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-xs text-slate-500 dark:text-slate-400 mt-1"
                        >
                          {option.status_text}
                        </motion.p>
                      )}
                    </div>
                    <span
                      className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                        option.risk_level === 'low'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                          : option.risk_level === 'medium'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {option.score}점
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* Benchmark hint */}
            {selectedScore !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">벤치마크: </span>
                  {selectedScore >= 4
                    ? currentQuestion.benchmark_text.good
                    : selectedScore >= 2
                    ? currentQuestion.benchmark_text.normal
                    : currentQuestion.benchmark_text.danger}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:border-slate-300 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            disabled={selectedScore === undefined}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold transition-colors"
          >
            {isLast ? '진단 완료' : '다음 질문'}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    main_customer: '주 고객층',
    commercial_traffic: '상권 유동인구',
    sales_time_diff: '시간대별 매출',
    menu_competitiveness: '대표 메뉴 경쟁력',
    menu_cost_rate: '메뉴 원가율',
    avg_spending_per_customer: '객단가',
    table_turnover: '테이블 회전율',
    delivery_app_exposure: '배달앱 노출',
    review_rating: '리뷰/평점',
    naver_place_status: '네이버 플레이스',
    revisit_rate: '재방문율',
  }
  return labels[category] ?? category
}
