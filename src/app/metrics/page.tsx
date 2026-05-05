'use client'

import { useState, useEffect } from 'react'
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
import { BarChart2, Plus, Save, Check } from 'lucide-react'
import { useStore } from '@/lib/store'
import { BusinessMetricEntry } from '@/data/types'

type MetricKey = keyof Omit<BusinessMetricEntry, 'date'>

const METRIC_FIELDS: { key: MetricKey; label: string; unit?: string }[] = [
  { key: 'revenue', label: '매출', unit: '원' },
  { key: 'customers', label: '고객수', unit: '명' },
  { key: 'visitors', label: '방문자수', unit: '명' },
  { key: 'reservations', label: '예약수', unit: '건' },
  { key: 'conversionRate', label: '전환율', unit: '%' },
  { key: 'reviews', label: '리뷰수', unit: '개' },
  { key: 'returnVisitors', label: '재방문수', unit: '명' },
  { key: 'inquiries', label: '문의수', unit: '건' },
]

const METRIC_COLORS: Record<MetricKey, string> = {
  revenue: '#10b981',
  customers: '#6366f1',
  visitors: '#f59e0b',
  reservations: '#3b82f6',
  conversionRate: '#ec4899',
  reviews: '#8b5cf6',
  returnVisitors: '#14b8a6',
  inquiries: '#dc2626',
}

const PERIOD_OPTIONS = [
  { label: '7일', days: 7 },
  { label: '14일', days: 14 },
  { label: '30일', days: 30 },
]

export default function MetricsPage() {
  const { businessMetrics, addBusinessMetric } = useStore()
  const [mounted, setMounted] = useState(false)
  const [saved, setSaved] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [values, setValues] = useState<Partial<Record<MetricKey, string>>>({})
  const [selectedMetrics, setSelectedMetrics] = useState<Set<MetricKey>>(new Set(['revenue', 'customers', 'visitors']))
  const [period, setPeriod] = useState(30)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const handleSave = () => {
    const entryValues: Partial<Record<MetricKey, number>> = {}
    let hasValue = false
    for (const { key } of METRIC_FIELDS) {
      const raw = values[key]
      if (raw !== undefined && raw !== '') {
        const num = parseFloat(raw)
        if (!isNaN(num)) {
          entryValues[key] = num
          hasValue = true
        }
      }
    }
    if (!hasValue) return
    const entry: BusinessMetricEntry = { date, ...entryValues }
    addBusinessMetric(entry)
    setValues({})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // 기간 필터 + 차트 데이터 준비
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - period + 1)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const filteredMetrics = businessMetrics
    .filter(m => m.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date))

  const chartData = filteredMetrics.map(m => {
    const { date: d, ...rest } = m
    return { date: d.slice(5), ...rest }
  })

  const toggleMetric = (key: MetricKey) => {
    setSelectedMetrics(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">비즈니스 지표</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">매일 지표를 입력하고 추이를 추적하세요</p>
        </div>

        {/* 입력 폼 */}
        <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Plus className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">지표 입력</h2>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">날짜</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {METRIC_FIELDS.map(({ key, label, unit }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {label}
                  {unit && <span className="text-slate-400 ml-1">({unit})</span>}
                </label>
                <input
                  type="number"
                  min={0}
                  step={key === 'conversionRate' ? 0.01 : 1}
                  value={values[key] ?? ''}
                  onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {saved ? <><Check className="w-4 h-4" /> 저장됨</> : <><Save className="w-4 h-4" /> 저장</>}
            </button>
          </div>
        </div>

        {/* 추이 차트 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">추이 차트</h2>
            </div>
            <div className="flex gap-1">
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  onClick={() => setPeriod(opt.days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    period === opt.days
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 지표 선택 토글 */}
          <div className="flex flex-wrap gap-2 mb-5">
            {METRIC_FIELDS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleMetric(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  selectedMetrics.has(key)
                    ? 'text-white border-transparent'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                }`}
                style={selectedMetrics.has(key) ? { backgroundColor: METRIC_COLORS[key], borderColor: METRIC_COLORS[key] } : {}}
              >
                {label}
              </button>
            ))}
          </div>

          {chartData.length < 2 ? (
            <div className="h-60 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
              <BarChart2 className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">데이터가 부족합니다</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">최소 2개 이상의 날짜에 지표를 입력하면 차트가 그려집니다</p>
            </div>
          ) : (
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
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const field = METRIC_FIELDS.find(f => f.key === name)
                      return [`${value}${field?.unit ?? ''}`, field?.label ?? String(name)]
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(15,23,42,0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    formatter={value => {
                      const field = METRIC_FIELDS.find(f => f.key === value)
                      return field?.label ?? value
                    }}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  {METRIC_FIELDS.filter(f => selectedMetrics.has(f.key)).map(({ key }) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={METRIC_COLORS[key]}
                      strokeWidth={2}
                      dot={{ fill: METRIC_COLORS[key], r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
