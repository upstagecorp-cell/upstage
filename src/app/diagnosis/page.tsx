'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { QUESTIONS_BY_INDUSTRY } from '@/data/questions'
import { calculateScores } from '@/lib/scoring'
import { Question } from '@/data/types'

export default function DiagnosisPage() {
  const router = useRouter()
  const { industry, setAnswer, answers, completeDiagnosis, resetDiagnosis } = useStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showWhy, setShowWhy] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    if (!industry) {
      router.replace('/onboarding')
      return
    }
    resetDiagnosis()
    setQuestions(QUESTIONS_BY_INDUSTRY[industry])
  }, [industry])

  if (!industry || questions.length === 0) return null

  const total = questions.length
  const current = questions[currentIndex]
  const selectedScore = answers[current?.id]
  const progress = ((currentIndex) / total) * 100

  const handleAnswer = (score: number) => {
    setAnswer(current.id, score)
  }

  const handleNext = () => {
    if (selectedScore === undefined) return
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1)
      setShowWhy(false)
    } else {
      // 완료
      const scores = calculateScores(answers, questions)
      completeDiagnosis(scores)
      router.push('/diagnosis/result')
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setShowWhy(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-2">
            <span>질문 {currentIndex + 1} / {total}</span>
            <span>{Math.round((currentIndex / total) * 100)}% 완료</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {/* Area Badge */}
          <div className="px-6 pt-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-medium mb-4">
              영역: {getAreaLabel(current?.areaId)}
            </div>
          </div>

          {/* Question */}
          <div className="px-6 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {current?.text}
            </h2>
          </div>

          {/* Why Toggle */}
          <div className="px-6 pb-4">
            <button
              onClick={() => setShowWhy(!showWhy)}
              className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              {showWhy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              이 질문이 중요한 이유
            </button>
            {showWhy && (
              <div className="mt-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900">
                <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">
                  {current?.why}
                </p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="px-6 pb-6 space-y-3">
            {current?.options.map((option, i) => {
              const isSelected = selectedScore === option.score
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(option.score)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{option.label}</p>
                      {isSelected && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">{option.interpretation}</p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Improvement hint (when answered) */}
          {selectedScore !== undefined && (
            <div className="mx-6 mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                <span className="font-bold">개선하면:</span> {current?.improvementHint}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex gap-3">
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              이전
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={selectedScore === undefined}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all"
          >
            {currentIndex === total - 1 ? '진단 완료 및 결과 보기' : '다음 질문'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function getAreaLabel(areaId?: string) {
  const map: Record<string, string> = {
    customer: '고객이해도',
    validation: '문제검증도',
    product: '상품경쟁력',
    acquisition: '유입구조',
    revenue: '수익성',
    operation: '운영지속성',
    growth: '성장가능성',
  }
  return areaId ? (map[areaId] || areaId) : ''
}
