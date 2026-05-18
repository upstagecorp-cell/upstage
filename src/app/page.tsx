'use client'

import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Layers3,
  LineChart,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import { useStore } from '@/lib/store'

const stats = [
  { value: '3분', label: '핵심 진단 시작' },
  { value: '11+', label: '운영 지표 분석' },
  { value: '1일', label: '오늘 바로 할 액션' },
  { value: '4단계', label: '진단부터 개선까지' },
]

const marqueeItems = [
  '진단',
  '우선순위',
  '실행',
  '기록',
  '재진단',
  '매출',
  '이익',
  '고객',
  '리뷰',
  '재방문',
]

const diagnosisSignals = [
  { label: '원가율', value: '위험', width: '32%' },
  { label: '객단가', value: '주의', width: '54%' },
  { label: '리뷰', value: '양호', width: '82%' },
]

const executionQueue = [
  '대표 메뉴 원가 다시 계산',
  '리뷰 응답 템플릿 정리',
  '재방문 쿠폰 테스트',
]

const workflowSteps = [
  {
    eyebrow: '01 / Diagnose',
    title: '문제의 원인을 빠르게 분해',
    description:
      '운영 유형과 재무 상태를 함께 보고, 단순 매출 부족인지 이익 구조 문제인지 먼저 구분합니다.',
  },
  {
    eyebrow: '02 / Prioritize',
    title: '가장 먼저 바꿀 한 가지를 제안',
    description:
      '모든 지표를 한꺼번에 보여주지 않고, 지금 가장 영향이 큰 개선 지점부터 순서를 세웁니다.',
  },
  {
    eyebrow: '03 / Execute',
    title: '오늘 할 수 있는 액션으로 연결',
    description:
      '복잡한 분석에서 끝나지 않고, 바로 실행 가능한 체크리스트와 행동 카드로 이어집니다.',
  },
  {
    eyebrow: '04 / Improve',
    title: '기록이 다음 진단을 더 똑똑하게',
    description:
      '실행 이력, 점수 변화, 사업 지표를 함께 쌓아 다음 판단의 정확도를 높입니다.',
  },
]

const productRows = [
  {
    title: '진단 결과',
    description: '가장 위험한 지표와 우선 개선 1순위를 한 화면에서 확인합니다.',
    metrics: ['전체 점수 68', '위험 지표 3개', '이번 주 액션 4개'],
  },
  {
    title: '실행 보드',
    description: '추천 액션을 난이도, 시간, 기대 효과와 함께 바로 실행합니다.',
    metrics: ['예상 시간 30분', '효과 높음', '증빙 기록 가능'],
  },
  {
    title: '성장 대시보드',
    description: '실행 누적과 점수 변화를 보며 개선 속도를 확인합니다.',
    metrics: ['연속 실행 5일', '점수 +12', '주간 목표 달성'],
  },
]

export default function LandingPage() {
  const router = useRouter()
  const { industry, diagnosisCompleted } = useStore()

  useEffect(() => {
    if (diagnosisCompleted) {
      router.replace('/dashboard')
    }
  }, [diagnosisCompleted, router])

  return (
    <div className="min-h-screen bg-[#f7f5ff] text-slate-950 dark:bg-[#12091f] dark:text-white">
      <section className="relative overflow-hidden px-4 pb-20 pt-10 md:pb-28 md:pt-16">
        <div className="absolute inset-0 bg-white dark:bg-[#12091f]" />
        <div className="hero-ribbon hero-ribbon-primary" />
        <div className="hero-ribbon hero-ribbon-secondary" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/92 to-white/20 dark:from-[#12091f] dark:via-[#12091f]/92 dark:to-[#12091f]/20" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent dark:from-[#171022]" />
        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm backdrop-blur dark:border-violet-400/20 dark:bg-white/5 dark:text-violet-200">
              <Sparkles className="h-4 w-4" />
              소상공인을 위한 실행형 성장 인프라
            </div>

            <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl lg:text-7xl">
              매출을 진단하고,
              <br />
              실행으로 성장시키는
              <span className="block pb-2 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-indigo-500 bg-clip-text leading-[1.12] text-transparent">
                UpStage
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-xl dark:text-slate-300">
              현재 사업 상태를 분석하고, 가장 먼저 바꿔야 할 한 가지를 찾고,
              오늘 바로 실행할 수 있는 액션까지 연결합니다.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => router.push(industry ? '/diagnosis' : '/onboarding')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-700 px-6 py-3.5 text-sm font-bold text-white shadow-[0_18px_48px_rgba(109,40,217,0.28)] transition hover:bg-violet-800"
              >
                무료 진단 시작
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => router.push('/guide')}
                className="inline-flex items-center justify-center rounded-full border border-violet-200 bg-white/80 px-6 py-3.5 text-sm font-bold text-violet-800 transition hover:border-violet-300 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-violet-100 dark:hover:bg-white/10"
              >
                서비스 흐름 보기
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-12 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <div className="rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_24px_80px_rgba(76,29,149,0.16)] backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
              <div className="rounded-[22px] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#1d152a]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">Priority summary</p>
                    <h2 className="mt-2 text-xl font-bold">지금 가장 먼저 고쳐야 할 1가지</h2>
                  </div>
                  <div className="rounded-2xl bg-violet-50 px-4 py-3 text-right dark:bg-violet-400/10">
                    <p className="text-2xl font-black text-violet-700 dark:text-violet-200">68</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">전체 점수</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-950 p-4 text-white dark:bg-white/10">
                  <div className="flex items-start gap-3">
                    <Target className="mt-0.5 h-5 w-5 text-violet-300" />
                    <div>
                      <p className="text-xs font-bold text-violet-200">우선 개선 1순위</p>
                      <p className="mt-1 font-bold">광고 확대보다 원가율 개선부터 시작하세요.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { icon: WalletCards, label: '순이익률', value: '8.4%' },
                    { icon: Gauge, label: '위험 지표', value: '3개' },
                    { icon: LineChart, label: '주간 목표', value: '진행 중' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                      <Icon className="h-4 w-4 text-violet-500" />
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{label}</p>
                      <p className="mt-1 text-lg font-black">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_24px_80px_rgba(76,29,149,0.12)] backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">Today</p>
                <h3 className="mt-3 text-xl font-bold">오늘 바로 할 액션</h3>
                <div className="mt-4 space-y-3">
                  {['대표 메뉴 원가 다시 계산', '리뷰 응답 템플릿 정리', '재방문 쿠폰 테스트'].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm font-semibold shadow-sm dark:bg-white/5"
                    >
                      <CheckCircle2 className="h-4 w-4 text-violet-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {stats.slice(0, 2).map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-violet-100 bg-violet-700 p-5 text-white shadow-lg shadow-violet-900/15 dark:border-violet-400/15"
                  >
                    <p className="text-2xl font-black">{item.value}</p>
                    <p className="mt-1 text-sm text-violet-100">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-violet-100 bg-white py-6 dark:border-white/10 dark:bg-[#171022]">
        <div className="marquee-track flex min-w-max items-center gap-10 pr-10">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center gap-10">
              <span className="text-lg font-bold text-slate-400 dark:text-slate-500">{item}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-violet-300 dark:bg-violet-500" />
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-violet-100 bg-white px-4 py-8 dark:border-white/10 dark:bg-[#171022]">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-2xl font-black text-violet-700 dark:text-violet-200">{item.value}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-500">Why UpStage</p>
            <h2 className="mt-4 text-3xl font-extrabold md:text-5xl">분석으로 끝나지 않는 성장 시스템</h2>
            <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
              보고서를 더 많이 보여주는 대신, 사업자가 다음 행동을 더 빨리 결정하도록 돕습니다.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <div className="overflow-hidden rounded-[28px] border border-violet-100 bg-white lg:col-span-2 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="p-6 md:p-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl font-bold">매출이 막히는 이유를 먼저 구분합니다</h3>
                <p className="mt-3 max-w-xl leading-7 text-slate-600 dark:text-slate-300">
                  매출 부족인지, 이익 구조 문제인지, 운영 병목인지 한 번에 섞어 보지 않고 원인별로 나눕니다.
                </p>
              </div>

              <div className="relative border-t border-violet-100 bg-[linear-gradient(180deg,#fff_0%,#faf7ff_100%)] p-6 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(167,139,250,0.06))]">
                <div className="relative mx-auto grid max-w-3xl gap-4 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-[24px] border border-violet-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1f1730]">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">Diagnosis</p>
                    <div className="mt-5 space-y-4">
                      {diagnosisSignals.map((signal, index) => (
                        <div key={signal.label}>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-semibold">{signal.label}</span>
                            <span className="text-slate-500 dark:text-slate-400">{signal.value}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                            <span
                              className="diagnosis-bar block h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400"
                              style={{ '--target-width': signal.width, '--bar-delay': `${index * 0.5}s` } as CSSProperties}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-violet-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1f1730]">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">Priority summary</p>
                    <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white dark:bg-white/10">
                      <p className="text-xs font-semibold text-violet-200">우선 개선 1순위</p>
                      <p className="mt-2 text-lg font-bold">광고 확대보다 원가율 개선부터 시작</p>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      {['순이익률 8.4%', '위험 3개', '점수 68'].map((item) => (
                        <div key={item} className="rounded-2xl bg-slate-50 p-3 text-center font-semibold dark:bg-white/5">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-violet-100 bg-white dark:border-white/10 dark:bg-white/[0.03]">
                <div className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200">
                    <Target className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold">오늘 할 일로 바로 이어집니다</h3>
                  <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                    진단 결과는 보고서로 끝나지 않고, 실제 행동 순서로 변환됩니다.
                  </p>
                </div>
                <div className="relative min-h-[240px] border-t border-violet-100 bg-[linear-gradient(180deg,#fff_0%,#faf7ff_100%)] p-5 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(167,139,250,0.06))]">
                  <div className="space-y-3">
                    {executionQueue.map((item, index) => (
                      <div
                        key={item}
                        className="execution-item flex items-center gap-3 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1f1730]"
                        style={{ '--item-delay': `${index * 0.8}s` } as CSSProperties}
                      >
                        <CheckCircle2 className="h-4 w-4 text-violet-500" />
                        <span className="text-sm font-semibold">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            <div className="overflow-hidden rounded-[28px] border border-violet-100 bg-white dark:border-white/10 dark:bg-white/[0.03]">
              <div className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200">
                  <WalletCards className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl font-bold">재무 상태를 함께 봅니다</h3>
              </div>
              <div className="border-t border-violet-100 p-5 dark:border-white/10">
                <div className="rounded-2xl bg-slate-950 p-5 text-white dark:bg-white/10">
                  <p className="text-xs font-semibold text-violet-200">최근 3개월</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-400">월매출</p>
                      <p className="mt-1 text-xl font-black">2,500만</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">순이익률</p>
                      <p className="mt-1 text-xl font-black">8.4%</p>
                    </div>
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <span className="finance-bar block h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-300" />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-violet-100 bg-white dark:border-white/10 dark:bg-white/[0.03]">
              <div className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200">
                  <Gauge className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl font-bold">이번 주 목표를 잡습니다</h3>
              </div>
              <div className="border-t border-violet-100 p-5 dark:border-white/10">
                <div className="space-y-3">
                  {[
                    { label: '원가율 개선', done: true },
                    { label: '리뷰 응답', done: true },
                    { label: '재방문 쿠폰', done: false },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                      <span className={`h-4 w-4 rounded-full border ${item.done ? 'border-violet-500 bg-violet-500' : 'border-slate-300'}`} />
                      <span className="text-sm font-semibold">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-violet-100 bg-white dark:border-white/10 dark:bg-white/[0.03]">
              <div className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl font-bold">기록이 성장으로 이어집니다</h3>
              </div>
              <div className="border-t border-violet-100 p-5 dark:border-white/10">
                <div className="grid grid-cols-4 items-end gap-3 rounded-2xl bg-slate-950 p-5 text-white dark:bg-white/10">
                  {[
                    { label: '1주', value: '42', height: '42%' },
                    { label: '2주', value: '51', height: '56%' },
                    { label: '3주', value: '58', height: '70%' },
                    { label: '4주', value: '68', height: '88%' },
                  ].map((item, index) => (
                    <div key={item.label} className="flex h-28 flex-col justify-end gap-2">
                      <span
                        className="growth-bar block rounded-t-xl bg-gradient-to-t from-violet-600 to-fuchsia-300"
                        style={{ '--bar-height': item.height, '--bar-delay': `${index * 0.35}s` } as CSSProperties}
                      />
                      <div className="text-center">
                        <p className="text-sm font-bold">{item.value}</p>
                        <p className="text-[11px] text-slate-400">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-20 text-white dark:bg-black/20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-300">Workflow</p>
            <h2 className="mt-4 text-3xl font-extrabold md:text-5xl">진단부터 개선까지 한 흐름으로</h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {workflowSteps.map((step) => (
              <div key={step.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <p className="text-sm font-bold text-violet-300">{step.eyebrow}</p>
                <h3 className="mt-4 text-2xl font-bold">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-500">Product</p>
              <h2 className="mt-4 text-3xl font-extrabold md:text-5xl">사업자가 실제로 쓰는 화면</h2>
              <p className="mt-5 leading-8 text-slate-600 dark:text-slate-300">
                모든 화면은 하나의 질문에 답하도록 설계했습니다. 지금 무엇이 문제인지, 무엇부터 해야 하는지,
                그리고 좋아지고 있는지.
              </p>
            </div>

            <div className="space-y-4">
              {productRows.map((row) => (
                <div key={row.title} className="rounded-3xl border border-violet-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{row.title}</h3>
                      <p className="mt-2 text-slate-600 dark:text-slate-300">{row.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {row.metrics.map((metric) => (
                        <span key={metric} className="rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700 dark:bg-violet-400/10 dark:text-violet-200">
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-gradient-to-br from-violet-700 via-fuchsia-600 to-indigo-600 p-8 text-white md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                <Layers3 className="h-4 w-4" />
                UpStage
              </div>
              <h2 className="max-w-3xl text-3xl font-extrabold md:text-5xl">
                더 많은 정보보다,
                <br />
                더 나은 다음 행동이 필요할 때
              </h2>
              <p className="mt-5 max-w-2xl text-violet-100">
                무료 진단으로 현재 위치를 확인하고, 오늘 바로 실행할 수 있는 성장 루프를 시작하세요.
              </p>
            </div>
            <button
              onClick={() => router.push(industry ? '/diagnosis' : '/onboarding')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-bold text-violet-700 transition hover:bg-violet-50"
            >
              지금 시작하기
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
