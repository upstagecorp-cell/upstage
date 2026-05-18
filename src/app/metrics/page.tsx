'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  BarChart2,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import type { BusinessMetricEntry } from '@/data/types'

const METRIC_FIELDS: {
  key: keyof BusinessMetricEntry
  label: string
  prefix?: string
  suffix?: string
  color: string
}[] = [
  { key: 'revenue', label: '매출액', prefix: '₩', color: '#6366f1' },
  { key: 'customers', label: '고객 수', suffix: '명', color: '#ec4899' },
  { key: 'visitors', label: '방문자 수', suffix: '명', color: '#f59e0b' },
  { key: 'reservations', label: '예약 건수', suffix: '건', color: '#10b981' },
  { key: 'conversionRate', label: '전환율', suffix: '%', color: '#3b82f6' },
  { key: 'reviews', label: '신규 리뷰', suffix: '개', color: '#eab308' },
  { key: 'returnVisitors', label: '재방문 고객', suffix: '명', color: '#a855f7' },
]

export default function MetricsPage() {
  const router = useRouter()
  const { businessMetrics, addBusinessMetric, diagnosisCompleted } = useStore()

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Partial<BusinessMetricEntry>>({
    date: new Date().toISOString().split('T')[0],
  })
  const [activeFields, setActiveFields] = useState<Set<string>>(new Set(['revenue', 'customers']))
  const [expandedChart, setExpandedChart] = useState(true)

  function toggleField(key: string) {
    setActiveFields((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.date) return
    const entry: BusinessMetricEntry = {
      date: formData.date,
      revenue: formData.revenue ? Number(formData.revenue) : undefined,
      customers: formData.customers ? Number(formData.customers) : undefined,
      visitors: formData.visitors ? Number(formData.visitors) : undefined,
      reservations: formData.reservations ? Number(formData.reservations) : undefined,
      conversionRate: formData.conversionRate ? Number(formData.conversionRate) : undefined,
      reviews: formData.reviews ? Number(formData.reviews) : undefined,
      returnVisitors: formData.returnVisitors ? Number(formData.returnVisitors) : undefined,
    }
    addBusinessMetric(entry)
    setFormData({ date: new Date().toISOString().split('T')[0] })
    setShowForm(false)
  }

  // Sorted metrics for chart
  const sortedMetrics = [...businessMetrics].sort((a, b) => a.date.localeCompare(b.date))
  const chartData = sortedMetrics.map((m) => ({
    ...m,
    date: m.date.slice(5),
  }))

  // Compute latest vs prev for trend display
  function getTrend(key: keyof BusinessMetricEntry): { diff: number; pct: number } | null {
    if (sortedMetrics.length < 2) return null
    const latest = sortedMetrics[sortedMetrics.length - 1][key] as number | undefined
    const prev = sortedMetrics[sortedMetrics.length - 2][key] as number | undefined
    if (latest === undefined || prev === undefined || prev === 0) return null
    const diff = latest - prev
    const pct = Math.round((diff / prev) * 100)
    return { diff, pct }
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-6 h-6 text-indigo-500" />
                비즈니스 지표
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                실제 운영 데이터를 기록하고 추이를 파악하세요
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              입력
            </button>
          </div>
        </motion.div>

        {/* Input Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#202020] rounded-2xl border border-[#e9e9e7] dark:border-[#313131] p-6"
          >
            <h2 className="font-bold text-slate-900 dark:text-white mb-4">데이터 입력</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">날짜</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {METRIC_FIELDS.map((field) => (
                  <div key={String(field.key)}>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      {field.label} {field.prefix ?? field.suffix ?? ''}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="입력..."
                      value={(formData[field.key] as number | undefined) ?? ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.key]: e.target.value ? Number(e.target.value) : undefined })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
                >
                  저장
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* KPI Summary Cards */}
        {sortedMetrics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {METRIC_FIELDS.map((field) => {
                const latest = sortedMetrics[sortedMetrics.length - 1]
                const val = latest[field.key] as number | undefined
                if (val === undefined) return null
                const trend = getTrend(field.key)
                return (
                  <div key={String(field.key)} className="bg-white dark:bg-[#202020] rounded-xl border border-[#e9e9e7] dark:border-[#313131] p-4">
                    <p className="text-xs text-slate-400 mb-1">{field.label}</p>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {field.prefix ?? ''}
                      {typeof val === 'number' ? val.toLocaleString() : val}
                      {field.suffix ?? ''}
                    </p>
                    {trend && (
                      <div
                        className={`flex items-center gap-1 text-xs mt-1 font-semibold ${
                          trend.pct > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : trend.pct < 0
                            ? 'text-red-500 dark:text-red-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {trend.pct > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : trend.pct < 0 ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        {trend.pct > 0 ? '+' : ''}{trend.pct}%
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#202020] rounded-2xl border border-[#e9e9e7] dark:border-[#313131] p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white">추이 차트</h2>
            <button
              onClick={() => setExpandedChart(!expandedChart)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {expandedChart ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {/* Field toggles */}
          <div className="flex flex-wrap gap-2 mb-4">
            {METRIC_FIELDS.map((field) => (
              <button
                key={String(field.key)}
                onClick={() => toggleField(String(field.key))}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  activeFields.has(String(field.key))
                    ? 'text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }`}
                style={
                  activeFields.has(String(field.key))
                    ? { backgroundColor: field.color }
                    : {}
                }
              >
                {field.label}
              </button>
            ))}
          </div>

          {chartData.length < 2 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              2개 이상 데이터를 입력하면 추이가 표시됩니다.
            </p>
          ) : expandedChart ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} iconSize={8} />
                {METRIC_FIELDS.filter((f) => activeFields.has(String(f.key))).map((field) => (
                  <Line
                    key={String(field.key)}
                    type="monotone"
                    dataKey={String(field.key)}
                    name={field.label}
                    stroke={field.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </motion.div>

        {/* Data table */}
        {businessMetrics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-[#202020] rounded-2xl border border-[#e9e9e7] dark:border-[#313131] p-6 overflow-x-auto"
          >
            <h2 className="font-bold text-slate-900 dark:text-white mb-4">입력된 데이터</h2>
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left py-2 pr-3 text-slate-500 dark:text-slate-400 font-semibold text-xs">날짜</th>
                  {METRIC_FIELDS.map((f) => (
                    <th key={String(f.key)} className="text-right py-2 px-2 text-slate-500 dark:text-slate-400 font-semibold text-xs whitespace-nowrap">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...businessMetrics]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 10)
                  .map((m, i) => (
                    <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50">
                      <td className="py-2 pr-3 text-slate-600 dark:text-slate-400 font-medium text-xs whitespace-nowrap">{m.date}</td>
                      {METRIC_FIELDS.map((f) => {
                        const val = m[f.key] as number | undefined
                        return (
                          <td key={String(f.key)} className="py-2 px-2 text-right text-slate-700 dark:text-slate-300 text-xs">
                            {val !== undefined
                              ? `${f.prefix ?? ''}${val.toLocaleString()}${f.suffix ?? ''}`
                              : '-'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </div>
  )
}
