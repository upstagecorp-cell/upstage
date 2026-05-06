'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Check,
  X,
  ChevronDown,
  Zap,
  Star,
  Crown,
  Building2,
  ArrowRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  id: string
  name: string
  monthlyPrice: number
  description: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  badge?: string
  badgeColor?: string
  features: PlanFeature[]
  ctaText: string
  ctaHref: string
  ctaClass: string
  cardClass: string
}

interface CompareRow {
  feature: string
  free: string | boolean
  starter: string | boolean
  pro: string | boolean
  business: string | boolean
}

interface FaqItem {
  question: string
  answer: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const plans: Plan[] = [
  {
    id: 'free',
    name: '무료',
    monthlyPrice: 0,
    description: '창업 아이디어를 처음 검증하는 단계',
    icon: Zap,
    iconColor: 'text-slate-500',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    features: [
      { text: '사업 진단 1회 (재진단 불가)', included: true },
      { text: '기본 대시보드 (레이더 차트)', included: true },
      { text: '오늘의 실행 1개/일 추천', included: true },
      { text: '실행 기록 최근 7일만 보기', included: true },
      { text: '업종 벤치마크 평균만 표시', included: true },
      { text: '상위 10% 벤치마크 비교', included: false },
      { text: 'AI 피드백', included: false },
      { text: '증거 첨부 기능', included: false },
    ],
    ctaText: '무료로 시작하기',
    ctaHref: '/onboarding',
    ctaClass:
      'w-full py-3 rounded-xl font-semibold text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all',
    cardClass:
      'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700',
  },
  {
    id: 'starter',
    name: '스타터',
    monthlyPrice: 9900,
    description: '매일 실행으로 성장 습관을 만드는 단계',
    icon: Star,
    iconColor: 'text-indigo-500',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950',
    badge: '가장 인기',
    badgeColor: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',
    features: [
      { text: '무제한 재진단', included: true },
      { text: '오늘의 실행 3개/일 추천', included: true },
      { text: '실행 기록 전체 보기', included: true },
      { text: '주간 목표 설정', included: true },
      { text: '텍스트/링크/숫자 증거 첨부', included: true },
      { text: '업종 벤치마크 전체 비교', included: true },
      { text: '기본 AI 피드백 (진단 결과 해석)', included: true },
      { text: '이미지/스크린샷 증거 업로드', included: false },
    ],
    ctaText: '스타터 시작',
    ctaHref: '/onboarding',
    ctaClass:
      'w-full py-3 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-500/20',
    cardClass:
      'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700',
  },
  {
    id: 'pro',
    name: '프로',
    monthlyPrice: 29900,
    description: 'AI 분석과 맞춤 전략으로 빠르게 성장하는 단계',
    icon: Crown,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950',
    badge: '추천',
    badgeColor: 'bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-700 dark:text-indigo-300',
    features: [
      { text: '스타터 전체 포함', included: true },
      { text: 'AI 맞춤 피드백 (실행별 + 주간 인사이트)', included: true },
      { text: '이미지/스크린샷 증거 업로드', included: true },
      { text: '14일 실행-검증 루프', included: true },
      { text: '월간 성장 리포트', included: true },
      { text: '비즈니스 지표 추적 + AI 분석', included: true },
      { text: '단계 해금 시스템', included: true },
      { text: '2단계 업종 세분류 맞춤 전략', included: true },
    ],
    ctaText: '프로 시작',
    ctaHref: '/onboarding',
    ctaClass:
      'w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all shadow-md shadow-indigo-500/30',
    cardClass:
      'bg-white dark:bg-slate-900 border-2 border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-500/10 dark:ring-indigo-400/10',
  },
  {
    id: 'business',
    name: '비즈니스',
    monthlyPrice: 99000,
    description: '팀과 함께 데이터 기반으로 스케일업하는 단계',
    icon: Building2,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 dark:bg-amber-950',
    features: [
      { text: '프로 전체 포함', included: true },
      { text: '1:1 AI 코칭 (챗봇 상담)', included: true },
      { text: '동종 업계 성공 사례 데이터', included: true },
      { text: '팀원 초대 (최대 5명)', included: true },
      { text: '커스텀 KPI 설정', included: true },
      { text: '우선 지원 + 전담 매니저', included: true },
      { text: '매출 예측 AI 모델', included: true },
      { text: 'API 연동 (POS, 예약시스템 등)', included: true },
    ],
    ctaText: '비즈니스 문의',
    ctaHref: '/onboarding',
    ctaClass:
      'w-full py-3 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-md shadow-amber-500/25',
    cardClass:
      'bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800',
  },
]

const compareRows: CompareRow[] = [
  { feature: '사업 진단', free: '1회', starter: '무제한', pro: '무제한', business: '무제한' },
  { feature: '실행 추천/일', free: '1개', starter: '3개', pro: '3개+', business: '무제한' },
  { feature: '실행 기록 보기', free: '7일', starter: '전체', pro: '전체', business: '전체' },
  { feature: '업종 벤치마크', free: '평균만', starter: '전체', pro: '전체', business: '전체' },
  { feature: '주간 목표 설정', free: false, starter: true, pro: true, business: true },
  { feature: '증거 첨부 (텍스트)', free: false, starter: true, pro: true, business: true },
  { feature: '증거 첨부 (이미지)', free: false, starter: false, pro: true, business: true },
  { feature: '기본 AI 피드백', free: false, starter: true, pro: true, business: true },
  { feature: 'AI 맞춤 피드백', free: false, starter: false, pro: true, business: true },
  { feature: '월간 성장 리포트', free: false, starter: false, pro: true, business: true },
  { feature: '비즈니스 지표 AI 분석', free: false, starter: false, pro: true, business: true },
  { feature: '2단계 업종 세분류 전략', free: false, starter: false, pro: true, business: true },
  { feature: '1:1 AI 코칭', free: false, starter: false, pro: false, business: true },
  { feature: '팀원 초대', free: false, starter: false, pro: false, business: '최대 5명' },
  { feature: '매출 예측 AI', free: false, starter: false, pro: false, business: true },
  { feature: 'API 연동', free: false, starter: false, pro: false, business: true },
  { feature: '전담 매니저', free: false, starter: false, pro: false, business: true },
]

const faqs: FaqItem[] = [
  {
    question: '결제는 어떻게 이루어지나요?',
    answer:
      '신용카드 또는 체크카드로 결제하실 수 있습니다. 연간 결제를 선택하시면 20% 할인된 금액이 즉시 청구됩니다. 월간 결제는 매달 동일 날짜에 자동 갱신됩니다.',
  },
  {
    question: '환불 정책은 어떻게 되나요?',
    answer:
      '결제 후 7일 이내에는 전액 환불이 가능합니다. 7일이 지난 경우 잔여 기간에 대한 부분 환불이 가능합니다. 환불 요청은 이메일 또는 1:1 문의를 통해 접수해 주세요.',
  },
  {
    question: '요금제를 언제든지 변경할 수 있나요?',
    answer:
      '네, 언제든지 업그레이드 또는 다운그레이드 가능합니다. 업그레이드 시 즉시 상위 기능을 이용하실 수 있으며, 차액은 일할 계산됩니다. 다운그레이드는 다음 갱신일부터 적용됩니다.',
  },
  {
    question: '무료 플랜과 유료 플랜의 데이터는 유지되나요?',
    answer:
      '네, 플랜 변경 후에도 기존에 입력한 모든 데이터는 그대로 유지됩니다. 유료 플랜으로 업그레이드하면 이전 7일 이후의 데이터도 즉시 열람 가능합니다.',
  },
  {
    question: '비즈니스 플랜 팀원 초대는 어떻게 작동하나요?',
    answer:
      '비즈니스 플랜 구독자는 대시보드 설정 메뉴에서 최대 5명의 팀원을 이메일로 초대할 수 있습니다. 초대받은 팀원은 동일한 데이터를 열람·편집하며 협업할 수 있습니다.',
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────
function CellValue({ val }: { val: string | boolean }) {
  if (typeof val === 'boolean') {
    return val ? (
      <Check className="w-4 h-4 text-indigo-500 mx-auto" />
    ) : (
      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
    )
  }
  return <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{val}</span>
}

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span className="font-medium text-slate-900 dark:text-white text-sm">{item.question}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="faq-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [showComparison, setShowComparison] = useState(false)

  function getPrice(plan: Plan): number {
    if (plan.monthlyPrice === 0) return 0
    return isAnnual ? Math.round(plan.monthlyPrice * 0.8) : plan.monthlyPrice
  }

  function formatPrice(price: number): string {
    if (price === 0) return '무료'
    return price.toLocaleString('ko-KR') + '원'
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-950 pt-16 pb-12 px-4">
        <div className="h-1 w-full bg-red-600 absolute top-0 left-0" />
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6">
            <Crown className="w-4 h-4" />
            요금제
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            내 창업 단계에 맞는
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              플랜을 선택하세요
            </span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto mb-10">
            무료로 시작하고, 성장에 따라 필요한 기능만 추가하세요.
            언제든지 업그레이드·다운그레이드 가능합니다.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                !isAnnual
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              월간 결제
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                isAnnual
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              연간 결제
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-semibold">
                20% 할인
              </span>
            </button>
          </div>
          {isAnnual && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-3 font-medium">
              연간 결제 시 2개월 무료 혜택!
            </p>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const price = getPrice(plan)
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative flex flex-col rounded-2xl p-6 ${plan.cardClass}`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${plan.badgeColor}`}
                  >
                    {plan.badge}
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <div className={`w-10 h-10 rounded-xl ${plan.iconBg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {formatPrice(price)}
                    </span>
                    {price > 0 && (
                      <span className="text-slate-400 dark:text-slate-500 text-sm mb-1">/월</span>
                    )}
                  </div>
                  {isAnnual && plan.monthlyPrice > 0 && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-through">
                      {plan.monthlyPrice.toLocaleString('ko-KR')}원/월
                    </div>
                  )}
                </div>

                {/* CTA */}
                <Link href={plan.ctaHref} className={plan.ctaClass}>
                  <span className="flex items-center justify-center gap-2">
                    {plan.ctaText}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>

                {/* Divider */}
                <div className="my-5 border-t border-slate-100 dark:border-slate-800" />

                {/* Features */}
                <ul className="flex flex-col gap-2.5 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      {f.included ? (
                        <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm leading-snug ${
                          f.included
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Comparison Table Toggle */}
      <section className="px-4 pb-10">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
          >
            전체 기능 비교표 {showComparison ? '접기' : '펼치기'}
            <motion.div animate={{ rotate: showComparison ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {showComparison && (
              <motion.div
                key="comparison"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <th className="text-left px-5 py-3 text-slate-600 dark:text-slate-400 font-semibold w-48">기능</th>
                        <th className="text-center px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">무료</th>
                        <th className="text-center px-4 py-3 text-indigo-600 dark:text-indigo-400 font-semibold">스타터</th>
                        <th className="text-center px-4 py-3 font-semibold">
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">프로</span>
                        </th>
                        <th className="text-center px-4 py-3 text-amber-600 dark:text-amber-400 font-semibold">비즈니스</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compareRows.map((row, i) => (
                        <tr
                          key={i}
                          className={`border-b border-slate-100 dark:border-slate-800 ${
                            i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                          }`}
                        >
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{row.feature}</td>
                          <td className="px-4 py-3 text-center"><CellValue val={row.free} /></td>
                          <td className="px-4 py-3 text-center"><CellValue val={row.starter} /></td>
                          <td className="px-4 py-3 text-center"><CellValue val={row.pro} /></td>
                          <td className="px-4 py-3 text-center"><CellValue val={row.business} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20 bg-slate-50 dark:bg-slate-900 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">자주 묻는 질문</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">결제, 환불, 업그레이드 관련 궁금증을 해결해 드립니다</p>
          </div>
          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <FaqAccordion key={i} item={faq} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">지금 바로 시작하세요</h2>
          <p className="text-indigo-100 mb-8">
            신용카드 없이 무료로 시작. 언제든지 업그레이드 가능합니다.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-600 font-semibold text-lg hover:bg-indigo-50 transition-all shadow-lg"
          >
            무료로 진단 시작하기
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
