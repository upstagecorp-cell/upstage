'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Calendar,
  CheckCircle2,
  TrendingUp,
  X,
  Plus,
  ChevronRight,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { useMounted } from '@/lib/use-mounted'
import { AREAS } from '@/data/constants'
import { AreaId, WeeklyGoal } from '@/data/types'

const AREA_COLORS: Record<AreaId, string> = {
  customer: '#6366f1',
  validation: '#8b5cf6',
  product: '#ec4899',
  acquisition: '#f59e0b',
  revenue: '#10b981',
  operation: '#3b82f6',
  growth: '#14b8a6',
}

function GoalModal({ onClose, onSave }: { onClose: () => void; onSave: (goal: WeeklyGoal) => void }) {
  const [title, setTitle] = useState('')
  const [targetAreaId, setTargetAreaId] = useState<AreaId>('customer')

  const handleSave = () => {
    if (!title.trim()) return
    const today = new Date()
    const end = new Date(today)
    end.setDate(today.getDate() + 6)

    const goal: WeeklyGoal = {
      id: `goal_${Date.now()}`,
      title: title.trim(),
      targetAreaId,
      startDate: today.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      targetActions: [],
      completedActions: [],
    }
    onSave(goal)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', duration: 0.35 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">주간 목표 설정</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">목표 제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="이번 주 달성하고 싶은 목표를 입력하세요"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">타겟 영역</label>
            <div className="grid grid-cols-2 gap-2">
              {AREAS.map(area => (
                <button
                  key={area.id}
                  onClick={() => setTargetAreaId(area.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    targetAreaId === area.id
                      ? 'text-white border-transparent'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                  style={targetAreaId === area.id ? { backgroundColor: AREA_COLORS[area.id], borderColor: AREA_COLORS[area.id] } : {}}
                >
                  <span>{area.icon}</span>
                  <span>{area.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>오늘부터 7일간 자동 설정됩니다</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            저장
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function GoalsPage() {
  const { weeklyGoal, setWeeklyGoal, actionRecords, scoreHistory } = useStore()
  const [showModal, setShowModal] = useState(false)
  const mounted = useMounted()

  if (!mounted) return null

  // 주간 목표 진척률
  const progressPct = weeklyGoal && weeklyGoal.targetActions.length > 0
    ? Math.round((weeklyGoal.completedActions.length / weeklyGoal.targetActions.length) * 100)
    : weeklyGoal
    ? 0
    : 0

  // 남은 일수
  // 30일 성장 리포트
  const today = new Date()
  const daysLeft = weeklyGoal
    ? Math.max(0, Math.ceil((new Date(weeklyGoal.endDate).getTime() - today.getTime()) / 86400000))
    : 0
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 29)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  const recent30Records = actionRecords.filter(r => r.date >= thirtyDaysAgoStr)
  const totalCompleted = recent30Records.filter(r => r.status === 'completed').length
  const totalScoreGain = recent30Records.reduce((sum, r) => sum + r.scoreGain, 0)

  // 가장 많이 성장한 영역
  const areaGainMap: Record<string, number> = {}
  // Use scoreHistory to detect area improvements over last 30 days
  const recent30History = scoreHistory.filter(s => s.date >= thirtyDaysAgoStr)
  if (recent30History.length >= 2) {
    const first = recent30History[0].scores
    const last = recent30History[recent30History.length - 1].scores
    for (const area of AREAS) {
      areaGainMap[area.id] = (last[area.id] ?? 0) - (first[area.id] ?? 0)
    }
  }
  const topAreaId = Object.entries(areaGainMap).sort((a, b) => b[1] - a[1])[0]?.[0] as AreaId | undefined
  const topArea = topAreaId ? AREAS.find(a => a.id === topAreaId) : null
  const topAreaGain = topAreaId ? areaGainMap[topAreaId] : 0

  // 실행 캘린더 (최근 30일)
  const activeDates = new Set(
    actionRecords
      .filter(r => r.status === 'completed' && r.date >= thirtyDaysAgoStr)
      .map(r => r.date)
  )

  // 캘린더 날짜 배열 생성 (오래된 것 → 최신 순)
  const calendarDays: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    calendarDays.push(d.toISOString().split('T')[0])
  }

  const targetArea = weeklyGoal ? AREAS.find(a => a.id === weeklyGoal.targetAreaId) : null

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <GoalModal onClose={() => setShowModal(false)} onSave={setWeeklyGoal} />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">목표 & 성장</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">7일 실행 루프와 30일 성장 리포트</p>
          </div>

          {/* 주간 목표 카드 */}
          <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-red-500" />
                이번 주 목표
              </h2>
              {weeklyGoal && (
                <button
                  onClick={() => setShowModal(true)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  변경
                </button>
              )}
            </div>

            {!weeklyGoal ? (
              <div className="text-center py-6">
                <Target className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">아직 이번 주 목표가 없어요</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  주간 목표 설정
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{weeklyGoal.title}</h3>
                    {targetArea && (
                      <span
                        className="inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: AREA_COLORS[weeklyGoal.targetAreaId] + '20', color: AREA_COLORS[weeklyGoal.targetAreaId] }}
                      >
                        {targetArea.icon} {targetArea.label}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{daysLeft}</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">일 남음</p>
                  </div>
                </div>

                <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>진척률</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{progressPct}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="h-full rounded-full bg-red-500"
                  />
                </div>
                <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                  {weeklyGoal.startDate} ~ {weeklyGoal.endDate}
                </div>
              </div>
            )}
          </div>

          {/* 30일 성장 리포트 */}
          <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              30일 성장 리포트
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalCompleted}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">완료 액션</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">+{totalScoreGain}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">점수 상승</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{activeDates.size}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">실행 일수</div>
              </div>
            </div>

            {topArea && topAreaGain > 0 ? (
              <div
                className="p-3 rounded-xl flex items-center gap-3"
                style={{ backgroundColor: AREA_COLORS[topArea.id] + '15' }}
              >
                <span className="text-2xl">{topArea.icon}</span>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">가장 많이 성장한 영역</p>
                  <p className="font-semibold text-sm" style={{ color: AREA_COLORS[topArea.id] }}>
                    {topArea.label} <span className="font-bold">+{topAreaGain}점</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
                실행을 쌓아가면 성장 분석이 표시됩니다
              </div>
            )}
          </div>

          {/* 실행 캘린더 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                실행 캘린더 (최근 30일)
              </h2>
              <Link
                href="/action"
                className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                실행하기 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-10 gap-1.5">
              {calendarDays.map(dateStr => {
                const isActive = activeDates.has(dateStr)
                const isToday = dateStr === today.toISOString().split('T')[0]
                const dayNum = new Date(dateStr).getDate()
                return (
                  <div
                    key={dateStr}
                    title={dateStr}
                    className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium transition-colors ${
                      isActive
                        ? 'bg-red-500 text-white'
                        : isToday
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 ring-2 ring-red-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {dayNum}
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>실행 완료</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800" />
                <span>미실행</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>{activeDates.size}일 실행</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
