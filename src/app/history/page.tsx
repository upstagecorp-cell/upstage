'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, CheckCircle2, AlertCircle, Clock, ArrowRight, Link2, Hash, Type, ImageIcon, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AREAS } from '@/data/constants'
import { getActionById } from '@/data/actions'
import { AreaId } from '@/data/types'

const STATUS_CONFIG = {
  completed: {
    label: '완료',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  partial: {
    label: '일부 완료',
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  skipped: {
    label: '미완료',
    icon: Clock,
    color: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
}

// Sample history for demo
const SAMPLE_HISTORY = [
  {
    date: '05-01',
    customer: 35, validation: 20, product: 50, acquisition: 15, revenue: 40, operation: 60, growth: 30,
    totalScore: 36,
  },
  {
    date: '05-02',
    customer: 40, validation: 25, product: 55, acquisition: 20, revenue: 45, operation: 63, growth: 35,
    totalScore: 40,
  },
  {
    date: '05-03',
    customer: 42, validation: 28, product: 58, acquisition: 23, revenue: 48, operation: 67, growth: 38,
    totalScore: 43,
  },
  {
    date: '05-04',
    customer: 45, validation: 30, product: 60, acquisition: 25, revenue: 50, operation: 70, growth: 40,
    totalScore: 46,
  },
]

const AREA_COLORS: Record<AreaId, string> = {
  customer: '#6366f1',
  validation: '#8b5cf6',
  product: '#ec4899',
  acquisition: '#f59e0b',
  revenue: '#10b981',
  operation: '#3b82f6',
  growth: '#14b8a6',
}

const SELECTED_LINES: AreaId[] = ['customer', 'validation', 'product', 'acquisition']

export default function HistoryPage() {
  const { scoreHistory, actionRecords, diagnosisCompleted } = useStore()
  const [visibleAreas, setVisibleAreas] = useState<Set<AreaId>>(new Set(SELECTED_LINES))
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart')
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const isSample = !diagnosisCompleted || scoreHistory.length < 2

  const chartData = isSample
    ? SAMPLE_HISTORY
    : scoreHistory.map(snapshot => ({
        date: snapshot.date.slice(5).replace('-', '/'),
        ...snapshot.scores,
        totalScore: snapshot.totalScore,
      }))

  const toggleArea = (areaId: AreaId) => {
    setVisibleAreas(prev => {
      const next = new Set(prev)
      if (next.has(areaId)) {
        if (next.size > 1) next.delete(areaId)
      } else {
        next.add(areaId)
      }
      return next
    })
  }

  // Stats
  const completedCount = actionRecords.filter(r => r.status === 'completed').length
  const partialCount = actionRecords.filter(r => r.status === 'partial').length
  const totalGain = actionRecords.reduce((sum, r) => sum + r.scoreGain, 0)

  // Group records by date
  const recordsByDate: Record<string, typeof actionRecords> = {}
  for (const record of actionRecords) {
    if (!recordsByDate[record.date]) recordsByDate[record.date] = []
    recordsByDate[record.date].push(record)
  }
  const sortedDates = Object.keys(recordsByDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 이미지 라이트박스 */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setLightboxSrc(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxSrc}
            alt="증거 이미지"
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">성장 히스토리</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">점수 변화와 실행 기록을 확인합니다</p>
        </div>

        {isSample && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
            <div className="text-amber-600 dark:text-amber-400 text-sm flex-1">
              <strong>샘플 데이터입니다.</strong> 진단과 실행을 반복하면 실제 성장 그래프가 채워집니다.
            </div>
            <Link href="/onboarding" className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors">
              진단하기
            </Link>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: '총 진단 횟수', value: isSample ? '4' : String(scoreHistory.length), unit: '회', color: 'text-red-600' },
            { label: '완료한 액션', value: String(completedCount), unit: '개', color: 'text-emerald-600' },
            { label: '부분 완료', value: String(partialCount), unit: '개', color: 'text-amber-600' },
            { label: '누적 점수 상승', value: String(totalGain), unit: '점', color: 'text-blue-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
              <div className={`text-2xl font-black ${stat.color}`}>
                {stat.value}<span className="text-base font-bold">{stat.unit}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">점수 변화 추이</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">영역 버튼을 클릭해 라인을 켜고 끄세요</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'chart' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                차트
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                목록
              </button>
            </div>
          </div>

          {/* Area toggles */}
          <div className="flex flex-wrap gap-2 mb-6">
            {AREAS.map(area => (
              <button
                key={area.id}
                onClick={() => toggleArea(area.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  visibleAreas.has(area.id)
                    ? 'text-white border-transparent'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                }`}
                style={visibleAreas.has(area.id) ? { backgroundColor: AREA_COLORS[area.id], borderColor: AREA_COLORS[area.id] } : {}}
              >
                {area.icon} {area.label}
              </button>
            ))}
          </div>

          {viewMode === 'chart' && (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const area = AREAS.find(a => a.id === name)
                      return [`${value}점`, area?.label || String(name)]
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(15,23,42,0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                    }}
                  />
                  {AREAS.filter(a => visibleAreas.has(a.id)).map(area => (
                    <Line
                      key={area.id}
                      type="monotone"
                      dataKey={area.id}
                      stroke={AREA_COLORS[area.id]}
                      strokeWidth={2}
                      dot={{ fill: AREA_COLORS[area.id], r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left py-2 px-2 text-xs font-medium text-slate-500 dark:text-slate-400">날짜</th>
                    {AREAS.map(area => (
                      <th key={area.id} className="text-center py-2 px-1 text-xs font-medium" style={{ color: AREA_COLORS[area.id] }}>
                        {area.icon}
                      </th>
                    ))}
                    <th className="text-center py-2 px-2 text-xs font-medium text-slate-500 dark:text-slate-400">종합</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row, i) => (
                    <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-2 text-xs text-slate-600 dark:text-slate-400">{row.date}</td>
                      {AREAS.map(area => (
                        <td key={area.id} className="py-2 px-1 text-center text-xs font-bold" style={{ color: AREA_COLORS[area.id] }}>
                          {(row as unknown as Record<string, number>)[area.id]}
                        </td>
                      ))}
                      <td className="py-2 px-2 text-center text-xs font-bold text-red-600 dark:text-red-400">
                        {row.totalScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Timeline */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">실행 기록 타임라인</h2>
            <Link
              href="/action"
              className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 font-medium hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              실행하기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {sortedDates.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">아직 실행 기록이 없어요</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">오늘의 액션을 완료하면 여기에 기록됩니다</p>
              <Link
                href="/action"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                첫 번째 액션 시작하기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map(date => {
                const records = recordsByDate[date]
                const dayGain = records.reduce((sum, r) => sum + r.scoreGain, 0)

                return (
                  <div key={date}>
                    {/* Date Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                          {date}
                        </span>
                        {dayGain > 0 && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-full">
                            +{dayGain}점
                          </span>
                        )}
                      </div>
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>

                    {/* Records */}
                    <div className="space-y-3">
                      {records.map(record => {
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
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${config.dot}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-medium text-slate-900 dark:text-white text-sm">
                                    {action?.title || '알 수 없는 액션'}
                                  </span>
                                  <span className={`flex items-center gap-1 text-xs font-medium ${config.color}`}>
                                    <Icon className="w-3 h-3" />
                                    {config.label}
                                  </span>
                                  {record.scoreGain > 0 && (
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                      +{record.scoreGain}점
                                    </span>
                                  )}
                                </div>
                                {area && (
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{ backgroundColor: area.color + '20', color: area.color }}
                                  >
                                    {area.icon} {area.label}
                                  </span>
                                )}
                                {record.memo && (
                                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 italic">
                                    &ldquo;{record.memo}&rdquo;
                                  </p>
                                )}
                                {record.evidence && record.evidence.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {record.evidence.map((ev, idx) => {
                                      if (ev.type === 'image') {
                                        return (
                                          <button
                                            key={idx}
                                            onClick={() => setLightboxSrc(ev.value)}
                                            className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity flex-shrink-0"
                                            title="클릭해서 확대"
                                          >
                                            {ev.value ? (
                                              <img
                                                src={ev.value}
                                                alt="증거 이미지"
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <ImageIcon className="w-4 h-4 text-slate-400" />
                                              </div>
                                            )}
                                          </button>
                                        )
                                      }
                                      if (ev.type === 'link') {
                                        return (
                                          <a
                                            key={idx}
                                            href={ev.value}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                                          >
                                            <Link2 className="w-3 h-3" />
                                            링크
                                          </a>
                                        )
                                      }
                                      if (ev.type === 'number') {
                                        return (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold"
                                          >
                                            <Hash className="w-3 h-3" />
                                            {ev.value}
                                          </span>
                                        )
                                      }
                                      return (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs"
                                        >
                                          <Type className="w-3 h-3" />
                                          {ev.value}
                                        </span>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
