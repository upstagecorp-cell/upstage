import { IndicatorId } from './types'

/**
 * 지표별 점수 메시지
 * threshold: 이 값 이상이면 해당 message를 표시
 * 배열 순서는 내림차순 (높은 임계값 먼저)
 * 점수는 1~5점 → 백분율(20~100)로 변환하여 사용
 */
export const SCORE_MESSAGES: Record<IndicatorId, { threshold: number; message: string }[]> = {

  main_customer: [
    {
      threshold: 80,
      message:
        '주요 고객층을 구체적으로 파악하고 있습니다. 이 이해를 바탕으로 타깃 마케팅과 메뉴 최적화를 지속하세요.',
    },
    {
      threshold: 50,
      message:
        '고객층을 대략 알고 있지만 더 깊은 데이터가 필요합니다. 간단한 설문으로 방문 목적과 특성을 구체화해 보세요.',
    },
    {
      threshold: 0,
      message:
        '주요 고객층이 파악되지 않아 마케팅과 메뉴 방향이 흔들릴 수 있습니다. 지금 바로 고객 설문을 시작하세요.',
    },
  ],

  commercial_traffic: [
    {
      threshold: 80,
      message:
        '상권 유동 인구를 잘 파악하고 있습니다. 시간대별 특성을 활용해 영업 시간과 메뉴 구성을 정기적으로 최적화하세요.',
    },
    {
      threshold: 50,
      message:
        '상권에 대한 기본 감각은 있지만 데이터가 부족합니다. 소상공인 상권 분석 서비스를 활용해 수치로 파악해 보세요.',
    },
    {
      threshold: 0,
      message:
        '상권 유동 인구를 전혀 모르고 있습니다. 영업 시간과 인력 배치가 고객 흐름과 맞지 않을 가능성이 높습니다. 상권 조사를 즉시 진행하세요.',
    },
  ],

  sales_time_diff: [
    {
      threshold: 80,
      message:
        '시간대별 매출을 수치로 관리하고 있습니다. 비피크타임 매출 개선 전략을 지속적으로 테스트해 전체 매출 효율을 높이세요.',
    },
    {
      threshold: 50,
      message:
        '바쁜 시간은 알지만 수치 관리가 부족합니다. 피크타임 분석 액션을 통해 정확한 매출 데이터를 확보하세요.',
    },
    {
      threshold: 0,
      message:
        '시간대별 매출 차이를 파악하지 못하고 있습니다. 인력 낭비와 매출 기회 손실이 동시에 발생하고 있을 수 있습니다. POS 데이터 분석을 지금 시작하세요.',
    },
  ],

  menu_competitiveness: [
    {
      threshold: 80,
      message:
        '대표 메뉴의 경쟁력이 확보되어 있습니다. 차별화 포인트를 지속적으로 강화하고 신메뉴 테스트로 경쟁 우위를 유지하세요.',
    },
    {
      threshold: 50,
      message:
        '메뉴에 개성은 있지만 경쟁점 대비 차별화가 약합니다. 경쟁 음식점 분석과 메뉴 설명 개선으로 선택받을 이유를 만들어보세요.',
    },
    {
      threshold: 0,
      message:
        '대표 메뉴의 경쟁력이 낮습니다. 이대로라면 가격 경쟁만 남게 됩니다. 경쟁점 조사와 메뉴 차별화부터 시작하세요.',
    },
  ],

  menu_cost_rate: [
    {
      threshold: 80,
      message:
        '원가 관리가 잘 되고 있습니다. 식재료 가격 변동을 주기적으로 반영하고 고마진 메뉴 판매 비중을 꾸준히 높여가세요.',
    },
    {
      threshold: 50,
      message:
        '원가를 대략 알고 있지만 정확한 계산이 필요합니다. 월 1회 원가 계산 루틴을 만들면 수익성 관리가 크게 개선됩니다.',
    },
    {
      threshold: 0,
      message:
        '원가를 모르면 팔수록 손해 보는 메뉴가 있을 수 있습니다. 지금 당장 대표 메뉴 3개의 원가율 계산을 시작하세요.',
    },
  ],

  avg_spending_per_customer: [
    {
      threshold: 80,
      message:
        '객단가 관리가 잘 되고 있습니다. 업셀링 전략과 세트 메뉴 개선으로 객단가를 지속적으로 높여가세요.',
    },
    {
      threshold: 50,
      message:
        '객단가를 대략 알고 있지만 전략적 접근이 부족합니다. 사이드 메뉴 추천이나 세트 구성으로 추가 매출 기회를 만들어보세요.',
    },
    {
      threshold: 0,
      message:
        '객단가를 파악하지 못하고 있습니다. 수익 목표를 세울 기준이 없는 상태입니다. 지금 바로 최근 1개월 평균 결제 금액을 계산해보세요.',
    },
  ],

  table_turnover: [
    {
      threshold: 80,
      message:
        '테이블 회전율을 수치로 관리하고 있습니다. 서빙·결제 프로세스를 지속 개선해 피크타임 수익을 극대화하세요.',
    },
    {
      threshold: 50,
      message:
        '피크타임을 알고 있지만 회전율을 수치로 관리하지 않습니다. 1주일 데이터를 기록해 병목 구간을 찾아보세요.',
    },
    {
      threshold: 0,
      message:
        '테이블 회전율을 전혀 파악하지 못하고 있습니다. 피크타임에 얼마나 많은 고객을 수용할 수 있는지 모르면 매출 한계를 뛰어넘기 어렵습니다. 오늘부터 기록을 시작하세요.',
    },
  ],

  delivery_app_exposure: [
    {
      threshold: 80,
      message:
        '배달앱 노출이 잘 관리되고 있습니다. 메뉴 사진과 설명을 주기적으로 업데이트해 클릭율을 지속 유지하세요.',
    },
    {
      threshold: 50,
      message:
        '배달앱에 등록되어 있지만 노출 최적화가 부족합니다. 메뉴 사진 교체와 설명 개선으로 주문 전환율을 높여보세요.',
    },
    {
      threshold: 0,
      message:
        '배달앱 노출이 매우 낮거나 관리되지 않고 있습니다. 경쟁 매장 대비 주문 기회를 크게 놓치고 있습니다. 사진 교체와 설명 수정을 즉시 시작하세요.',
    },
  ],

  review_rating: [
    {
      threshold: 80,
      message:
        '리뷰 관리가 잘 이루어지고 있습니다. 긍정 리뷰를 재방문 유도에 활용하고 부정 리뷰 패턴에서 개선점을 지속 발굴하세요.',
    },
    {
      threshold: 50,
      message:
        '리뷰를 확인하지만 응답과 개선 루틴이 없습니다. 주 1회 리뷰 응답 루틴을 만들면 신뢰도가 빠르게 높아집니다.',
    },
    {
      threshold: 0,
      message:
        '리뷰 관리가 전혀 이루어지지 않고 있습니다. 부정 리뷰가 신규 고객 유입을 막고 있을 가능성이 높습니다. 오늘 모든 미응답 리뷰에 답변을 시작하세요.',
    },
  ],

  naver_place_status: [
    {
      threshold: 80,
      message:
        '네이버 플레이스가 잘 관리되고 있습니다. 월 1회 정보 점검을 루틴화해 항상 최신 상태를 유지하세요.',
    },
    {
      threshold: 50,
      message:
        '기본 정보는 있지만 사진이나 메뉴 정보가 오래됐습니다. 지금 바로 사진 업로드와 메뉴 가격 업데이트를 진행하세요.',
    },
    {
      threshold: 0,
      message:
        '네이버 플레이스 정보가 부정확하거나 관리되지 않고 있습니다. 잘못된 정보가 고객 방문을 막고 있습니다. 영업시간과 전화번호부터 즉시 수정하세요.',
    },
  ],

  revisit_rate: [
    {
      threshold: 80,
      message:
        '재방문율 관리가 잘 되고 있습니다. 단골 고객 데이터를 활용해 맞춤 혜택을 제공하고 이탈 방지를 강화하세요.',
    },
    {
      threshold: 50,
      message:
        '단골 고객을 알고 있지만 체계적인 관리가 부족합니다. 재방문 쿠폰 테스트로 단골 유지율을 높여보세요.',
    },
    {
      threshold: 0,
      message:
        '재방문율을 파악하지 못하고 있습니다. 신규 고객 유치 비용이 재방문 유지 비용보다 5배 이상 듭니다. 단골 분류와 재방문 쿠폰부터 즉시 시작하세요.',
    },
  ],
  lodging_positioning: [
    { threshold: 80, message: '숙소 포지셔닝이 명확합니다. 컨셉과 타겟에 맞는 사진과 문구를 계속 일관되게 관리하세요.' },
    { threshold: 50, message: '컨셉은 있지만 예약 이유로 연결되는 메시지가 약합니다. 숙소 컨셉 매트릭스를 정리해보세요.' },
    { threshold: 0, message: '포지셔닝이 약해 가격 경쟁에 노출될 수 있습니다. 타겟 고객과 X-Factor부터 정의하세요.' },
  ],
  occupancy_rate: [
    { threshold: 80, message: '객실 점유율을 잘 관리하고 있습니다. 62% 이하 구간 대응 규칙을 유지하세요.' },
    { threshold: 50, message: '예약률은 보지만 대응 기준이 부족합니다. 점유율과 최소숙박일 조정표를 만들어보세요.' },
    { threshold: 0, message: '점유율을 모르면 공실 대응이 늦어집니다. 최근 30일 점유율부터 계산하세요.' },
  ],
  adr_revpar: [
    { threshold: 80, message: 'ADR/RevPAR 관리가 좋습니다. 객단가와 점유율 균형을 계속 테스트하세요.' },
    { threshold: 50, message: '객단가 감각은 있지만 수익 효율 분석이 부족합니다. RevPAR 계산표를 만드세요.' },
    { threshold: 0, message: '감으로 가격을 정하면 저가 경쟁이나 공실 위험이 커집니다. ADR/RevPAR부터 계산하세요.' },
  ],
  direct_booking_share: [
    { threshold: 80, message: '직접 예약 채널이 잘 관리되고 있습니다. OTA 수수료 절감액을 꾸준히 기록하세요.' },
    { threshold: 50, message: '직접 문의는 있지만 비중 관리가 부족합니다. 직접 예약 링크와 혜택을 정비하세요.' },
    { threshold: 0, message: 'OTA 의존도가 높습니다. 직접 예약 채널을 하나라도 구축해야 합니다.' },
  ],
  ota_dependency: [
    { threshold: 80, message: '채널 리스크를 잘 분산하고 있습니다. 채널별 매출 비중을 계속 확인하세요.' },
    { threshold: 50, message: '여러 채널은 있으나 실제 의존도 관리가 부족합니다. OTA 비중을 계산해보세요.' },
    { threshold: 0, message: '특정 플랫폼 의존도가 높습니다. 대체 채널을 즉시 정비하세요.' },
  ],
  weekday_weekend_gap: [
    { threshold: 80, message: '요일별 수요에 맞춰 상품과 요금을 잘 조정하고 있습니다.' },
    { threshold: 50, message: '평일 공실 개선 실험이 부족합니다. 평일 패키지를 테스트해보세요.' },
    { threshold: 0, message: '요일별 편차를 모르면 평일 공실과 주말 수익 손실이 생깁니다. 예약 데이터를 나눠보세요.' },
  ],
  visual_content_ctr: [
    { threshold: 80, message: '시각 콘텐츠가 강합니다. 대표 사진과 숏폼을 정기적으로 테스트하세요.' },
    { threshold: 50, message: '사진은 있지만 클릭률 관점의 개선이 부족합니다. 대표 사진 교체 테스트를 해보세요.' },
    { threshold: 0, message: '사진 신뢰도가 약합니다. 숙소의 X-Factor가 보이는 대표 사진부터 교체하세요.' },
  ],
  conversion_rate: [
    { threshold: 80, message: '예약 전환 흐름을 잘 관리하고 있습니다. 상세 페이지 실험을 이어가세요.' },
    { threshold: 50, message: '예약 수는 보지만 전환 병목이 불명확합니다. 문의 대비 예약 전환율을 계산하세요.' },
    { threshold: 0, message: '예약 저조 원인을 감으로만 판단하고 있습니다. 상세 페이지 병목 점검이 필요합니다.' },
  ],
  reply_speed: [
    { threshold: 80, message: '응답 속도와 품질이 안정적입니다. 템플릿을 최신 상태로 유지하세요.' },
    { threshold: 50, message: '응답은 하지만 표준화가 부족합니다. 예약 문의 템플릿을 만드세요.' },
    { threshold: 0, message: '응답 지연은 예약 이탈로 이어집니다. 자동응답과 FAQ부터 준비하세요.' },
  ],
  review_reputation: [
    { threshold: 80, message: '리뷰 신뢰 자산이 잘 쌓이고 있습니다. 체크아웃 리뷰 요청 루틴을 유지하세요.' },
    { threshold: 50, message: '리뷰 관리는 하지만 수집/응답 루틴이 부족합니다. 리뷰 요청 자동화를 만드세요.' },
    { threshold: 0, message: '리뷰 관리가 약해 신규 고객 신뢰가 낮을 수 있습니다. 최근 리뷰 응답부터 시작하세요.' },
  ],
  naver_trust_layer: [
    { threshold: 80, message: '네이버 신뢰 레이어가 잘 구축되어 있습니다. 로컬 스토리를 꾸준히 발행하세요.' },
    { threshold: 50, message: '네이버 기본 정보는 있으나 콘텐츠가 부족합니다. 블로그형 로컬 스토리를 작성하세요.' },
    { threshold: 0, message: '네이버 검증 채널이 약합니다. 플레이스 정보와 후기 콘텐츠부터 정비하세요.' },
  ],
  amenity_transparency: [
    { threshold: 80, message: '어메니티 정보가 투명합니다. 변경 사항을 정기적으로 반영하세요.' },
    { threshold: 50, message: '주요 시설만 안내되어 있습니다. 41개 어메니티 리스트를 공개하세요.' },
    { threshold: 0, message: '시설 정보 부족은 문의와 취소로 이어집니다. 세부 비품 리스트부터 만드세요.' },
  ],
  ugc_sns: [
    { threshold: 80, message: 'UGC 확산 구조가 좋습니다. 포토존과 협업 콘텐츠를 계속 축적하세요.' },
    { threshold: 50, message: '공유될 요소는 있지만 유도 장치가 약합니다. UGC 포토존을 설계하세요.' },
    { threshold: 0, message: 'SNS 확산 구조가 없습니다. 입실 첫 5분의 공유 장면부터 설계하세요.' },
  ],
  housekeeping_efficiency: [
    { threshold: 80, message: '하우스키핑 비용과 품질이 잘 관리됩니다. 절감액을 가격 전략에 반영하세요.' },
    { threshold: 50, message: '청소 품질은 보지만 비용 효율 분석이 부족합니다. 건당 비용표를 만드세요.' },
    { threshold: 0, message: '하우스키핑 비용과 클레임을 모르면 마진과 평판이 흔들립니다. 기록부터 시작하세요.' },
  ],
  cancellation_rate: [
    { threshold: 80, message: '취소율과 원인을 잘 관리하고 있습니다. 안내 문구를 계속 개선하세요.' },
    { threshold: 50, message: '취소 현황은 보지만 원인 분류가 부족합니다. 취소 사유를 분류하세요.' },
    { threshold: 0, message: '취소 데이터를 보지 않아 예약 안정성이 낮습니다. 최근 취소 사유부터 정리하세요.' },
  ],
}

/**
 * 지표 점수(1~5)를 백분율(20~100)로 변환하는 유틸
 */
export function scoreToPercent(score: number): number {
  return Math.round((score / 5) * 100)
}

/**
 * 지표 ID와 점수를 받아 해당하는 메시지를 반환
 */
export function getScoreMessage(indicator: IndicatorId, score: number): string {
  const percent = scoreToPercent(score)
  const messages = SCORE_MESSAGES[indicator]
  const matched = messages.find(m => percent >= m.threshold)
  return matched?.message ?? messages[messages.length - 1].message
}
