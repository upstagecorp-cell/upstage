'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { useStore } from '@/lib/store'
import { QUESTIONS_BY_INDUSTRY, RESTAURANT_QUESTIONS } from '@/data/questions'
import { calculateIndicatorScores } from '@/lib/scoring'
import { getTodayActions } from '@/lib/actions'
import type { OperationType } from '@/data/types'

export default function DiagnosisPage() {
  const router = useRouter()
  const {
    industry,
    operationType,
    answers,
    setAnswer,
    completeDiagnosis,
    setTodayActions,
    diagnosisCompleted,
    resetDiagnosis,
  } = useStore()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)

  const questions =
    industry === 'cafe'
      ? QUESTIONS_BY_INDUSTRY.cafe
      : industry === 'accommodation'
      ? QUESTIONS_BY_INDUSTRY.accommodation
      : RESTAURANT_QUESTIONS

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const selectedScore = currentQuestion ? answers[currentQuestion.question_id] : undefined

  useEffect(() => {
    if (!industry) {
      router.replace('/onboarding')
      return
    }
    if (diagnosisCompleted) {
      router.replace('/diagnosis/result')
    }
  }, [industry, diagnosisCompleted, router])

  function handleSelectAnswer(score: number) {
    if (!currentQuestion) return
    setAnswer(currentQuestion.question_id, score)
  }

  function handleNext() {
    if (selectedScore === undefined) return
    if (currentIndex < questions.length - 1) {
      setDirection(1)
      setCurrentIndex(currentIndex + 1)
    } else {
      // All done — calculate scores
      const effectiveOpType: OperationType = operationType ?? 'hall'
      const scores = calculateIndicatorScores(answers, questions, effectiveOpType)
      const todayActions = getTodayActions(scores, effectiveOpType, [])
      completeDiagnosis(scores)
      setTodayActions(todayActions.map((a) => a.action_id))
      router.push('/diagnosis/result')
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex(currentIndex - 1)
    }
  }

  const difficultyLabel: Record<string, string> = {
    hall: '홀 중심',
    delivery: '배달 중심',
    takeout: '테이크아웃 중심',
    boutique: '부티크/감성형',
    social: '소셜/로컬형',
    stay: '장기체류형',
    cafe_takeout: '테이크아웃/배달형',
    cafe_stay: '좌석 체류형',
    cafe_dessert: '디저트/미식형',
    cafe_craft: '개인 브랜딩/크래프트형',
    cafe_local: '로컬 앵커형',
  }

  if (!currentQuestion) return null

  const answeredCount = Object.keys(answers).length
  const isLast = currentIndex === questions.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                const choice = confirm('진단을 중단하시겠습니까?\n\n확인: 처음부터 다시 시작 (업종 선택부터)\n취소: 진단 계속하기')
                if (choice) {
                  resetDiagnosis()
                  router.push('/')
                }
              }}
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              &#x2715; 나가기
            </button>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              3분 핵심 진단
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {operationType ? difficultyLabel[operationType] : ''} · {currentIndex + 1}/{questions.length}
            </span>
          </div>
          <div className="mb-3 rounded-2xl bg-white/80 dark:bg-slate-800/70 border border-indigo-100 dark:border-slate-700 px-4 py-3">
            <p className="text-sm font-bold text-slate-900 dark:text-white">먼저 핵심 질문만 빠르게 답합니다.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              결과 확인 후 원하면 세부 지표와 실행 액션으로 정밀하게 이어갈 수 있습니다.
            </p>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400">
              핵심 질문 {answeredCount}개 완료
            </span>
            <span className="text-xs text-slate-400">
              남은 핵심 질문: {questions.length - currentIndex - 1}개
            </span>
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestion.question_id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 md:p-8 mb-6"
          >
            {/* Category badge */}
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 mb-4">
              {getCategoryLabel(currentQuestion.category)}
            </span>

            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6 leading-snug">
              {currentQuestion.question}
            </h2>
            {getTermHelp(currentQuestion.category) && (
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 mb-6">
                {getTermHelp(currentQuestion.category)}
              </p>
            )}

            {/* Answer options */}
            <div className="flex flex-col gap-3">
              {currentQuestion.answer_options.map((option, i) => {
                const isSelected = selectedScore === option.score
                const riskColors: Record<string, string> = {
                  low: 'border-emerald-200 dark:border-emerald-700',
                  medium: 'border-amber-200 dark:border-amber-700',
                  high: 'border-red-200 dark:border-red-700',
                }
                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectAnswer(option.score)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-400'
                        : `${riskColors[option.risk_level]} bg-slate-50 dark:bg-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-500`
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-slate-300 dark:border-slate-500'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white text-sm leading-relaxed">
                        {option.label}
                      </p>
                      {isSelected && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-xs text-slate-500 dark:text-slate-400 mt-1"
                        >
                          {option.status_text}
                        </motion.p>
                      )}
                    </div>
                    <span
                      className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                        option.risk_level === 'low'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                          : option.risk_level === 'medium'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {option.score}점
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* Benchmark hint */}
            {selectedScore !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">벤치마크: </span>
                  {selectedScore >= 4
                    ? currentQuestion.benchmark_text.good
                    : selectedScore >= 2
                    ? currentQuestion.benchmark_text.normal
                    : currentQuestion.benchmark_text.danger}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:border-slate-300 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            disabled={selectedScore === undefined}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold transition-colors"
          >
            {isLast ? '결과 보기' : '다음'}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    main_customer: '주 고객층',
    commercial_traffic: '상권 유동인구',
    sales_time_diff: '시간대별 매출',
    menu_competitiveness: '대표 메뉴 경쟁력',
    menu_cost_rate: '메뉴 원가율',
    avg_spending_per_customer: '객단가',
    table_turnover: '테이블 회전율',
    delivery_app_exposure: '배달앱 노출',
    review_rating: '리뷰/평점',
    naver_place_status: '네이버 플레이스',
    revisit_rate: '재방문율',
    lodging_positioning: '숙소 포지셔닝',
    occupancy_rate: '객실 점유율',
    adr_revpar: 'ADR/RevPAR',
    direct_booking_share: '직접 예약 비중',
    ota_dependency: 'OTA 의존도',
    weekday_weekend_gap: '평일/주말 편차',
    visual_content_ctr: '사진 클릭률',
    conversion_rate: '예약 전환율',
    reply_speed: '응답 속도',
    review_reputation: '리뷰/평판',
    naver_trust_layer: '네이버 신뢰 레이어',
    amenity_transparency: '어메니티 투명성',
    ugc_sns: 'UGC/SNS 확산',
    housekeeping_efficiency: '하우스키핑 효율',
    cancellation_rate: '취소율',
    cafe_positioning: '카페 포지셔닝',
    signature_menu: '시그니처 메뉴',
    menu_cost_rate_cafe: '음료/디저트 원가율',
    avg_basket_size: '객단가/APC',
    peak_wait_time: '피크 대기 시간',
    digital_ordering: '디지털 주문',
    wallet_loyalty: '디지털 로열티',
    local_seo: '로컬 SEO',
    review_response: '리뷰 응답',
    sns_shortform_ugc: '숏폼/UGC',
    local_partnership: '로컬 협업',
    retention_winback: '재방문/윈백',
    space_productivity: '공간 생산성',
    sourcing_story: '원두/브랜드 스토리',
  }
  return labels[category] ?? category
}

function getTermHelp(category: string): string | null {
  const descriptions: Record<string, string> = {
    occupancy_rate: '객실 점유율은 전체 판매 가능한 객실 중 실제 예약된 객실의 비율입니다. 예를 들어 10개 객실 중 6개가 팔리면 60%입니다.',
    adr_revpar: 'ADR은 하루에 팔린 객실의 평균 객실 단가입니다. RevPAR는 전체 객실 1개당 평균 매출로, 객실 단가와 점유율을 함께 보는 수익 지표입니다.',
    direct_booking_share: '직접 예약은 OTA를 거치지 않고 자사 예약 링크, 네이버, 인스타그램, 전화, 문자 등으로 바로 받은 예약을 뜻합니다.',
    ota_dependency: 'OTA는 야놀자, 여기어때, 에어비앤비, 부킹닷컴처럼 숙소를 대신 노출하고 예약을 받아주는 온라인 예약 플랫폼입니다.',
    weekday_weekend_gap: '평일/주말 예약 편차는 평일과 주말의 예약률이나 매출 차이를 뜻합니다. 편차가 크면 요금이나 패키지를 다르게 운영할 필요가 있습니다.',
    visual_content_ctr: 'CTR은 클릭률입니다. 숙소 사진이나 대표 이미지가 노출됐을 때 고객이 얼마나 자주 눌러보는지를 의미합니다.',
    conversion_rate: '예약 전환율은 숙소 페이지를 본 사람 중 실제 문의나 결제까지 이어진 사람의 비율입니다.',
    reply_speed: '응답 속도는 고객 문의가 들어온 뒤 첫 답변을 보내기까지 걸리는 시간입니다. 빠른 답변은 예약 이탈을 줄이는 데 중요합니다.',
    review_reputation: '리뷰/평판은 최근 리뷰 수, 평점, 답글 여부, 부정 리뷰 대응까지 포함한 고객 신뢰 지표입니다.',
    naver_trust_layer: '네이버 신뢰 레이어는 고객이 예약 전 검색했을 때 확인하는 플레이스 정보, 블로그 후기, 카페 언급 등 검증 자료를 뜻합니다.',
    amenity_transparency: '어메니티는 샴푸, 수건, 주방도구, 주차, 와이파이처럼 숙박 중 사용할 수 있는 비품과 편의시설입니다.',
    ugc_sns: 'UGC는 고객이 직접 올리는 사진, 영상, 후기 같은 콘텐츠입니다. 인스타그램 게시물이나 블로그 후기가 대표적입니다.',
    housekeeping_efficiency: '하우스키핑 효율은 청소와 객실 정비에 드는 비용, 시간, 품질을 함께 관리하는 정도입니다.',
    cancellation_rate: '취소율은 전체 예약 중 취소된 예약의 비율입니다. 취소 이유를 알면 안내 문구와 환불 정책을 개선할 수 있습니다.',
    cafe_positioning: '포지셔닝은 누구를 위해, 어떤 상황에서, 어떤 이유로 방문하게 만들지 정하는 기준입니다.',
    signature_menu: '시그니처 메뉴는 고객이 이 카페를 기억하고 다시 찾게 만드는 대표 메뉴입니다.',
    menu_cost_rate_cafe: '원가율은 판매가 중 재료비가 차지하는 비율입니다. 카페는 재료비뿐 아니라 인건비와 임대료도 함께 봐야 합니다.',
    avg_basket_size: 'APC 또는 객단가는 고객 1명이 한 번 주문할 때 평균적으로 결제하는 금액입니다.',
    peak_wait_time: '피크 대기 시간은 주문이 몰리는 시간에 주문 접수부터 음료 제공까지 걸리는 평균 시간입니다.',
    digital_ordering: '디지털 주문은 키오스크, 모바일 선주문, QR 주문처럼 직원 응대 없이 주문을 받는 방식입니다.',
    wallet_loyalty: '디지털 로열티는 종이 쿠폰 대신 휴대폰 월렛, 문자, 카카오 등으로 적립과 리워드를 관리하는 방식입니다.',
    local_seo: '로컬 SEO는 네이버/구글 지도에서 내 주변 카페, 지금 영업 중 카페 같은 검색에 잘 보이게 관리하는 일입니다.',
    review_response: '리뷰 응답률은 새 리뷰에 정해진 시간 안에 답글을 단 비율입니다. 평점만큼 응답 속도도 신뢰에 영향을 줍니다.',
    sns_shortform_ugc: 'UGC는 고객이 직접 올리는 사진, 영상, 후기입니다. 숏폼은 릴스나 틱톡처럼 짧은 세로 영상 콘텐츠입니다.',
    local_partnership: '로컬 협업은 인근 회사, 헬스장, 미용실, 상점 등과 서로 고객을 보내주는 혜택을 만드는 활동입니다.',
    retention_winback: '윈백은 한동안 오지 않은 고객에게 혜택이나 메시지를 보내 다시 방문하게 만드는 활동입니다.',
    space_productivity: '공간 생산성은 좌석이 오래 차지되는 시간 대비 실제 매출이 충분한지 보는 지표입니다.',
    sourcing_story: '원두/브랜드 스토리는 산지, 가공 방식, 추출 철학, 운영자의 전문성을 고객이 이해하도록 전달하는 내용입니다.',
  }
  return descriptions[category] ?? null
}
