'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check } from 'lucide-react'
import { useStore } from '@/lib/store'
import { INDUSTRIES, STAGES, SUB_INDUSTRIES } from '@/data/constants'
import { IndustryId, StageId, SubIndustryId } from '@/data/types'

export default function OnboardingPage() {
  const router = useRouter()
  const { setIndustry, setStage, setSubIndustry } = useStore()
  const [step, setStep] = useState<number>(1)
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryId | null>(null)
  const [selectedSubIndustry, setSelectedSubIndustry] = useState<SubIndustryId | null>(null)
  const [selectedStage, setSelectedStage] = useState<StageId | null>(null)

  const subIndustries = selectedIndustry
    ? SUB_INDUSTRIES.filter(s => s.parentIndustry === selectedIndustry)
    : []
  const hasSubIndustries = subIndustries.length > 0

  // 총 단계 수 (하위 분류 여부에 따라 2 or 3)
  const totalSteps = hasSubIndustries || step >= 1.5 ? 3 : 2

  // step → 표시용 숫자 (1, 1.5→2, 2→3)
  const displayStep = step === 1 ? 1 : step === 1.5 ? 2 : 3

  const handleNext = () => {
    if (step === 1 && selectedIndustry) {
      setIndustry(selectedIndustry)
      const subs = SUB_INDUSTRIES.filter(s => s.parentIndustry === selectedIndustry)
      if (subs.length > 0) {
        setStep(1.5)
      } else {
        setStep(2)
      }
    } else if (step === 1.5 && selectedSubIndustry) {
      setSubIndustry(selectedSubIndustry)
      setStep(2)
    } else if (step === 2 && selectedStage) {
      setStage(selectedStage)
      router.push('/diagnosis')
    }
  }

  const handlePrev = () => {
    if (step === 1.5) {
      setStep(1)
      setSelectedSubIndustry(null)
    } else if (step === 2) {
      if (hasSubIndustries) {
        setStep(1.5)
      } else {
        setStep(1)
      }
    }
  }

  const stepLabels: Record<number, string> = {
    1: '업종 선택',
    1.5: '세부 분류',
    2: '사업 단계 선택',
  }

  // 프로그레스 스텝 인덱스 배열
  const stepIndices = totalSteps === 3 ? [1, 1.5, 2] : [1, 2]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            {stepIndices.map((s, idx) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    s < step
                      ? 'bg-indigo-600 text-white'
                      : s === step
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                {idx < stepIndices.length - 1 && (
                  <div
                    className={`h-0.5 w-16 transition-all ${
                      s < step ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {displayStep} / {totalSteps} 단계 — {stepLabels[step]}
          </p>
        </div>

        {/* Step 1: Industry */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">어떤 업종인가요?</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">업종에 맞는 맞춤 진단 질문을 제공합니다</p>
            <div className="grid grid-cols-2 gap-3">
              {INDUSTRIES.map(industry => (
                <button
                  key={industry.id}
                  onClick={() => setSelectedIndustry(industry.id)}
                  className={`relative p-5 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 ${
                    selectedIndustry === industry.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  {selectedIndustry === industry.id && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="text-3xl mb-3">{industry.icon}</div>
                  <div className="font-semibold text-slate-900 dark:text-white">{industry.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{industry.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1.5: Sub-industry */}
        {step === 1.5 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">세부 업종을 선택해 주세요</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">더 정확한 맞춤 진단을 위한 세부 분류입니다</p>
            <div className="grid grid-cols-2 gap-3">
              {subIndustries.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubIndustry(sub.id)}
                  className={`relative p-5 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 ${
                    selectedSubIndustry === sub.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  {selectedSubIndustry === sub.id && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="font-semibold text-slate-900 dark:text-white">{sub.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Stage */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">사업의 현재 단계는요?</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">현재 단계에 맞는 전략과 실행 방안을 제시합니다</p>
            <div className="grid grid-cols-1 gap-3">
              {STAGES.map(stage => (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStage(stage.id)}
                  className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                    selectedStage === stage.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl ${selectedStage === stage.id ? '' : 'opacity-70'}`}>{stage.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white">{stage.label}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{stage.description}</div>
                    </div>
                    {selectedStage === stage.id && (
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step !== 1 && (
            <button
              onClick={handlePrev}
              className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              이전
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={
              step === 1 ? !selectedIndustry :
              step === 1.5 ? !selectedSubIndustry :
              !selectedStage
            }
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all"
          >
            {step === 2 ? '진단 시작하기' : '다음'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
