'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, ArrowRight, BookOpen, Wrench, FileText, Video, ExternalLink } from 'lucide-react'
import { useStore } from '@/lib/store'
import { STRATEGIES, RESOURCES } from '@/data/strategies'
import { getSortedAreasByScore, getStatusLevel } from '@/lib/scoring'
import { AreaId } from '@/data/types'

const SAMPLE_SCORES: Record<AreaId, number> = {
  customer: 45,
  validation: 30,
  product: 60,
  acquisition: 25,
  revenue: 50,
  operation: 70,
  growth: 40,
}

function resourceIcon(type: string) {
  switch (type) {
    case 'article': return <BookOpen className="w-4 h-4" />
    case 'video': return <Video className="w-4 h-4" />
    case 'tool': return <Wrench className="w-4 h-4" />
    case 'template': return <FileText className="w-4 h-4" />
    default: return <BookOpen className="w-4 h-4" />
  }
}

function resourceLabel(type: string) {
  const map: Record<string, string> = {
    article: '아티클',
    video: '영상',
    tool: '도구',
    template: '템플릿',
  }
  return map[type] || type
}

function resourceColor(type: string) {
  const map: Record<string, string> = {
    article: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
    video: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
    tool: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
    template: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
  }
  return map[type] || 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
}

export default function ExplorePage() {
  const { scores, diagnosisCompleted } = useStore()
  const displayScores = diagnosisCompleted ? scores : SAMPLE_SCORES
  const [expandedArea, setExpandedArea] = useState<AreaId | null>(null)
  const [tab, setTab] = useState<Record<AreaId, 'strategy' | 'resources'>>({} as Record<AreaId, 'strategy' | 'resources'>)

  const sortedAreas = getSortedAreasByScore(displayScores)

  function getTab(areaId: AreaId): 'strategy' | 'resources' {
    return tab[areaId] || 'strategy'
  }

  function setAreaTab(areaId: AreaId, t: 'strategy' | 'resources') {
    setTab(prev => ({ ...prev, [areaId]: t }))
  }

  function toggleArea(areaId: AreaId) {
    setExpandedArea(prev => prev === areaId ? null : areaId)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">전략 탐색</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            점수 낮은 영역부터 우선 표시됩니다. 클릭해 전략과 학습 자료를 확인하세요.
          </p>
        </div>

        {!diagnosisCompleted && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
            <div className="text-amber-600 dark:text-amber-400 text-sm flex-1">
              <strong>샘플 데이터입니다.</strong> 진단을 완료하면 내 업종에 맞는 실제 점수를 기반으로 탐색할 수 있습니다.
            </div>
            <Link href="/onboarding" className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors">
              진단하기
            </Link>
          </div>
        )}

        {/* Area List */}
        <div className="space-y-4">
          {sortedAreas.map((area, rank) => {
            const isExpanded = expandedArea === area.id
            const status = getStatusLevel(area.score)
            const strategies = STRATEGIES.filter(s => s.areaId === area.id)
            const resources = RESOURCES.filter(r => r.areaId === area.id)
            const currentTab = getTab(area.id)

            return (
              <div
                key={area.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
              >
                {/* Area Header (clickable) */}
                <button
                  onClick={() => toggleArea(area.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* Rank badge */}
                  <div className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0 ${
                    rank === 0 ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400' :
                    rank === 1 ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' :
                    rank === 2 ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {rank + 1}
                  </div>

                  <span className="text-2xl">{area.icon}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white">{area.label}</span>
                      {rank === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-medium">
                          최우선
                        </span>
                      )}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-32">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${area.score}%`, backgroundColor: area.color }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{area.score}점</span>
                    </div>
                  </div>

                  <div className="text-slate-400 flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    {/* Tab Switcher */}
                    <div className="flex border-b border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setAreaTab(area.id, 'strategy')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                          currentTab === 'strategy'
                            ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        전략 ({strategies.length})
                      </button>
                      <button
                        onClick={() => setAreaTab(area.id, 'resources')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                          currentTab === 'resources'
                            ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        학습 자료 ({resources.length})
                      </button>
                    </div>

                    <div className="p-5">
                      {/* Strategy Tab */}
                      {currentTab === 'strategy' && (
                        <div className="space-y-4">
                          {strategies.map(strategy => (
                            <div key={strategy.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">{strategy.title}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{strategy.description}</p>
                              <ol className="space-y-2">
                                {strategy.steps.map((step, i) => (
                                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                                    <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                      {i + 1}
                                    </span>
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          ))}
                          {strategies.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-6">이 영역에 대한 전략을 준비 중입니다.</p>
                          )}
                        </div>
                      )}

                      {/* Resources Tab */}
                      {currentTab === 'resources' && (
                        <div className="space-y-3">
                          {resources.map(resource => (
                            <div key={resource.id} className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${resourceColor(resource.type)}`}>
                                {resourceIcon(resource.type)}
                                {resourceLabel(resource.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h5 className="font-medium text-slate-900 dark:text-white text-sm">{resource.title}</h5>
                                  {resource.url && (
                                    <a href={resource.url} target="_blank" rel="noopener noreferrer"
                                      className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{resource.description}</p>
                              </div>
                            </div>
                          ))}
                          {resources.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-6">이 영역에 대한 자료를 준비 중입니다.</p>
                          )}
                        </div>
                      )}

                      {/* Go to Action */}
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          href="/action"
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
                        >
                          이 영역 실행하기
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
