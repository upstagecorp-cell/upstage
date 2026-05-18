'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Zap,
  Plus,
  X,
  ImagePlus,
  Trash2,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { getTodayActions } from '@/lib/actions'
import { generateActionFeedback } from '@/lib/ai-feedback'
import { getRewardMessage, getRewardState } from '@/lib/rewards'
import type { OperationType, ExecutionRecord } from '@/data/types'

const diffLabels: Record<string, string> = { easy: '쉬움', normal: '보통', hard: '어려움' }
const impactLabels: Record<string, string> = { low: '낮음', medium: '중간', high: '높음' }
const costLabels: Record<string, string> = { none: '무료', low: '소액', medium: '중간 비용' }

export default function ActionPage() {
  const router = useRouter()
  const {
    scores,
    operationType,
    diagnosisCompleted,
    executionRecords,
    weeklyGoal,
    addExecutionRecord,
    calculateStreak,
  } = useStore()

  const effectiveOpType: OperationType = operationType ?? 'hall'
  const completedIds = executionRecords.map((r) => r.action_id)
  const todayActions = getTodayActions(scores, effectiveOpType, completedIds)
  const rewardState = getRewardState(executionRecords, weeklyGoal)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [formActionId, setFormActionId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    time_spent: '',
    difficulty_note: '',
    result_memo: '',
    evidence: '',
    next_recommended_action: '',
  })
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<string>('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [recordCounter, setRecordCounter] = useState(1)

  function openForm(actionId: string) {
    setFormActionId(actionId)
    setFormData({ time_spent: '', difficulty_note: '', result_memo: '', evidence: '', next_recommended_action: '' })
    setUploadedImages([])
    setSubmittedId(null)
    setFeedbackMsg('')
  }

  function closeForm() {
    setFormActionId(null)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setUploadedImages(prev => [...prev, reader.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(index: number) {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formActionId) return
    // 근거 자료: 텍스트 + 업로드 이미지 모두 포함
    const evidenceParts: string[] = []
    if (formData.evidence.trim()) evidenceParts.push(formData.evidence.trim())
    uploadedImages.forEach((_img, i) => evidenceParts.push(`[첨부 이미지 ${i + 1}]`))
    const combinedEvidence = evidenceParts.join(' | ')

    const record: ExecutionRecord = {
      id: `rec_${recordCounter}`,
      action_id: formActionId,
      execution_date: new Date().toISOString().split('T')[0],
      time_spent: formData.time_spent,
      difficulty_note: formData.difficulty_note,
      result_memo: formData.result_memo,
      evidence: combinedEvidence || undefined,
      next_recommended_action: formData.next_recommended_action || undefined,
    }
    addExecutionRecord(record)
    setRecordCounter(c => c + 1)
    calculateStreak()
    const feedback = generateActionFeedback(record, scores)
    const rewardFeedback = getRewardMessage([record, ...executionRecords])
    setFeedbackMsg(`${feedback} ${rewardFeedback}`)
    setSubmittedId(formActionId)
    setFormActionId(null)
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
    <div className="min-h-screen bg-[#f7f7f5] dark:bg-[#191919] px-4 py-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            오늘의 액션
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            추천된 액션을 실행하고 기록을 남겨보세요
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950 dark:bg-slate-900 rounded-3xl border border-slate-900 dark:border-slate-800 p-5 text-white"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-emerald-300 mb-1">실행 보상</p>
              <h2 className="text-base font-extrabold">기록을 남길수록 더 정밀한 분석을 받을 수 있습니다</h2>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-lg font-extrabold text-emerald-300">{rewardState.completedCount}</p>
              <p className="text-[11px] text-slate-400">누적 실행</p>
            </div>
          </div>

          {rewardState.nextReward ? (
            <div className="mt-4 rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-bold text-emerald-300 mb-1">다음 보상</p>
              <p className="text-sm font-extrabold">{rewardState.nextReward.title}</p>
              <p className="text-xs text-slate-300 mt-2">
                {rewardState.nextReward.requiredCount - rewardState.completedCount}개 실행을 더 기록하면 받을 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-emerald-500 p-4 text-emerald-950">
              <p className="text-sm font-extrabold">월간 성장 리포트까지 모두 받을 수 있습니다.</p>
            </div>
          )}
        </motion.div>

        {/* Success Feedback Banner */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800"
            >
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400">{feedbackMsg}</p>
              <button onClick={() => setFeedbackMsg('')} className="ml-auto">
                <X className="w-4 h-4 text-emerald-500" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Cards */}
        {todayActions.length === 0 ? (
          <div className="bg-white dark:bg-[#202020] rounded-2xl border border-[#e9e9e7] dark:border-[#313131] p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">오늘 추천된 액션이 없습니다.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold"
            >
              대시보드로 돌아가기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {todayActions.map((action, i) => {
              const isCompleted = completedIds.includes(action.action_id)
              const isExpanded = expandedId === action.action_id
              const isSubmittedNow = submittedId === action.action_id

              return (
                <motion.div
                  key={action.action_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`bg-white dark:bg-[#202020] rounded-2xl overflow-hidden border transition-colors ${
                    isCompleted || isSubmittedNow
                      ? 'border-emerald-200 dark:border-emerald-800'
                      : 'border-transparent'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isCompleted || isSubmittedNow
                            ? 'bg-emerald-100 dark:bg-emerald-900'
                            : 'bg-amber-100 dark:bg-amber-900'
                        }`}
                      >
                        {isCompleted || isSubmittedNow ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white">{action.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            {action.expected_time}
                          </span>
                          <span className="text-xs text-slate-500">난이도: {diffLabels[action.difficulty]}</span>
                          <span className="text-xs text-slate-500">효과: {impactLabels[action.impact]}</span>
                          <span className="text-xs text-slate-500">비용: {costLabels[action.cost]}</span>
                          {action.solo_possible && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">혼자 가능</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expand / collapse steps */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : action.action_id)}
                      className="w-full flex items-center justify-between text-sm text-indigo-600 dark:text-indigo-400 font-semibold py-2 border-t border-slate-100 dark:border-slate-700"
                    >
                      실행 단계 보기
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <ol className="flex flex-col gap-2 mt-3">
                            {action.execution_steps.map((step, si) => (
                              <li key={si} className="flex items-start gap-3 text-sm">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
                                  {si + 1}
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                          <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                            <p className="text-xs text-emerald-700 dark:text-emerald-400">
                              <span className="font-bold">성공 기준: </span>
                              {action.success_condition}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* CTA */}
                    {!isCompleted && !isSubmittedNow && (
                      <button
                        onClick={() => openForm(action.action_id)}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        실행 완료 기록하기
                      </button>
                    )}
                    {(isCompleted || isSubmittedNow) && (
                      <div className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold">
                        <CheckCircle className="w-4 h-4" />
                        완료됨
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Record form modal */}
        <AnimatePresence>
          {formActionId && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={closeForm}
              />
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 60 }}
                className="fixed inset-x-4 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50 bg-white dark:bg-[#202020] rounded-2xl border border-[#e9e9e7] dark:border-[#313131] p-6 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-slate-900 dark:text-white">실행 기록</h3>
                  <button onClick={closeForm} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      실제 소요 시간 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 45분"
                      value={formData.time_spent}
                      onChange={(e) => setFormData({ ...formData, time_spent: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      어려웠던 점
                    </label>
                    <input
                      type="text"
                      placeholder="실행 중 어려웠던 점을 적어주세요"
                      value={formData.difficulty_note}
                      onChange={(e) => setFormData({ ...formData, difficulty_note: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      결과 메모 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="실행 결과를 간단히 적어주세요"
                      value={formData.result_memo}
                      onChange={(e) => setFormData({ ...formData, result_memo: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      근거 자료 <span className="text-red-400">*</span>
                    </label>
                    <p className="text-xs text-slate-400 mb-2">URL, 수치, 텍스트 입력 또는 스크린샷을 첨부하세요</p>
                    <input
                      type="text"
                      required={uploadedImages.length === 0}
                      placeholder="예: 네이버 플레이스 URL, 원가율 32%, 리뷰 응답 완료 등"
                      value={formData.evidence}
                      onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-400"
                    />
                    {/* File upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-colors"
                    >
                      <ImagePlus className="w-4 h-4" />
                      스크린샷 첨부하기
                    </button>
                    {/* Image previews */}
                    {uploadedImages.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt={`첨부 ${idx + 1}`} className="w-full h-20 object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      다음 시도할 액션 (선택)
                    </label>
                    <input
                      type="text"
                      placeholder="다음에 도전하고 싶은 것"
                      value={formData.next_recommended_action}
                      onChange={(e) => setFormData({ ...formData, next_recommended_action: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    기록 저장하기
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Go to history */}
        <button
          onClick={() => router.push('/history')}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-colors"
        >
          실행 히스토리 보기
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
