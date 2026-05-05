'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowRight,
  Search,
  PenTool,
  FlaskConical,
  Settings,
  BarChart2,
  TrendingUp,
  BookOpen,
  X,
  Link2,
  Hash,
  Type,
  Trash2,
  Plus,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { recommendActions } from '@/lib/actions'
import { getActionById } from '@/data/actions'
import { AREAS, ACTION_TYPE_CONFIG } from '@/data/constants'
import { applyScoreGain } from '@/lib/scoring'
import { ActionRecord, AreaId, ActionType } from '@/data/types'

const STATUS_CONFIG = {
  completed: {
    label: '완료',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    border: 'border-emerald-200 dark:border-emerald-800',
    modalBg: 'bg-emerald-100 dark:bg-emerald-900',
    modalIcon: 'text-emerald-500',
  },
  partial: {
    label: '일부 완료',
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
    modalBg: 'bg-amber-100 dark:bg-amber-900',
    modalIcon: 'text-amber-500',
  },
  skipped: {
    label: '미완료',
    icon: Clock,
    color: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
    modalBg: 'bg-slate-100 dark:bg-slate-800',
    modalIcon: 'text-slate-400',
  },
}

const ACTION_TYPE_ICON_MAP: Record<ActionType, React.ElementType> = {
  research: Search,
  create: PenTool,
  test: FlaskConical,
  operate: Settings,
  measure: BarChart2,
  improve: TrendingUp,
  learn: BookOpen,
}

const ACTION_TYPE_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
}

const SAMPLE_SCORES: Record<AreaId, number> = {
  customer: 45,
  validation: 30,
  product: 60,
  acquisition: 25,
  revenue: 50,
  operation: 70,
  growth: 40,
}

// ─── Feedback Modal ───────────────────────────────────────────────────────────

interface FeedbackData {
  status: 'completed' | 'partial' | 'skipped'
  feedbackMessage: string
  scoreGain: number
  areaLabel: string
  nextActionId?: string
}

function FeedbackModal({
  data,
  onClose,
}: {
  data: FeedbackData
  onClose: () => void
}) {
  const config = STATUS_CONFIG[data.status]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 16 }}
        transition={{ type: 'spring', duration: 0.35 }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 아이콘 */}
        <div className={`w-14 h-14 rounded-2xl ${config.modalBg} flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-7 h-7 ${config.modalIcon}`} />
        </div>

        {/* 상태 라벨 */}
        <p className={`text-center text-sm font-semibold mb-2 ${config.color}`}>
          {config.label}
        </p>

        {/* 피드백 메시지 */}
        <p className="text-center text-slate-800 dark:text-white font-medium leading-relaxed mb-4">
          {data.feedbackMessage}
        </p>

        {/* 점수 변화 */}
        {data.scoreGain > 0 && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-sm font-bold">
              +{data.scoreGain}점
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{data.areaLabel} 점수 반영</span>
          </div>
        )}

        {/* 다음 추천 액션 안내 */}
        {data.nextActionId && data.status === 'completed' && (
          <div className="mb-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900">
            <p className="text-xs text-indigo-700 dark:text-indigo-300 text-center">
              다음 추천 액션이 준비되어 있습니다
            </p>
          </div>
        )}

        {/* 확인 버튼 */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
        >
          확인
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── ActionCard ───────────────────────────────────────────────────────────────

type EvidenceType = 'link' | 'number' | 'text'
type EvidenceItem = { type: EvidenceType; value: string }

const EVIDENCE_TYPE_CONFIG: Record<EvidenceType, { label: string; icon: React.ElementType; placeholder: string; inputType: string }> = {
  link: { label: '링크', icon: Link2, placeholder: 'https://...', inputType: 'url' },
  number: { label: '숫자', icon: Hash, placeholder: '0', inputType: 'number' },
  text: { label: '텍스트', icon: Type, placeholder: '증거 내용을 입력하세요', inputType: 'text' },
}

function ActionCard({
  actionId,
  onRecord,
}: {
  actionId: string
  onRecord: (actionId: string, status: 'completed' | 'partial' | 'skipped', memo: string, evidence: EvidenceItem[]) => void
}) {
  const action = getActionById(actionId)
  const [expanded, setExpanded] = useState(false)
  const [memo, setMemo] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'completed' | 'partial' | 'skipped' | null>(null)
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([])
  const [showEvidenceTypeSelect, setShowEvidenceTypeSelect] = useState(false)

  if (!action) return null

  const area = AREAS.find(a => a.id === action.areaId)
  const typeConfig = ACTION_TYPE_CONFIG[action.actionType]
  const TypeIcon = ACTION_TYPE_ICON_MAP[action.actionType]
  const typeColorClass = ACTION_TYPE_COLOR_MAP[typeConfig.color] ?? ACTION_TYPE_COLOR_MAP.slate

  const addEvidence = (type: EvidenceType) => {
    setEvidenceList(prev => [...prev, { type, value: '' }])
    setShowEvidenceTypeSelect(false)
  }

  const updateEvidence = (idx: number, value: string) => {
    setEvidenceList(prev => prev.map((e, i) => i === idx ? { ...e, value } : e))
  }

  const removeEvidence = (idx: number) => {
    setEvidenceList(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = () => {
    if (!selectedStatus) return
    const validEvidence = evidenceList.filter(e => e.value.trim() !== '')
    onRecord(action.id, selectedStatus, memo, validEvidence)
    setExpanded(false)
    setMemo('')
    setSelectedStatus(null)
    setEvidenceList([])
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-xl mt-0.5">{area?.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: area?.color + '20', color: area?.color }}
              >
                {area?.label}
              </span>
              {/* 액션 타입 배지 */}
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${typeColorClass}`}>
                <TypeIcon className="w-3 h-3" />
                {typeConfig.label}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {action.estimatedTime}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{action.title}</h3>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{action.description}</p>

        {/* Criteria */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 mb-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">완료 기준</p>
          <p className="text-xs text-slate-700 dark:text-slate-300">{action.criteria}</p>
        </div>

        {/* Score Impact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[10px] font-bold">+</span>
            완료 시 {area?.label} +{action.scoreImpact}점
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            기록하기
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Recording Panel */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">오늘 이 액션을 어디까지 했나요?</p>

          {/* Status Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(Object.keys(STATUS_CONFIG) as Array<'completed' | 'partial' | 'skipped'>).map(status => {
              const config = STATUS_CONFIG[status]
              const Icon = config.icon
              const isSelected = selectedStatus === status
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    isSelected
                      ? `${config.border} ${config.bg} ${config.color}`
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {config.label}
                </button>
              )
            })}
          </div>

          {/* Memo */}
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="메모 (선택사항) — 배운 점, 장벽, 다음 단계..."
            className="w-full h-20 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600"
          />

          {/* Evidence Section */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">증거 첨부</span>
              <div className="relative">
                <button
                  onClick={() => setShowEvidenceTypeSelect(prev => !prev)}
                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  증거 추가
                </button>
                {showEvidenceTypeSelect && (
                  <div className="absolute right-0 top-6 z-10 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden min-w-[120px]">
                    {(Object.entries(EVIDENCE_TYPE_CONFIG) as [EvidenceType, typeof EVIDENCE_TYPE_CONFIG[EvidenceType]][]).map(([type, cfg]) => {
                      const EIcon = cfg.icon
                      return (
                        <button
                          key={type}
                          onClick={() => addEvidence(type)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <EIcon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {evidenceList.length > 0 && (
              <div className="space-y-2">
                {evidenceList.map((ev, idx) => {
                  const cfg = EVIDENCE_TYPE_CONFIG[ev.type]
                  const EIcon = cfg.icon
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                        <EIcon className="w-3 h-3" />
                        {cfg.label}
                      </div>
                      <input
                        type={cfg.inputType}
                        value={ev.value}
                        onChange={e => updateEvidence(idx, e.target.value)}
                        placeholder={cfg.placeholder}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <button
                        onClick={() => removeEvidence(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setExpanded(false); setSelectedStatus(null); setMemo(''); setEvidenceList([]) }}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedStatus}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              기록 저장
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ActionPage ───────────────────────────────────────────────────────────────

export default function ActionPage() {
  const {
    scores,
    diagnosisCompleted,
    todayActionIds,
    actionRecords,
    setTodayActions,
    addActionRecord,
    updateScores,
    scores: currentScores,
  } = useStore()
  const displayScores = diagnosisCompleted ? scores : SAMPLE_SCORES
  const [mounted, setMounted] = useState(false)
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (todayActionIds.length === 0) {
      const completedIds = actionRecords.map(r => r.actionId)
      const recommended = recommendActions(displayScores, completedIds, 3)
      setTodayActions(recommended.map(a => a.id))
    }
  }, [mounted])

  const handleRefresh = () => {
    const completedIds = actionRecords.map(r => r.actionId)
    const recommended = recommendActions(displayScores, completedIds, 3)
    setTodayActions(recommended.map(a => a.id))
  }

  const handleRecord = (actionId: string, status: 'completed' | 'partial' | 'skipped', memo: string, evidence: { type: 'link' | 'number' | 'text'; value: string }[]) => {
    const action = getActionById(actionId)
    if (!action) return

    const scoreGain =
      status === 'completed'
        ? action.scoreImpact
        : status === 'partial'
        ? Math.floor(action.scoreImpact / 2)
        : 0

    const record: ActionRecord = {
      id: `rec_${Date.now()}`,
      actionId,
      date: new Date().toISOString().split('T')[0],
      status,
      memo,
      link: '',
      scoreGain,
      evidence: evidence.length > 0 ? evidence : undefined,
    }

    addActionRecord(record)

    if (diagnosisCompleted && scoreGain > 0) {
      const newScores = applyScoreGain(currentScores, action.areaId, scoreGain)
      updateScores(newScores)
    }

    const newIds = todayActionIds.filter(id => id !== actionId)
    setTodayActions(newIds)

    // 피드백 메시지 선택
    const feedbackMessage =
      status === 'completed'
        ? action.feedback.completed
        : status === 'partial'
        ? action.feedback.partial
        : action.feedback.skipped

    const area = AREAS.find(a => a.id === action.areaId)

    setFeedbackData({
      status,
      feedbackMessage,
      scoreGain,
      areaLabel: area?.label ?? '',
      nextActionId: action.nextActionId,
    })
  }

  // Today's records
  const today = new Date().toISOString().split('T')[0]
  const todayRecords = actionRecords.filter(r => r.date === today)

  if (!mounted) return null

  return (
    <>
      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackData && (
          <FeedbackModal data={feedbackData} onClose={() => setFeedbackData(null)} />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">오늘의 실행</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              새로 추천
            </button>
          </div>

          {!diagnosisCompleted && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
              <div className="text-amber-600 dark:text-amber-400 text-sm flex-1">
                <strong>샘플 액션입니다.</strong> 진단 완료 후 내 점수에 맞는 맞춤 액션이 추천됩니다.
              </div>
              <Link
                href="/onboarding"
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
              >
                진단하기
              </Link>
            </div>
          )}

          {/* Today's progress */}
          {todayRecords.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-emerald-800 dark:text-emerald-200">오늘 {todayRecords.length}개 완료!</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {todayRecords.map(record => {
                  const action = getActionById(record.actionId)
                  const config = STATUS_CONFIG[record.status]
                  const Icon = config.icon
                  return (
                    <div key={record.id} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                      <Icon className="w-3 h-3" />
                      {action?.title || '알 수 없는 액션'}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          <div className="mb-8">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              추천 액션 {todayActionIds.length > 0 ? `(${todayActionIds.length}개)` : ''}
            </h2>

            {todayActionIds.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">오늘 액션을 모두 완료했어요!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">내일 새로운 액션이 추천됩니다</p>
                <button
                  onClick={handleRefresh}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                >
                  더 많은 액션 보기
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {todayActionIds.map(id => (
                  <ActionCard key={id} actionId={id} onRecord={handleRecord} />
                ))}
              </div>
            )}
          </div>

          {/* Today's Records */}
          {actionRecords.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">최근 실행 기록</h2>
                <Link
                  href="/history"
                  className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 font-medium hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  전체 보기
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {actionRecords.slice(0, 5).map(record => {
                  const action = getActionById(record.actionId)
                  const area = action ? AREAS.find(a => a.id === action.areaId) : null
                  const config = STATUS_CONFIG[record.status]
                  const Icon = config.icon

                  return (
                    <div
                      key={record.id}
                      className={`p-4 rounded-xl border ${config.border} ${config.bg}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-slate-900 dark:text-white text-sm">{action?.title || '알 수 없는 액션'}</span>
                            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                            {record.scoreGain > 0 && (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+{record.scoreGain}점</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            {area && <span>{area.icon} {area.label}</span>}
                            <span>•</span>
                            <span>{record.date}</span>
                          </div>
                          {record.memo && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 italic">&ldquo;{record.memo}&rdquo;</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
