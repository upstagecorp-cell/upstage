import { Industry, Stage, IndicatorInfo, OperationType, RestaurantIndicatorId } from './types'

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

export const OPERATION_TYPES: { id: OperationType; label: string; description: string }[] = [
  { id: 'hall', label: '홀 중심', description: '매장 내 식사 고객이 주요 매출원' },
  { id: 'delivery', label: '배달 중심', description: '배달앱을 통한 주문이 주요 매출원' },
  { id: 'takeout', label: '테이크아웃 중심', description: '포장 판매가 주요 매출원' },
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
]

// 운영 유형별 지표 가중치 (10=최중요, 1=최저)
export const INDICATOR_WEIGHTS: Record<OperationType, Record<RestaurantIndicatorId, number>> = {
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
}
