import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BarChart2, Target, Zap, TrendingUp, CheckCircle, Users } from 'lucide-react'

const steps = [
  { icon: Users, title: '업종 선택', description: '내 사업 유형과 현재 단계를 선택합니다', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
  { icon: Target, title: '맞춤 진단', description: '업종별 10개 질문으로 현재 상태를 진단합니다', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950' },
  { icon: BarChart2, title: '점수 확인', description: '7개 영역별 점수와 레이더 차트로 한눈에 파악합니다', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950' },
  { icon: Zap, title: '전략 탐색', description: '취약 영역 우선으로 맞춤 전략을 제공합니다', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' },
  { icon: CheckCircle, title: '오늘 실행', description: '하루 안에 완료 가능한 작은 액션을 실천합니다', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  { icon: TrendingUp, title: '성장 추적', description: '실행 기록이 점수로 쌓이며 성장을 확인합니다', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
]

const areas = [
  { label: '고객이해도', color: 'bg-indigo-500' },
  { label: '문제검증도', color: 'bg-purple-500' },
  { label: '상품경쟁력', color: 'bg-pink-500' },
  { label: '유입구조', color: 'bg-amber-500' },
  { label: '수익성', color: 'bg-emerald-500' },
  { label: '운영지속성', color: 'bg-blue-500' },
  { label: '성장가능성', color: 'bg-teal-500' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-950">
        {/* Red accent top bar */}
        <div className="h-1 w-full bg-red-600" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <Image
              src="/logo.jpg"
              alt="UpStage"
              width={200}
              height={60}
              className="h-14 w-auto object-contain dark:hidden"
            />
            <Image
              src="/logo-red-bg.png"
              alt="UpStage"
              width={200}
              height={60}
              className="h-14 w-auto object-contain hidden dark:block"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            AI 기반 창업 준비도 진단 플랫폼
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
            BRING YOUR BRAND
          </h1>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-red-600">TO THE STAGE</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-4 max-w-2xl mx-auto leading-relaxed font-medium">
            창업 성공을 가로막는 진짜 문제를 찾아드립니다
          </p>
          <p className="text-base text-slate-500 dark:text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            막연한 불안 대신 데이터로 현재 상태를 진단하고,<br />
            오늘 당장 실행 가능한 한 가지 액션부터 시작하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-lg transition-all shadow-lg shadow-red-500/25 hover:shadow-xl hover:-translate-y-0.5"
            >
              무료 진단 시작하기
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-lg hover:border-red-300 dark:hover:border-red-700 transition-all"
            >
              샘플 대시보드 보기
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-lg hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
            >
              요금제 보기
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: '7개', label: '진단 영역' },
              { value: '6개', label: '업종 지원' },
              { value: '10분', label: '진단 소요 시간' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-red-600">{stat.value}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 Areas */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">7가지 핵심 영역 진단</h2>
          <p className="text-slate-600 dark:text-slate-400">창업 성공에 필요한 7개 영역을 종합 평가합니다</p>
        </div>
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-3">
          {areas.map(area => (
            <div key={area.label} className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <div className={`w-2.5 h-2.5 rounded-full ${area.color}`} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{area.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">이렇게 작동합니다</h2>
            <p className="text-slate-600 dark:text-slate-400">6단계로 창업 준비도를 측정하고 실행까지 연결됩니다</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900 transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div className="absolute top-6 right-6 text-4xl font-black text-slate-100 dark:text-slate-800 select-none">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${step.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-red-600">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Image src="/logo-red-bg.png" alt="UpStage" width={160} height={48} className="h-12 w-auto object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">지금 바로 시작하세요</h2>
          <p className="text-red-100 mb-8 text-lg">10분 진단으로 내 사업의 취약점을 발견하고 오늘 할 일을 찾아보세요</p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-red-600 font-semibold text-lg hover:bg-red-50 transition-all shadow-lg"
          >
            무료로 진단 시작하기
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
