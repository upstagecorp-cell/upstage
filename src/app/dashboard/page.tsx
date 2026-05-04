'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { ArrowRight, X, TrendingUp, AlertTriangle, CheckCircle2, Zap } from 'lucide-react'
import { useStore } from '@/lib/store'
import { AREAS } from '@/data/constants'
import { getTotalScore, getStatusLevel } from '@/lib/scoring'
import { AreaId } from '@/data/types'

function DetailModal({
  areaId,
  score,
  onClose,
}: {
  areaId: AreaId
  score: number
  onClose: () => void
}) {
  const area = AREAS.find(a => a.id === areaId)!
  const status = getStatusLevel(score)

  const tips: Record<AreaId, string[]> = {
    customer: [
      '실제 고객과 대화하는 시간을 주당 최소 1시간 확보하세요.',
      '가정을 검증하지 않으면 잘못된 방향으로 자원을 낭비할 수 있습니다.',
      '고객 페르소나를 작성하고 팀 전체가 공유하세요.',
    ],
    validation: [
      '작은 MVP로 실제 판매 테스트를 해보세요.',
      '고객이 "좋아요"라고 말해도 실제 돈을 내는지가 중요합니다.',
      '사전 예약이나 사전 판매로 수요를 검증하세요.',
    ],
    product: [
      '경쟁사와 비교해 1가지 분야에서만 압도적으로 잘하세요.',
      '모든 기능이 아닌 핵심 가치 1가지에 집중하세요.',
      '고객 리뷰와 피드백을 제품 개선에 주기적으로 반영하세요.',
    ],
    acquisition: [
      '채널을 분산하지 말고 1가지 채널에 집중하세요.',
      '콘텐츠의 일관성이 장기적인 유입을 만듭니다.',
      '지인 네트워크부터 시작해 첫 100명을 확보하세요.',
    ],
    revenue: [
      '매월 고정비와 변동비를 정확히 파악하세요.',
      '손익분기점을 계산하고 목표 달성 시점을 설정하세요.',
      '가격을 너무 낮게 책정하지 마세요. 가치 기반 가격을 고려하세요.',
    ],
    operation: [
      '반복 업무를 문서화하여 나중에 위임할 수 있게 하세요.',
      '하루 업무 중 가장 중요한 3가지에 집중하세요.',
      '도구와 자동화를 활용해 시간을 절약하세요.',
    ],
    growth: [
      '측정 가능한 지표 1가지를 선택하고 집중하세요.',
      '주간 단위로 실제 vs 목표를 비교하며 빠르게 수정하세요.',
      '기존 고객을 통한 레퍼럴이 가장 효율적인 성장 방법입니다.',
    ],
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{area.icon}</span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{area.label}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{area.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">현재 점수</span>
            <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-black text-slate-900 dark:text-white">{score}</span>
            <span className="text-slate-400 mb-1">/ 100</span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score}%`, backgroundColor: area.color }}
            />
          </div>
        </div>

        {/* Tips */}
        <div className="p-6">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">개선 포인트</h4>
          <ul className="space-y-3">
            {tips[areaId].map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0 text-xs font-bold text-red-600 dark:text-red-400">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 pb-6">
          <Link
            href="/explore"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
          >
            이 영역 전략 보기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
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

export default function DashboardPage() {
  const router = useRouter()
  const { scores, diagnosisCompleted, industry } = useStore()
  const [selectedArea, setSelectedArea] = useState<AreaId | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isSample = !diagnosisCompleted
  const displayScores = isSample ? SAMPLE_SCORES : scores

  const totalScore = getTotalScore(displayScores)
  const totalStatus = getStatusLevel(totalScore)

  const radarData = AREAS.map(area => ({
    area: area.label,
    score: displayScores[area.id] || 0,
    fullMark: 100,
    areaId: area.id,
  }))

  const sortedAreas = AREAS.map(area => ({
    ...area,
    score: displayScores[area.id] || 0,
  })).sort((a, b) => a.score - b.score)

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Sample Banner */}
        {isSample && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">샘플 데이터입니다</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">진단을 완료하면 실제 점수가 표시됩니다</p>
            </div>
            <Link
              href="/onboarding"
              className="flex-shrink-0 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
            >
              진단 시작
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">창업 준비도 대시보드</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {isSample ? '샘플 결과 — 진단을 완료해 실제 점수를 확인하세요' : '영역 카드를 클릭하면 상세 분석을 볼 수 있습니다'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/explore"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
            >
              전략 탐색
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Total Score */}
        <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                <circle
                  cx="48" cy="48" r="40"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - totalScore / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{totalScore}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">종합 준비도 점수</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${totalStatus.bg} ${totalStatus.color}`}>
                  {totalStatus.label}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">7개 영역의 평균 점수입니다</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  우수 80점 이상
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  양호 60~79점
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  보통 40~59점
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  위험 40점 미만
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Radar Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">영역별 레이더 차트</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-700" />
                  <PolarAngleAxis
                    dataKey="area"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickCount={4}
                  />
                  <Radar
                    name="준비도"
                    dataKey="score"
                    stroke="#dc2626"
                    fill="#dc2626"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}점`, '준비도']}
                    contentStyle={{
                      backgroundColor: 'rgba(15,23,42,0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">집중 개선 영역</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">점수 낮은 순서로 우선순위를 표시합니다</p>
            <div className="space-y-3">
              {sortedAreas.slice(0, 5).map((area, i) => {
                const status = getStatusLevel(area.score)
                return (
                  <button
                    key={area.id}
                    onClick={() => setSelectedArea(area.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
                  >
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                      i === 0 ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400' :
                      i === 1 ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-lg">{area.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{area.label}</span>
                        <span className={`text-xs font-bold ${status.color}`}>{area.score}점</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${area.score}%`, backgroundColor: area.color }}
                        />
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 flex-shrink-0 transition-colors" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* All Area Cards */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">전체 영역 상세</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AREAS.map(area => {
              const score = displayScores[area.id] || 0
              const status = getStatusLevel(score)
              return (
                <button
                  key={area.id}
                  onClick={() => setSelectedArea(area.id)}
                  className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{area.icon}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{area.label}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{area.description}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 group-hover:opacity-90"
                        style={{ width: `${score}%`, backgroundColor: area.color }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white w-10 text-right">{score}점</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Action CTA */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold">오늘 할 일을 찾아볼까요?</h3>
                <p className="text-red-100 text-sm mt-0.5">취약한 영역부터 실행 가능한 액션을 추천합니다</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap ml-auto">
              <Link
                href="/explore"
                className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition-colors"
              >
                전략 탐색
              </Link>
              <Link
                href="/action"
                className="px-5 py-2.5 rounded-xl bg-white text-red-600 hover:bg-red-50 font-semibold text-sm transition-colors"
              >
                실행 시작
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedArea && (
        <DetailModal
          areaId={selectedArea}
          score={displayScores[selectedArea] || 0}
          onClose={() => setSelectedArea(null)}
        />
      )}
    </div>
  )
}
