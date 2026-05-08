'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { INDUSTRIES, STAGES, OPERATION_TYPES } from '@/data/constants'
import type { IndustryId, StageId, OperationType } from '@/data/types'

const TOTAL_STEPS = 3

export default function OnboardingPage() {
  const router = useRouter()
  const { setIndustry, setStage, setOperationType } = useStore()

  const [step, setStep] = useState(1)
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryId | null>(null)
  const [selectedOpType, setSelectedOpType] = useState<OperationType | null>(null)
  const [selectedStage, setSelectedStage] = useState<StageId | null>(null)

  const progress = (step / TOTAL_STEPS) * 100

  function handleNext() {
    if (step === 1) {
      if (!selectedIndustry) return
      setIndustry(selectedIndustry)
      setStep(2)
    } else if (step === 2) {
      if (selectedIndustry === 'restaurant' && !selectedOpType) return
      if (selectedOpType) setOperationType(selectedOpType)
      setStep(3)
    } else if (step === 3) {
      if (!selectedStage) return
      setStage(selectedStage)
      router.push('/diagnosis')
    }
  }

  function handleBack() {
    if (step > 1) setStep(step - 1)
  }

  const stepLabels = ['업종 선택', '운영 유형', '창업 단계']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step > i + 1
                      ? 'bg-indigo-600 text-white'
                      : step === i + 1
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-600 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: 업종 선택 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">어떤 업종을 운영하시나요?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">업종에 맞는 맞춤 진단을 제공합니다</p>
              <div className="grid grid-cols-2 gap-3">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind.id}
                    onClick={() => setSelectedIndustry(ind.id)}
                    className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedIndustry === ind.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                  >
                    <span className="text-2xl">{ind.icon}</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{ind.label}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{ind.description}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: 운영 유형 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">주요 운영 방식은 무엇인가요?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                {selectedIndustry === 'restaurant'
                  ? '운영 방식에 따라 핵심 지표 가중치가 달라집니다'
                  : '현재는 음식점 진단만 지원합니다. 운영 유형을 선택하세요.'}
              </p>
              <div className="flex flex-col gap-3">
                {OPERATION_TYPES.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setSelectedOpType(op.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedOpType === op.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        selectedOpType === op.id
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{op.label}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{op.description}</div>
                    </div>
                  </button>
                ))}
              </div>
              {selectedIndustry !== 'restaurant' && (
                <p className="mt-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 rounded-xl p-3">
                  현재 음식점 외 업종 진단은 준비 중입니다. 음식점 진단으로 진행합니다.
                </p>
              )}
            </motion.div>
          )}

          {/* Step 3: 단계 선택 */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">현재 사업 단계는 어떻게 되나요?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">단계별로 집중해야 할 지표가 다릅니다</p>
              <div className="flex flex-col gap-3">
                {STAGES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStage(s.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedStage === s.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{s.icon}</span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{s.label}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{s.description}</div>
                    </div>
                    {selectedStage === s.id && (
                      <CheckCircle className="w-5 h-5 text-indigo-500 ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:border-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              이전
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            disabled={
              (step === 1 && !selectedIndustry) ||
              (step === 2 && selectedIndustry === 'restaurant' && !selectedOpType) ||
              (step === 3 && !selectedStage)
            }
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold transition-colors"
          >
            {step === TOTAL_STEPS ? '진단 시작하기' : '다음'}
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
