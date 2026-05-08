'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  ClipboardList,
  BarChart2,
  Zap,
  FileText,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  Star,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'

// ===== 목업 컴포넌트들 =====

function MockupPhone({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[280px] h-[500px] rounded-[2.5rem] border-[8px] border-slate-800 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden relative">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 dark:bg-slate-600 rounded-b-2xl z-10" />
      {/* Screen content */}
      <div className="h-full overflow-hidden pt-6">
        {children}
      </div>
    </div>
  )
}

function MockupOnboarding() {
  return (
    <MockupPhone>
      <div className="px-4 py-3 h-full flex flex-col">
        {/* Progress */}
        <div className="flex gap-1 mb-4">
          <div className="h-1 flex-1 rounded-full bg-indigo-500" />
          <div className="h-1 flex-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-1 flex-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <p className="text-[10px] text-slate-500 mb-1">Step 1/3</p>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">어떤 업종을 운영하시나요?</h3>
        <div className="space-y-2 flex-1">
          {[
            { icon: '🍽️', name: '음식점', active: true },
            { icon: '☕', name: '카페', active: false },
            { icon: '🏨', name: '숙박', active: false },
            { icon: '🛠️', name: '서비스업', active: false },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-[11px] ${
                item.active
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className={`font-medium ${item.active ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                {item.name}
              </span>
              {item.active && <CheckCircle className="w-3.5 h-3.5 text-indigo-500 ml-auto" />}
            </div>
          ))}
        </div>
        <div className="mt-3">
          <div className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-center text-[11px] font-bold">
            다음
          </div>
        </div>
      </div>
    </MockupPhone>
  )
}

function MockupOperationType() {
  return (
    <MockupPhone>
      <div className="px-4 py-3 h-full flex flex-col">
        <div className="flex gap-1 mb-4">
          <div className="h-1 flex-1 rounded-full bg-indigo-500" />
          <div className="h-1 flex-1 rounded-full bg-indigo-500" />
          <div className="h-1 flex-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <p className="text-[10px] text-slate-500 mb-1">Step 2/3</p>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">주요 운영 방식은?</h3>
        <div className="space-y-2 flex-1">
          {[
            { name: '홀 중심', desc: '매장 내 식사 고객이 주요 매출원', active: true },
            { name: '배달 중심', desc: '배달앱 주문이 주요 매출원', active: false },
            { name: '테이크아웃 중심', desc: '포장 판매가 주요 매출원', active: false },
          ].map((item, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border text-[11px] ${
                item.active
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border-2 ${item.active ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`} />
                <span className={`font-bold ${item.active ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{item.name}</span>
              </div>
              <p className="text-[10px] text-slate-500 ml-5 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 rounded-lg p-2 mt-2">
          운영 유형에 따라 지표 가중치가 달라집니다
        </p>
        <div className="mt-3">
          <div className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-center text-[11px] font-bold">
            다음
          </div>
        </div>
      </div>
    </MockupPhone>
  )
}

function MockupDiagnosis() {
  return (
    <MockupPhone>
      <div className="px-4 py-3 h-full flex flex-col">
        {/* Progress */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-indigo-600 font-bold">3 / 25</span>
          <span className="text-[9px] text-slate-400">홀 중심 진단</span>
        </div>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-3 overflow-hidden">
          <div className="h-full w-[12%] bg-indigo-500 rounded-full" />
        </div>
        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 mb-2 w-fit">
          메뉴 원가율
        </span>
        <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-3 leading-snug">
          대표 메뉴 원가율을 알고 있나요?
        </h3>
        <div className="space-y-2 flex-1">
          {[
            { label: '최근 1개월 내 직접 계산했다', score: 5, risk: 'low', selected: false },
            { label: '대략 알고 있다', score: 3, risk: 'medium', selected: true },
            { label: '모른다', score: 1, risk: 'high', selected: false },
          ].map((opt, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-[10px] ${
                opt.selected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${opt.selected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`} />
              <span className="flex-1 text-slate-700 dark:text-slate-300">{opt.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                opt.risk === 'low' ? 'bg-emerald-100 text-emerald-700' :
                opt.risk === 'medium' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>{opt.score}점</span>
            </div>
          ))}
        </div>
        {/* Status hint */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 mt-2 border border-slate-200 dark:border-slate-700">
          <p className="text-[9px] text-slate-500"><span className="font-bold text-slate-700 dark:text-slate-300">상태:</span> 수익성 판단이 불완전함</p>
        </div>
        <div className="flex gap-2 mt-3">
          <div className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] text-slate-600 font-medium">이전</div>
          <div className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-center text-[10px] font-bold">다음 질문</div>
        </div>
      </div>
    </MockupPhone>
  )
}

function MockupResult() {
  return (
    <MockupPhone>
      <div className="px-4 py-3 h-full flex flex-col overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white text-center mb-3">진단 결과</h3>
        {/* Score circle */}
        <div className="flex justify-center mb-3">
          <div className="w-20 h-20 rounded-full border-4 border-amber-400 flex items-center justify-center">
            <div className="text-center">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">47</span>
              <span className="text-[10px] text-slate-500 block">/ 100</span>
            </div>
          </div>
        </div>
        {/* Risk indicators */}
        <div className="bg-red-50 dark:bg-red-950 rounded-xl p-2.5 mb-3">
          <p className="text-[10px] font-bold text-red-700 dark:text-red-300 mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> 위험 지표 TOP 3
          </p>
          <div className="space-y-1">
            {['메뉴 원가율 (20점)', '배달앱 노출 (30점)', '재방문율 (35점)'].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[9px] text-red-600 dark:text-red-400">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
        {/* Today actions */}
        <div className="bg-indigo-50 dark:bg-indigo-950 rounded-xl p-2.5 mb-3">
          <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-1.5 flex items-center gap-1">
            <Zap className="w-3 h-3" /> 오늘 할 일
          </p>
          <div className="space-y-1">
            {['대표 메뉴 원가 계산', '배달앱 메뉴 사진 교체'].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[9px] text-indigo-600 dark:text-indigo-400">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-auto">
          <div className="w-full py-2 rounded-xl bg-indigo-600 text-white text-center text-[10px] font-bold">
            실행하러 가기
          </div>
        </div>
      </div>
    </MockupPhone>
  )
}

function MockupAction() {
  return (
    <MockupPhone>
      <div className="px-4 py-3 h-full flex flex-col overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">오늘의 액션</h3>
        {/* Action Card */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-slate-900 dark:text-white">대표 메뉴 원가 계산</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">보통</span>
          </div>
          <div className="flex gap-1.5 mb-2">
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">50분</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">영향도: 높음</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">비용: 없음</span>
          </div>
          <p className="text-[9px] font-medium text-slate-700 dark:text-slate-300 mb-1">실행 단계:</p>
          <ol className="text-[8px] text-slate-500 space-y-0.5 list-decimal list-inside">
            <li>대표 메뉴 3개를 선정한다</li>
            <li>각 메뉴의 재료 목록을 작성한다</li>
            <li>재료별 현재 구매 단가를 확인한다</li>
            <li>1인분 기준 원가를 계산한다</li>
            <li>판매가 대비 원가율을 산출한다</li>
          </ol>
        </div>
        {/* Record form */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-2">실행 기록</p>
          <div className="space-y-1.5">
            <div className="h-6 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 flex items-center px-2 text-[9px] text-slate-400">소요 시간</div>
            <div className="h-6 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 flex items-center px-2 text-[9px] text-slate-400">어려웠던 점</div>
            <div className="h-10 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 flex items-start px-2 pt-1 text-[9px] text-slate-400">결과 메모</div>
          </div>
          <div className="w-full py-2 rounded-xl bg-emerald-600 text-white text-center text-[10px] font-bold mt-2">
            실행 완료
          </div>
        </div>
      </div>
    </MockupPhone>
  )
}

function MockupDashboard() {
  return (
    <MockupPhone>
      <div className="px-4 py-3 h-full flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">대시보드</h3>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 font-bold flex items-center gap-0.5">
            <TrendingUp className="w-2.5 h-2.5" /> 3일 연속
          </span>
        </div>
        {/* Mini score */}
        <div className="text-center mb-3 p-3 bg-indigo-50 dark:bg-indigo-950 rounded-xl">
          <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">47</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400"> / 100점</span>
          <div className="flex items-center justify-center gap-1 mt-1 text-[9px] text-emerald-600">
            <TrendingUp className="w-3 h-3" /> +8점 (지난주 대비)
          </div>
        </div>
        {/* Indicator bars */}
        <div className="space-y-1.5 mb-3">
          {[
            { name: '메뉴 원가율', score: 20, color: 'bg-red-500' },
            { name: '배달앱 노출', score: 30, color: 'bg-red-400' },
            { name: '재방문율', score: 35, color: 'bg-amber-500' },
            { name: '리뷰/평점', score: 55, color: 'bg-blue-500' },
            { name: '테이블 회전율', score: 70, color: 'bg-emerald-500' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[8px] text-slate-600 dark:text-slate-400 w-16 truncate">{item.name}</span>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.score}%` }} />
              </div>
              <span className="text-[8px] font-bold text-slate-700 dark:text-slate-300 w-6 text-right">{item.score}</span>
            </div>
          ))}
        </div>
        {/* CTA */}
        <div className="mt-auto flex gap-2">
          <div className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-center text-[9px] font-bold">오늘 액션 실행</div>
          <div className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-center text-[9px] font-medium">재진단</div>
        </div>
      </div>
    </MockupPhone>
  )
}

// ===== 메인 가이드 페이지 =====

export default function GuidePage() {
  const router = useRouter()

  const steps = [
    {
      icon: <ClipboardList className="w-6 h-6" />,
      title: '1단계: 업종 & 운영 유형 선택',
      description: '음식점 업종을 선택하고, 홀 중심 / 배달 중심 / 테이크아웃 중심 중 운영 방식을 선택합니다.',
      detail: '운영 유형에 따라 진단 질문의 가중치가 달라집니다. 배달 중심이라면 배달앱 노출이, 홀 중심이라면 테이블 회전율이 더 중요하게 평가됩니다.',
      mockup: <MockupOnboarding />,
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      title: '2단계: 운영 유형별 가중치 설정',
      description: '선택한 운영 유형에 따라 11개 지표의 중요도가 자동으로 설정됩니다.',
      detail: '같은 점수라도 업종과 운영 방식에 따라 우선순위가 달라집니다.',
      mockup: <MockupOperationType />,
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: '3단계: 25개 질문으로 진단',
      description: '각 질문에 5점/3점/1점 3단계로 답변하며, 답변 즉시 상태 설명과 위험도를 확인합니다.',
      detail: '벤치마크 기준과 비교하여 현재 위치를 실시간으로 파악할 수 있습니다.',
      mockup: <MockupDiagnosis />,
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: '4단계: 진단 결과 & 액션 추천',
      description: '전체 점수, 위험 지표 TOP 3, 오늘 할 일 1~3개를 확인합니다.',
      detail: '점수가 낮은 지표에서 자동으로 실행 가능한 액션 카드가 추천됩니다.',
      mockup: <MockupResult />,
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: '5단계: 액션 실행 & 기록',
      description: '추천된 액션 카드의 실행 단계를 따라 실행하고, 결과를 기록합니다.',
      detail: '소요 시간, 어려웠던 점, 결과 메모를 남기면 다음 추천에 반영됩니다.',
      mockup: <MockupAction />,
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: '6단계: 대시보드에서 성장 확인 & 재진단',
      description: '점수 변화를 추적하고, 2~4주 후 재진단으로 개선을 확인합니다.',
      detail: '진단 → 추천 → 실행 → 기록 → 피드백 → 재진단 루프를 반복합니다.',
      mockup: <MockupDashboard />,
    },
  ]

  const indicators = [
    '주 고객층', '상권 유동 인구', '점심/저녁/주말 매출 차이',
    '대표 메뉴 경쟁력', '메뉴 원가율', '객단가',
    '테이블 회전율', '배달앱 노출', '리뷰 수/평점',
    '네이버 플레이스 상태', '재방문율',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 mb-4">
            서비스 이용 가이드
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
            우리 가게 매출, 어디서부터 개선할까?
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
            AI 기반 진단으로 문제를 찾고, 실행 가능한 액션으로 매출을 올리세요.
          </p>
        </motion.div>

        {/* Core Concept */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-700 mb-12"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            서비스 핵심 구조
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            {['진단', '추천', '실행', '기록', '피드백', '재진단'].map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  {item}
                </span>
                {i < 5 && <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
              </span>
            ))}
          </div>
          <p className="text-center mt-4 text-sm text-slate-500 dark:text-slate-400">
            이 루프를 반복할수록 매장 운영이 체계적으로 개선됩니다.
          </p>
        </motion.div>

        {/* 11 Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-700 mb-16"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            진단하는 11가지 핵심 지표
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {indicators.map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50"
              >
                <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Steps with Mockups */}
        <div className="space-y-20 mb-20">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-12`}
            >
              {/* Text */}
              <div className="flex-1 max-w-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 leading-relaxed">{step.description}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.detail}</p>
              </div>
              {/* Mockup */}
              <div className="flex-shrink-0">
                {step.mockup}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/onboarding')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-indigo-900 transition-colors"
          >
            지금 무료 진단 시작하기
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          <p className="mt-3 text-sm text-slate-400">회원가입 없이 5분이면 충분합니다</p>
        </motion.div>
      </div>
    </div>
  )
}
