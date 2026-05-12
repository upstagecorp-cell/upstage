import { Industry, Stage, IndicatorInfo, OperationType, IndicatorId, IndustryId } from './types'

export const INDUSTRIES: Industry[] = [
  { id: 'restaurant', label: '음식점', icon: '🍽️', description: '한식/중식/일식/양식 등 식당' },
  { id: 'cafe', label: '카페', icon: '☕', description: '카페/베이커리/디저트 매장' },
  { id: 'accommodation', label: '숙박', icon: '🏨', description: '호텔/게스트하우스/에어비앤비' },
  { id: 'service', label: '서비스업', icon: '🛠️', description: '미용/세탁/교육/컨설팅 등' },
  { id: 'online', label: '온라인사업', icon: '💻', description: '이커머스/앱/콘텐츠/SaaS' },
  { id: 'other', label: '기타', icon: '✨', description: '위 분류에 해당하지 않는 업종' },
]

export const STAGES: Stage[] = [
  { id: 'idea', label: '아이디어', icon: '💡', description: '아직 구체적인 계획 전 단계' },
  { id: 'preparing', label: '준비 중', icon: '📋', description: '사업 계획을 세우고 준비 중' },
  { id: 'pre-open', label: '오픈 직전', icon: '🚀', description: '곧 오픈 예정 (1~3개월 내)' },
  { id: 'operating', label: '운영 중', icon: '⚡', description: '현재 사업을 운영하고 있음' },
  { id: 'plateau', label: '매출 정체', icon: '📉', description: '성장이 멈추고 매출이 정체됨' },
  { id: 'expansion', label: '확장 준비', icon: '📈', description: '추가 성장/확장을 계획 중' },
]

export const OPERATION_TYPES: { id: OperationType; label: string; description: string; industries: IndustryId[] }[] = [
  { id: 'hall', label: '홀 중심', description: '매장 내 식사 고객이 주요 매출원', industries: ['restaurant'] },
  { id: 'delivery', label: '배달 중심', description: '배달앱을 통한 주문이 주요 매출원', industries: ['restaurant'] },
  { id: 'takeout', label: '테이크아웃 중심', description: '포장 판매가 주요 매출원', industries: ['restaurant'] },
  { id: 'boutique', label: '부티크/감성형', description: '디자인·감성 콘텐츠·객단가가 중요한 숙소', industries: ['accommodation'] },
  { id: 'social', label: '소셜/로컬형', description: '커뮤니티·로컬 경험·UGC 확산이 중요한 숙소', industries: ['accommodation'] },
  { id: 'stay', label: '장기체류형', description: '워케이션·한 달 살기·생활 편의가 중요한 숙소', industries: ['accommodation'] },
]

export const INDICATORS: IndicatorInfo[] = [
  { id: 'main_customer', label: '주 고객층', description: '사람들이 어떻게 들어오는가', icon: '👥', color: '#6366f1' },
  { id: 'commercial_traffic', label: '상권 유동 인구', description: '매장 주변 유동 인구 현황', icon: '🚶', color: '#8b5cf6' },
  { id: 'sales_time_diff', label: '점심/저녁/주말 매출 차이', description: '시간대별 매출 분포 파악', icon: '📊', color: '#ec4899' },
  { id: 'menu_competitiveness', label: '대표 메뉴 경쟁력', description: '대표 메뉴의 차별화 수준', icon: '⭐', color: '#f59e0b' },
  { id: 'menu_cost_rate', label: '메뉴 원가율', description: '원재료 대비 판매가 비율', icon: '💰', color: '#10b981' },
  { id: 'avg_spending_per_customer', label: '객단가', description: '1명당 평균 지출 금액', icon: '💳', color: '#3b82f6' },
  { id: 'table_turnover', label: '테이블 회전율', description: '시간당 테이블 사용 효율', icon: '🔄', color: '#14b8a6' },
  { id: 'delivery_app_exposure', label: '배달앱 노출', description: '배달앱에서의 검색 노출 상태', icon: '📱', color: '#f97316' },
  { id: 'review_rating', label: '리뷰 수/평점', description: '고객 리뷰와 평점 관리 상태', icon: '⭐', color: '#eab308' },
  { id: 'naver_place_status', label: '네이버 플레이스 상태', description: '네이버 플레이스 정보 관리 수준', icon: '📍', color: '#22c55e' },
  { id: 'revisit_rate', label: '재방문율', description: '고객이 다시 방문하는 비율', icon: '🔁', color: '#a855f7' },
  { id: 'lodging_positioning', label: '숙소 포지셔닝', description: '타겟 페르소나와 컨셉 명확도', icon: '🏷️', color: '#0f766e' },
  { id: 'occupancy_rate', label: '객실 점유율', description: '시장 수요 대응력과 공실 관리', icon: '🛏️', color: '#2563eb' },
  { id: 'adr_revpar', label: 'ADR/RevPAR', description: '객단가와 객실당 수익 관리', icon: '💹', color: '#16a34a' },
  { id: 'direct_booking_share', label: '직접 예약 비중', description: 'OTA 수수료 절감과 독립 채널 확보', icon: '🔗', color: '#0891b2' },
  { id: 'ota_dependency', label: 'OTA 의존도', description: '특정 플랫폼 종속 리스크', icon: '📲', color: '#f97316' },
  { id: 'weekday_weekend_gap', label: '평일/주말 편차', description: '요일별 수요와 요율 전략', icon: '📆', color: '#7c3aed' },
  { id: 'visual_content_ctr', label: '사진 클릭률', description: '디지털 로비의 시각적 매력', icon: '📸', color: '#db2777' },
  { id: 'conversion_rate', label: '예약 전환율', description: '상세 페이지 방문 후 결제 전환', icon: '🎯', color: '#dc2626' },
  { id: 'reply_speed', label: '응답 속도', description: '문의 응대 속도와 예약 만족도', icon: '⚡', color: '#ca8a04' },
  { id: 'review_reputation', label: '리뷰/평판', description: '최근 리뷰와 평점의 신뢰도', icon: '⭐', color: '#eab308' },
  { id: 'naver_trust_layer', label: '네이버 신뢰 레이어', description: '네이버 플레이스·블로그 검증력', icon: '🟢', color: '#22c55e' },
  { id: 'amenity_transparency', label: '어메니티 투명성', description: '비품·편의시설 정보의 구체성', icon: '🧴', color: '#06b6d4' },
  { id: 'ugc_sns', label: 'UGC/SNS 확산', description: '자발적 공유와 포토존 경쟁력', icon: '📣', color: '#ec4899' },
  { id: 'housekeeping_efficiency', label: '하우스키핑 효율', description: '청소 비용과 운영 자동화', icon: '🧹', color: '#64748b' },
  { id: 'cancellation_rate', label: '취소율', description: '기대치 관리와 예약 안정성', icon: '🛡️', color: '#475569' },
]

// 운영 유형별 지표 가중치 (10=최중요, 1=최저)
export const INDICATOR_WEIGHTS: Record<OperationType, Partial<Record<IndicatorId, number>>> = {
  hall: {
    table_turnover: 10,
    commercial_traffic: 9,
    sales_time_diff: 8,
    naver_place_status: 7,
    review_rating: 6,
    avg_spending_per_customer: 5,
    menu_competitiveness: 4,
    menu_cost_rate: 3,
    revisit_rate: 2,
    delivery_app_exposure: 1,
    main_customer: 5,
  },
  delivery: {
    delivery_app_exposure: 10,
    review_rating: 9,
    menu_competitiveness: 8,
    revisit_rate: 6,
    avg_spending_per_customer: 5,
    menu_cost_rate: 4,
    sales_time_diff: 3,
    naver_place_status: 2,
    table_turnover: 1,
    commercial_traffic: 2,
    main_customer: 5,
  },
  takeout: {
    commercial_traffic: 10,
    naver_place_status: 9,
    avg_spending_per_customer: 8,
    sales_time_diff: 7,
    revisit_rate: 6,
    menu_competitiveness: 5,
    menu_cost_rate: 4,
    review_rating: 3,
    delivery_app_exposure: 2,
    table_turnover: 1,
    main_customer: 5,
  },
  boutique: {
    visual_content_ctr: 10,
    adr_revpar: 9,
    lodging_positioning: 9,
    conversion_rate: 8,
    review_reputation: 7,
    amenity_transparency: 7,
    naver_trust_layer: 6,
    ugc_sns: 6,
    direct_booking_share: 5,
    reply_speed: 5,
    occupancy_rate: 5,
    weekday_weekend_gap: 4,
    ota_dependency: 4,
    cancellation_rate: 3,
    housekeeping_efficiency: 3,
  },
  social: {
    ugc_sns: 10,
    review_reputation: 9,
    lodging_positioning: 8,
    naver_trust_layer: 8,
    visual_content_ctr: 7,
    reply_speed: 7,
    conversion_rate: 6,
    direct_booking_share: 5,
    ota_dependency: 5,
    occupancy_rate: 5,
    amenity_transparency: 5,
    weekday_weekend_gap: 4,
    adr_revpar: 4,
    cancellation_rate: 3,
    housekeeping_efficiency: 3,
  },
  stay: {
    occupancy_rate: 10,
    direct_booking_share: 9,
    adr_revpar: 8,
    housekeeping_efficiency: 8,
    amenity_transparency: 8,
    weekday_weekend_gap: 7,
    cancellation_rate: 6,
    ota_dependency: 6,
    reply_speed: 5,
    conversion_rate: 5,
    naver_trust_layer: 4,
    lodging_positioning: 4,
    review_reputation: 4,
    visual_content_ctr: 3,
    ugc_sns: 3,
  },
}

export function getOperationTypesForIndustry(industry: IndustryId | null) {
  return OPERATION_TYPES.filter(op => !industry || op.industries.includes(industry))
}

export function getIndicatorsForOperationType(operationType: OperationType) {
  const weights = INDICATOR_WEIGHTS[operationType] ?? {}
  return INDICATORS.filter(ind => weights[ind.id] !== undefined)
}
