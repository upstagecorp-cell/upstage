'use client'

import { useState, useEffect } from 'react'
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
  Play,
  ClipboardCheck,
  FileBarChart,
  Trophy,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { useMounted } from '@/lib/use-mounted'
import { AREAS } from '@/data/constants'
import { AreaId, WeeklyGoal } from '@/data/types'
import { generateWeeklyInsight } from '@/lib/ai-feedback'

const AREA_COLORS: Record<AreaId, string> = {
  customer: '#6366f1',
  validation: '#8b5cf6',
  product: '#ec4899',
  acquisition: '#f59e0b',
  revenue: '#10b981',
  operation: '#3b82f6',
  growth: '#14b8a6',
}

const STAGE_LABEL: Record<string, string> = {
  idea: '아이디어', preparing: '준비', 'pre-open': '오픈 준비',
  operating: '운영', plateau: '정체', expansion: '확장',
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
  const {
    weeklyGoal,
    setWeeklyGoal,
    actionRecords,
    scoreHistory,
    loopPhase,
    loopStartDate,
    monthlyReports,
    stage,
    startNewLoop,
    setLoopPhase,
    generateMonthlyReport,
    checkStageUnlock,
    diagnosisCompleted,
  } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [showMonthlyReport, setShowMonthlyReport] = useState(false)
  const mounted = useMounted()

  useEffect(() => {
    if (mounted && diagnosisCompleted) {
      generateMonthlyReport()
    }
  }, [mounted, diagnosisCompleted, generateMonthlyReport])

  if (!mounted) return null

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // ── 14일 루프 계산 ──────────────────────────────────────────────────────────
  const loopStart = loopStartDate ?? todayStr
  const loopDayNum = Math.max(1, Math.ceil((today.getTime() - new Date(loopStart).getTime()) / 86400000) + 1)
  const loopDayClamped = Math.min(loopDayNum, 14)
  const phaseLabel = loopPhase === 'execute' ? '실행 기간' : '검증 기간'
  const phaseIcon = loopPhase === 'execute' ? Play : ClipboardCheck
  const PhaseIcon = phaseIcon

  const shouldSwitchToVerify = loopPhase === 'execute' && loopDayClamped > 7
  const loopComplete = loopDayClamped >= 14

  // ── 주간 목표 ───────────────────────────────────────────────────────────────
  const progressPct = weeklyGoal && weeklyGoal.targetActions.length > 0
    ? Math.round((weeklyGoal.completedActions.length / weeklyGoal.targetActions.length) * 100)
    : 0

  const daysLeft = weeklyGoal
    ? Math.max(0, Math.ceil((new Date(weeklyGoal.endDate).getTime() - today.getTime()) / 86400000))
    : 0

  // ── 30일 성장 리포트 ────────────────────────────────────────────────────────
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 29)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  const recent30Records = actionRecords.filter(r => r.date >= thirtyDaysAgoStr)
  const totalCompleted = recent30Records.filter(r => r.status === 'completed').length
  const totalScoreGain = recent30Records.reduce((sum, r) => sum + r.scoreGain, 0)

  const areaGainMap: Record<string, number> = {}
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

  // ── 실행 캘린더 ─────────────────────────────────────────────────────────────
  const activeDates = new Set(
    actionRecords
      .filter(r => r.status === 'completed' && r.date >= thirtyDaysAgoStr)
      .map(r => r.date)
  )
  const calendarDays: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    calendarDays.push(d.toISOString().split('T')[0])
  }

  // ── AI 주간 인사이트 ─────────────────────────────────────────────────────────
  const weeklyInsight = generateWeeklyInsight(actionRecords, scoreHistory)

  // ── 단계 해금 ──────────────────────────────────────────────────────────────
  const stageUnlock = diagnosisCompleted ? checkStageUnlock() : null

  const targetArea = weeklyGoal ? AREAS.find(a => a.id === weeklyGoal.targetAreaId) : null
  const latestMonthlyReport = monthlyReports.length > 0 ? monthlyReports[monthlyReports.length - 1] : null

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <GoalModal onClose={() => setShowModal(false)} onSave={setWeeklyGoal} />
        )}
        {showMonthlyReport && latestMonthlyReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMonthlyReport(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {latestMonthlyReport.month} 월간 리포트
                </h3>
                <button
                  onClick={() => setShowMonthlyReport(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{latestMonthlyReport.totalActions}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">완료 액션</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  {(() => {
                    const topMonthArea = AREAS.find(a => a.id === latestMonthlyReport.topArea)
                    return (
                      <>
                        <div className="text-2xl">{topMonthArea?.icon ?? '🏆'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">최고 성장</div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{topMonthArea?.label}</div>
                      </>
                    )
                  })()}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {AREAS.map(area => {
                  const change = latestMonthlyReport.scoreChange[area.id] ?? 0
                  if (change === 0) return null
                  return (
                    <div key={area.id} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{area.icon} {area.label}</span>
                      <span className={`text-sm font-bold ${change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                        {change > 0 ? '+' : ''}{change}점
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900">
                <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">{latestMonthlyReport.insight}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">목표 & 성장</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">14일 실행 루프와 월간 성장 리포트</p>
          </div>

          {/* 단계 해금 배너 */}
          {stageUnlock?.canUnlock && stageUnlock.targetStage && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
              <div className="flex items-start gap-3">
                <Trophy className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">다음 단계로 성장할 준비가 되었습니다!</p>
                  <p className="text-emerald-50 text-sm mt-0.5">
                    현재 {stage ? (STAGE_LABEL[stage] ?? stage) : '?'} 단계 →{' '}
                    <strong>{STAGE_LABEL[stageUnlock.targetStage] ?? stageUnlock.targetStage}</strong> 단계 전환을 고려해보세요
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {stageUnlock.conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${c.met ? 'text-white' : 'text-emerald-200/50'}`} />
                    <span className={c.met ? 'text-white' : 'text-emerald-100/70'}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 단계 해금 미달 (일부 충족) */}
          {stageUnlock && !stageUnlock.canUnlock && stageUnlock.targetStage && stageUnlock.conditions.some(c => c.met) && (
            <div className="mb-6 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {STAGE_LABEL[stageUnlock.targetStage] ?? stageUnlock.targetStage} 단계 전환 조건
                </p>
              </div>
              <div className="space-y-1.5">
                {stageUnlock.conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 border-2 flex items-center justify-center ${c.met ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {c.met && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={c.met ? 'text-emerald-700 dark:text-emerald-400 line-through' : 'text-slate-600 dark:text-slate-400'}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 14일 루프 카드 */}
          <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PhaseIcon className="w-5 h-5 text-indigo-500" />
                14일 검증 루프
              </h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                loopPhase === 'execute'
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
              }`}>
                {phaseLabel}
              </span>
            </div>

            {/* 루프 진행 바 */}
            {loopStartDate ? (
              <>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span>Day {loopDayClamped} / 14</span>
                  <span>{loopPhase === 'execute' ? '1~7일: 실행' : '8~14일: 검증'}</span>
                </div>
                <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(loopDayClamped / 14) * 100}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className={`h-full rounded-full ${loopPhase === 'execute' ? 'bg-blue-500' : 'bg-purple-500'}`}
                  />
                  {/* 7일 마커 */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-white/70 dark:bg-slate-700" style={{ left: '50%' }} />
                </div>

                {/* 단계 설명 */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className={`p-2.5 rounded-lg text-center text-xs ${loopPhase === 'execute' ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800'}`}>
                    <Play className="w-3.5 h-3.5 mx-auto mb-0.5 text-blue-500" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">1~7일: 실행</p>
                    <p className="text-slate-500 dark:text-slate-400">매일 액션 실행</p>
                  </div>
                  <div className={`p-2.5 rounded-lg text-center text-xs ${loopPhase === 'verify' ? 'bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800' : 'bg-slate-50 dark:bg-slate-800'}`}>
                    <ClipboardCheck className="w-3.5 h-3.5 mx-auto mb-0.5 text-purple-500" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">8~14일: 검증</p>
                    <p className="text-slate-500 dark:text-slate-400">지표 측정 & 재진단</p>
                  </div>
                </div>

                {/* 검증 기간 안내 */}
                {loopPhase === 'verify' && (
                  <div className="mb-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950 border border-purple-100 dark:border-purple-900">
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-purple-500" />
                      <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">검증 기간 안내</p>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      7일 실행 결과를 측정하세요. 매출, 방문자, 고객 반응 등 구체적인 지표를 기록하고 필요하면 재진단을 받으세요.
                    </p>
                    <Link href="/onboarding" className="inline-flex items-center gap-1 mt-2 text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                      재진단 받기 <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {/* 알림: 실행→검증 전환 권고 */}
                {shouldSwitchToVerify && (
                  <div className="mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900">
                    <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">7일이 지났습니다. 검증 기간으로 전환하세요.</p>
                    <button
                      onClick={() => setLoopPhase('verify')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
                    >
                      검증 기간으로 전환
                    </button>
                  </div>
                )}

                {/* 루프 완료 → 새 루프 시작 */}
                {loopComplete && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 mb-2">14일 루프 완료!</p>
                    <button
                      onClick={startNewLoop}
                      className="text-xs px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      새 루프 시작
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">14일 실행-검증 루프를 시작하세요</p>
                <button
                  onClick={startNewLoop}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
                >
                  <Play className="w-4 h-4" />
                  루프 시작
                </button>
              </div>
            )}
          </div>

          {/* 주간 AI 인사이트 카드 */}
          <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              주간 AI 인사이트
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{weeklyInsight.summary}</p>
            {weeklyInsight.risk && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-300">{weeklyInsight.risk}</p>
              </div>
            )}
            {weeklyInsight.suggestions.length > 0 && (
              <div className="space-y-2">
                {weeklyInsight.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {s}
                  </div>
                ))}
              </div>
            )}
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

          {/* 월간 리포트 카드 */}
          <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileBarChart className="w-5 h-5 text-emerald-500" />
                월간 리포트
              </h2>
              {latestMonthlyReport && (
                <button
                  onClick={() => setShowMonthlyReport(true)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  상세 보기
                </button>
              )}
            </div>

            {latestMonthlyReport ? (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{latestMonthlyReport.totalActions}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">이번 달 완료</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                    {(() => {
                      const topMonthArea = AREAS.find(a => a.id === latestMonthlyReport.topArea)
                      return (
                        <>
                          <div className="text-2xl">{topMonthArea?.icon ?? '🏆'}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{topMonthArea?.label ?? '—'}</div>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{latestMonthlyReport.insight}</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">이번 달 리포트가 아직 생성되지 않았습니다</p>
                <button
                  onClick={() => generateMonthlyReport()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <FileBarChart className="w-4 h-4" />
                  리포트 생성
                </button>
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
                const isToday = dateStr === todayStr
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
