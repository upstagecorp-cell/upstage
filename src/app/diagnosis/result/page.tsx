'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { AREAS } from '@/data/constants'
import { getQuestionsForContext } from '@/data/questions'
import { SCORE_MESSAGES } from '@/data/score-messages'
import { getStatusLevel, getTotalScore } from '@/lib/scoring'
import { AreaId } from '@/data/types'
import { generateDiagnosisFeedback } from '@/lib/ai-feedback'

export default function DiagnosisResultPage() {
  const router = useRouter()
  const { industry, subIndustry, stage, answers, scores, diagnosisCompleted } = useStore()

  useEffect(() => {
    if (!diagnosisCompleted) {
      router.replace('/onboarding')
    }
  }, [diagnosisCompleted, router])

  if (!diagnosisCompleted || !industry) return null

  const questions = getQuestionsForContext(industry, subIndustry, stage)
  const totalScore = getTotalScore(scores)

  const aiFeedbackList = generateDiagnosisFeedback(answers, scores, industry, subIndustry)

  const areaGroups: Record<AreaId, typeof questions> = {
    customer: [],
    validation: [],
    product: [],
    acquisition: [],
    revenue: [],
    operation: [],
    growth: [],
  }
  for (const q of questions) {
    if (areaGroups[q.areaId]) {
      areaGroups[q.areaId].push(q)
    }
  }

  const sortedAreas = AREAS.map(a => ({ ...a, score: scores[a.id] ?? 0 })).sort(
    (a, b) => a.score - b.score,
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-medium mb-4">
            진단 완료
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            진단 결과 상세 해석
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            각 질문에 대한 답변이 점수에 어떻게 반영됐는지 확인하세요
          </p>

          <div className="mt-5 p-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm mb-1">종합 점수</p>
                <p className="text-4xl font-extrabold">{totalScore}점</p>
              </div>
              <div className="text-right">
                <p className="text-indigo-100 text-xs mb-1">평가</p>
                <p className="text-lg font-bold">{getStatusLevel(totalScore).label}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI 분석 섹션 */}
        {aiFeedbackList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-8 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-800 overflow-hidden shadow-sm"
          >
            <div className="p-5 border-b border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h2 className="font-bold text-indigo-900 dark:text-indigo-100">AI 맞춤 분석</h2>
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">답변 패턴과 업종을 분석해 생성한 개인화 피드백입니다</p>
            </div>
            <div className="divide-y divide-indigo-50 dark:divide-indigo-900/50">
              {aiFeedbackList.map((fb, i) => (
                <div key={i} className="p-4 flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{fb}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 영역별 섹션 */}
        <div className="space-y-6">
          {sortedAreas.map((area, areaIdx) => {
            const areaQuestions = areaGroups[area.id]
            if (areaQuestions.length === 0) return null

            const status = getStatusLevel(area.score)
            const areaMessages = SCORE_MESSAGES[area.id]
            const areaMessage = areaMessages
              ?.slice()
              .sort((a, b) => a.threshold - b.threshold)
              .reverse()
              .find(m => area.score >= m.threshold)

            return (
              <motion.div
                key={area.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: areaIdx * 0.07 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
              >
                <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{area.icon}</span>
                      <h2 className="font-bold text-slate-900 dark:text-white">{area.label}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold" style={{ color: area.color }}>
                        {area.score}점
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${area.score}%`, backgroundColor: area.color }}
                    />
                  </div>
                  {areaMessage && (
                    <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {areaMessage.message}
                    </p>
                  )}
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {areaQuestions.map(q => {
                    const selectedScore = answers[q.id]
                    const selectedOption = q.options.find(o => o.score === selectedScore)

                    return (
                      <div key={q.id} className="p-5">
                        <p className="font-medium text-slate-900 dark:text-white text-sm mb-3 leading-relaxed">
                          {q.text}
                        </p>

                        <div className="mb-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900">
                          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                            이 질문이 중요한 이유
                          </p>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed">
                            {q.why}
                          </p>
                        </div>

                        {selectedOption ? (
                          <>
                            <div className="mb-2 flex items-start gap-2">
                              <div className="flex-shrink-0 mt-0.5 w-2 h-2 rounded-full bg-indigo-500" />
                              <div>
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  내 답변:{' '}
                                </span>
                                <span className="text-xs text-slate-700 dark:text-slate-300">
                                  {selectedOption.label}
                                </span>
                              </div>
                            </div>

                            <div className="mb-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                              <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                {selectedOption.interpretation}
                              </p>
                            </div>

                            <div className="mb-3 flex items-center gap-2 text-xs">
                              <span
                                className="font-bold text-white px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: area.color }}
                              >
                                +{selectedOption.score * 10}점
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">
                                이 답변은 {area.label} 점수에{' '}
                                <strong className="text-slate-700 dark:text-slate-200">
                                  {selectedOption.score * 10}점
                                </strong>
                                으로 반영되었습니다
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900">
                            <p className="text-xs text-red-600 dark:text-red-400">
                              이 질문에 답하지 않았습니다 (0점 처리)
                            </p>
                          </div>
                        )}

                        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900">
                          <span className="text-amber-500 flex-shrink-0 mt-0.5">→</span>
                          <div>
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-0.5">
                              개선하면
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                              {q.improvementHint}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-8"
        >
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base transition-all shadow-lg shadow-indigo-500/20"
          >
            대시보드 보기
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </div>
  )
}
