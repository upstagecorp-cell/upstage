'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart2, CheckCircle, Zap, RotateCcw } from 'lucide-react'
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
    {
      icon: <BarChart2 className="w-6 h-6 text-indigo-500" />,
      title: '11가지 핵심 지표 진단',
      desc: '음식점 매출에 직결되는 지표를 체계적으로 분석합니다.',
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: '오늘 실행 가능한 액션',
      desc: '점수에 따라 즉시 시작할 수 있는 구체적인 할 일을 제안합니다.',
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-emerald-500" />,
      title: '성장 추적 & 습관 형성',
      desc: '실행 기록과 점수 변화를 통해 지속적인 개선을 돕습니다.',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-xl w-full"
      >
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 mb-6 tracking-wide uppercase">
          음식점 매출 진단 SaaS
        </span>

        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
          매출이 안 오르는 <br />
          <span className="text-indigo-600 dark:text-indigo-400">진짜 이유</span>를 찾아드립니다
        </h1>

        <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 leading-relaxed">
          5분 진단으로 우리 가게의 약점을 발견하고,<br />
          오늘 당장 실행할 수 있는 액션을 받아보세요.
        </p>

        <div className="flex flex-col items-center gap-3">
          {industry ? (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/diagnosis')}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-indigo-900 transition-colors"
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
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  처음부터 다시하기
                </motion.button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                업종이나 운영 유형을 변경하려면 &quot;처음부터 다시하기&quot;를 선택하세요
              </p>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/onboarding')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-indigo-900 transition-colors"
            >
              무료 진단 시작하기
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/guide')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
          >
            서비스 이용 가이드
          </motion.button>
        </div>

        <p className="mt-4 text-sm text-slate-400">회원가입 없이 5분이면 충분합니다</p>
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
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
              {f.icon}
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">{f.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
