'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Lightbulb, CheckCircle, Star } from 'lucide-react'
import { useStore } from '@/lib/store'
import { INDICATORS } from '@/data/constants'
import { getActionsByIndicator } from '@/data/actions'
import { BENCHMARKS } from '@/data/benchmarks'
import { SCORE_MESSAGES } from '@/data/score-messages'
import { getStatusLevel } from '@/lib/scoring'
import type { RestaurantIndicatorId } from '@/data/types'

const LEARNING_RESOURCES: {
  category: string
  icon: string
  items: { title: string; desc: string; url: string; tag: string }[]
}[] = [
  {
    category: '상권 분석',
    icon: '🏙️',
    items: [
      {
        title: '소상공인 상권 정보 시스템',
        desc: '우리 매장 주변 상권 데이터를 무료로 조회할 수 있습니다.',
        url: 'https://sg.sbiz.or.kr',
        tag: '무료',
      },
      {
        title: '행정안전부 지역통계 활용법',
        desc: '유동 인구·연령대·업종별 분포를 파악하는 방법을 소개합니다.',
        url: 'https://kosis.kr',
        tag: '공공데이터',
      },
    ],
  },
  {
    category: '배달앱 최적화',
    icon: '📱',
    items: [
      {
        title: '배달의민족 파트너센터',
        desc: '노출 순위 올리기, 광고 설정, 메뉴 관리 공식 가이드',
        url: 'https://partner.baemin.com',
        tag: '공식',
      },
      {
        title: '쿠팡이츠 셀프서비스',
        desc: '쿠팡이츠 메뉴 사진·설명 업데이트 방법 안내',
        url: 'https://seller.coupangeats.com',
        tag: '공식',
      },
    ],
  },
  {
    category: '네이버 플레이스',
    icon: '📍',
    items: [
      {
        title: '네이버 스마트플레이스 관리',
        desc: '영업시간·메뉴·사진 업데이트로 검색 노출을 높이는 방법',
        url: 'https://smartplace.naver.com',
        tag: '무료',
      },
    ],
  },
  {
    category: '고객 관리',
    icon: '👥',
    items: [
      {
        title: '카카오 채널 개설 가이드',
        desc: '단골 고객에게 소식을 전하는 무료 채널 활용법',
        url: 'https://business.kakao.com',
        tag: '무료',
      },
      {
        title: '리뷰 관리 노하우',
        desc: '부정 리뷰 대응과 긍정 리뷰를 늘리는 실전 방법',
        url: 'https://biz.naver.com',
        tag: '가이드',
      },
    ],
  },
  {
    category: '원가 관리',
    icon: '💰',
    items: [
      {
        title: '음식점 원가율 계산기 (구글 스프레드시트)',
        desc: '재료비·인건비·운영비를 입력하면 원가율을 자동 계산',
        url: 'https://sheets.google.com',
        tag: '무료',
      },
    ],
  },
]

export default function ExplorePage() {
  const { scores, executionRecords } = useStore()

  const completedIds = new Set(executionRecords.map((r) => r.action_id))

  const [activeTab, setActiveTab] = useState<'strategies' | 'resources' | 'benchmarks'>('strategies')
  const [expandedIndicator, setExpandedIndicator] = useState<RestaurantIndicatorId | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const tabs = [
    { id: 'strategies' as const, label: '액션 전략' },
    { id: 'resources' as const, label: '학습 자료' },
    { id: 'benchmarks' as const, label: '벤치마크' },
  ]

  const diffLabels: Record<string, string> = { easy: '쉬움', normal: '보통', hard: '어려움' }
  const impactLabels: Record<string, string> = { low: '낮음', medium: '중간', high: '높음' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 px-4 py-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-500" />
            탐색 & 학습
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            지표별 액션 전략, 학습 자료, 벤치마크를 탐색하세요
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="flex bg-white dark:bg-slate-800 rounded-2xl p-1 shadow"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">

          {/* Strategies Tab */}
          {activeTab === 'strategies' && (
            <motion.div
              key="strategies"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              <p className="text-xs text-slate-400 text-center">
                지표를 탭하면 관련 액션 카드를 볼 수 있습니다
              </p>
              {INDICATORS.map((ind) => {
                const score = scores[ind.id as RestaurantIndicatorId] ?? 0
                const sl = getStatusLevel(score)
                const actions = getActionsByIndicator(ind.id)
                const isExpanded = expandedIndicator === ind.id

                return (
                  <motion.div
                    key={ind.id}
                    layout
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedIndicator(isExpanded ? null : ind.id as RestaurantIndicatorId)}
                      className="w-full flex items-center gap-3 p-4 text-left"
                    >
                      <span className="text-xl flex-shrink-0">{ind.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">{ind.label}</span>
                          <span className={`text-sm font-bold ${sl.color}`}>{score}점</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${score}%`, backgroundColor: ind.color }}
                          />
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden border-t border-slate-100 dark:border-slate-700"
                        >
                          <div className="p-4 flex flex-col gap-3">
                            {actions.length === 0 ? (
                              <p className="text-sm text-slate-400 text-center py-2">
                                이 지표에 대한 액션이 준비 중입니다.
                              </p>
                            ) : (
                              actions.map((action) => {
                                const isDone = completedIds.has(action.action_id)
                                return (
                                  <div
                                    key={action.action_id}
                                    className={`p-4 rounded-2xl border ${
                                      isDone
                                        ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800'
                                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2 mb-2">
                                      {isDone ? (
                                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                      ) : (
                                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                      )}
                                      <p className={`font-bold text-sm ${isDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                        {action.title}
                                        {isDone && <span className="ml-1 text-xs">(완료)</span>}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      <span className="text-xs text-slate-500">⏱ {action.expected_time}</span>
                                      <span className="text-xs text-slate-500">난이도: {diffLabels[action.difficulty]}</span>
                                      <span className="text-xs text-slate-500">효과: {impactLabels[action.impact]}</span>
                                    </div>
                                    <ol className="flex flex-col gap-1.5">
                                      {action.execution_steps.map((step, si) => (
                                        <li key={si} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                          <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
                                            {si + 1}
                                          </span>
                                          {step}
                                        </li>
                                      ))}
                                    </ol>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                                      <Star className="w-3 h-3" />
                                      {action.success_condition}
                                    </p>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              {LEARNING_RESOURCES.map((cat) => {
                const isExp = expandedCategory === cat.category
                return (
                  <div key={cat.category} className="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(isExp ? null : cat.category)}
                      className="w-full flex items-center gap-3 p-4 text-left"
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="flex-1 font-bold text-slate-900 dark:text-white">{cat.category}</span>
                      <span className="text-xs text-slate-400 mr-2">{cat.items.length}개</span>
                      {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                      {isExp && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden border-t border-slate-100 dark:border-slate-700"
                        >
                          <div className="p-4 flex flex-col gap-3">
                            {cat.items.map((item, i) => (
                              <a
                                key={i}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors group"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                      {item.title}
                                    </p>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex-shrink-0">
                                      {item.tag}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 flex-shrink-0 mt-0.5" />
                              </a>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </motion.div>
          )}

          {/* Benchmarks Tab */}
          {activeTab === 'benchmarks' && (
            <motion.div
              key="benchmarks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              {INDICATORS.map((ind) => {
                const score = scores[ind.id as RestaurantIndicatorId] ?? 0
                const sl = getStatusLevel(score)
                const benchmark = BENCHMARKS.find((b) => b.indicator === ind.id)
                const messages = SCORE_MESSAGES[ind.id as RestaurantIndicatorId]
                const message = messages?.find((m) => score >= m.threshold)?.message ?? ''

                const statusKey = score >= 80 ? 'good' : score >= 40 ? 'normal' : 'danger'

                return (
                  <div key={ind.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xl">{ind.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{ind.label}</span>
                          <span className={`text-sm font-extrabold ${sl.color}`}>{score}점</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${score}%`, backgroundColor: ind.color }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Current status message */}
                    <div className={`p-3 rounded-xl mb-3 ${sl.bg}`}>
                      <p className={`text-xs leading-relaxed ${sl.color}`}>{message}</p>
                    </div>

                    {/* Benchmark levels */}
                    {benchmark && (
                      <div className="flex flex-col gap-2">
                        {([
                          { key: 'good', label: '우수 기준', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' },
                          { key: 'normal', label: '보통 기준', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' },
                          { key: 'danger', label: '위험 기준', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' },
                        ] as const).map(({ key, label, color, bg }) => (
                          <div
                            key={key}
                            className={`p-2.5 rounded-xl border text-xs ${bg} ${
                              statusKey === key ? 'ring-2 ring-offset-1 ring-current' : ''
                            }`}
                          >
                            <span className={`font-bold ${color}`}>{label}: </span>
                            <span className={color}>{benchmark[key]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
