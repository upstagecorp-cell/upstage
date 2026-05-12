'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart2, CheckCircle, RotateCcw, Sparkles, LockKeyhole, TrendingUp } from 'lucide-react'
import { useStore } from '@/lib/store'

export default function LandingPage() {
  const router = useRouter()
  const { industry, diagnosisCompleted, resetDiagnosis } = useStore()

  useEffect(() => {
    if (diagnosisCompleted) {
      router.replace('/dashboard')
    }
  }, [diagnosisCompleted, router])

  const features = [
    { icon: <BarChart2 className="w-6 h-6 text-slate-700 dark:text-slate-200" />, title: '원인부터 구분', desc: '매출 문제인지 이익 문제인지 먼저 나눠서 봅니다.' },
    { icon: <Sparkles className="w-6 h-6 text-emerald-600" />, title: '실행할수록 더 정밀하게', desc: '한 번의 진단으로 끝나지 않고 실행 기록에 따라 추가 분석을 받게 됩니다.' },
    { icon: <TrendingUp className="w-6 h-6 text-blue-600" />, title: '변화가 보이는 구조', desc: '오늘 액션, 주간 우선순위, 월간 리포트까지 흐름으로 이어집니다.' },
  ]

  const unlockSteps = [
    { step: '무료 진단', reward: '막힌 원인 + 오늘 액션 1개', tone: 'bg-white text-slate-950 border border-slate-200' },
    { step: '실행 1개', reward: '상세 원인 분석 제공', tone: 'bg-emerald-500 text-emerald-950 border border-emerald-400' },
    { step: '실행 3개', reward: '주간 개선 방향 제공', tone: 'bg-white/10 text-white border border-white/10' },
    { step: '실행 5개', reward: '업종 체크리스트 제공', tone: 'bg-white/10 text-white border border-white/10' },
    { step: '실행 10개', reward: '월간 성장 리포트 제공', tone: 'bg-white/10 text-white border border-white/10' },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-16 bg-slate-50 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
          <div className="text-left">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mb-6 tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              사업 매출·이익 진단 도구
            </span>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-950 dark:text-white mb-5 leading-[1.12]">
              무료 진단만 해주는 서비스가 아니라,
              <br />
              <span className="text-emerald-600 dark:text-emerald-400">실행할수록 더 많은 분석을 받을 수 있는 서비스</span>
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg lg:text-xl mb-7 leading-relaxed">
              첫 진단에서는 매출과 이익이 막힌 원인을 찾고,
              그다음부터는 실행 기록을 쌓을수록 더 정밀한 원인 분석과 주간 방향, 월간 리포트를 받을 수 있습니다.
            </p>

            <div className="flex flex-col gap-4 mb-8">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm md:text-base text-slate-700 dark:text-slate-300">무료 1회 진단으로 끝나지 않고, 실행에 따라 다음 분석과 보상을 받을 수 있습니다.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm md:text-base text-slate-700 dark:text-slate-300">포인트보다 사업에 실제로 필요한 분석과 체크리스트를 보상으로 제공합니다.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm md:text-base text-slate-700 dark:text-slate-300">사용할수록 내 업종과 운영 방식에 맞는 조언이 더 정교해집니다.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start gap-3">
              {industry ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/diagnosis')}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg shadow-emerald-200 dark:shadow-emerald-950 transition-colors"
                  >
                    진단 이어하기
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      resetDiagnosis()
                      router.push('/onboarding')
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    처음부터 다시하기
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/onboarding')}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg shadow-emerald-200 dark:shadow-emerald-950 transition-colors"
                >
                  무료 진단 시작하기
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/pricing')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                가격 보기
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/guide')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                서비스 이용 가이드
              </motion.button>
            </div>

            <p className="mt-4 text-sm text-slate-400">회원가입 없이 시작하고, 실행 기록이 쌓일수록 더 많은 분석을 받을 수 있습니다.</p>
          </div>

          <div className="rounded-[28px] bg-slate-950 text-white border border-slate-900 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-sm font-bold text-emerald-300 mb-1">첫 방문에서 보이는 메리트</p>
                <h2 className="text-xl md:text-2xl font-extrabold leading-tight">실행할수록 받을 수 있는 보상</h2>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <LockKeyhole className="w-5 h-5 text-emerald-300" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {unlockSteps.map((item, index) => (
                <div key={item.step} className={`rounded-2xl p-4 ${item.tone}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-950/10 dark:bg-white/10 flex items-center justify-center text-sm font-extrabold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-bold opacity-70 mb-1">{item.step}</p>
                      <p className="text-sm md:text-base font-extrabold leading-relaxed">{item.reward}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-bold text-emerald-300 mb-1">왜 다시 들어오게 되나요?</p>
              <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                진단 한 번으로 끝나는 구조가 아니라, 실행할 때마다 다음 분석과 다음 보상을 받을 수 있기 때문입니다.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full"
      >
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
              {f.icon}
            </div>
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
