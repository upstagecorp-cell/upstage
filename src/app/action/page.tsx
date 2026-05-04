'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, RefreshCw, ArrowRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { recommendActions } from '@/lib/actions'
import { getActionById } from '@/data/actions'
import { AREAS } from '@/data/constants'
import { applyScoreGain } from '@/lib/scoring'
import { ActionRecord, AreaId } from '@/data/types'

const STATUS_CONFIG = {
  completed: {
    label: '완료',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  partial: {
    label: '일부 완료',
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
  },
  skipped: {
    label: '미완료',
    icon: Clock,
    color: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
  },
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

function ActionCard({
  actionId,
  onRecord,
}: {
  actionId: string
  onRecord: (actionId: string, status: 'completed' | 'partial' | 'skipped', memo: string) => void
}) {
  const action = getActionById(actionId)
  const [expanded, setExpanded] = useState(false)
  const [memo, setMemo] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'completed' | 'partial' | 'skipped' | null>(null)

  if (!action) return null

  const area = AREAS.find(a => a.id === action.areaId)

  const handleSubmit = () => {
    if (!selectedStatus) return
    onRecord(action.id, selectedStatus, memo)
    setExpanded(false)
    setMemo('')
    setSelectedStatus(null)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-xl mt-0.5">{area?.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: area?.color + '20', color: area?.color }}
              >
                {area?.label}
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

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setExpanded(false); setSelectedStatus(null); setMemo('') }}
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

export default function ActionPage() {
  const { scores, diagnosisCompleted, todayActionIds, actionRecords, setTodayActions, addActionRecord, updateScores, scores: currentScores } = useStore()
  const displayScores = diagnosisCompleted ? scores : SAMPLE_SCORES
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    // Generate today's recommendations if not set
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

  const handleRecord = (actionId: string, status: 'completed' | 'partial' | 'skipped', memo: string) => {
    const action = getActionById(actionId)
    if (!action) return

    const scoreGain = status === 'completed' ? action.scoreImpact : status === 'partial' ? Math.floor(action.scoreImpact / 2) : 0

    const record: ActionRecord = {
      id: `rec_${Date.now()}`,
      actionId,
      date: new Date().toISOString().split('T')[0],
      status,
      memo,
      link: '',
      scoreGain,
    }

    addActionRecord(record)

    // Update scores if gain > 0 and diagnosis was completed
    if (diagnosisCompleted && scoreGain > 0) {
      const newScores = applyScoreGain(currentScores, action.areaId, scoreGain)
      updateScores(newScores)
    }

    // Remove from today's list
    const newIds = todayActionIds.filter(id => id !== actionId)
    setTodayActions(newIds)
  }

  // Today's records
  const today = new Date().toISOString().split('T')[0]
  const todayRecords = actionRecords.filter(r => r.date === today)

  if (!mounted) return null

  return (
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
            <Link href="/onboarding" className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors">
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
  )
}
