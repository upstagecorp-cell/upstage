import { RestaurantIndicatorId } from './types'

// 학습 콘텐츠 (PDF 공통전략 Section 14 - B. 콘텐츠/학습 영역)
// 진단 DB와 분리된 학습 자료

export interface LearningContent {
  id: string
  title: string
  description: string
  category: string
  relatedIndicators: RestaurantIndicatorId[]
  type: 'article' | 'guide' | 'strategy' | 'template'
}

export const LEARNING_CONTENTS: LearningContent[] = [
  {
    id: 'learn_1',
    title: '디지털 지역주의와 검색 노출 전략',
    description: '지역 기반 검색에서 상위 노출되기 위한 기본 개념과 실행 방법',
    category: '디지털 노출',
    relatedIndicators: ['naver_place_status', 'delivery_app_exposure'],
    type: 'article',
  },
  {
    id: 'learn_2',
    title: 'AI 검색 대응 전략',
    description: 'AI 기반 검색(챗GPT, 네이버 AI 등)에서 내 매장이 추천되기 위한 조건',
    category: '디지털 노출',
    relatedIndicators: ['naver_place_status', 'review_rating'],
    type: 'strategy',
  },
  {
    id: 'learn_3',
    title: '네이버 플레이스 고도화 전략',
    description: '플레이스 정보를 최적화하여 검색 노출과 클릭률을 높이는 방법',
    category: '디지털 노출',
    relatedIndicators: ['naver_place_status'],
    type: 'guide',
  },
  {
    id: 'learn_4',
    title: '당근비즈니스 활용법',
    description: '당근마켓 비즈니스 프로필을 활용한 지역 고객 확보 전략',
    category: '고객 유입',
    relatedIndicators: ['commercial_traffic', 'main_customer'],
    type: 'guide',
  },
  {
    id: 'learn_5',
    title: '리텐션(재방문) 자동화 전략',
    description: '재방문 고객을 자동으로 관리하고 유도하는 시스템 구축 방법',
    category: '재방문',
    relatedIndicators: ['revisit_rate'],
    type: 'strategy',
  },
  {
    id: 'learn_6',
    title: '인플루언서 협업 전략',
    description: '음식점에 적합한 인플루언서 협업 방법과 ROI 측정',
    category: '마케팅',
    relatedIndicators: ['review_rating', 'delivery_app_exposure'],
    type: 'strategy',
  },
  {
    id: 'learn_7',
    title: '슬로우데이 이벤트 전략',
    description: '비수 시간대/요일 매출을 올리기 위한 이벤트 설계 방법',
    category: '매출 최적화',
    relatedIndicators: ['sales_time_diff', 'avg_spending_per_customer'],
    type: 'strategy',
  },
  {
    id: 'learn_8',
    title: '메뉴 데이터 구조화 가이드',
    description: '메뉴 정보를 체계적으로 관리하여 온라인 노출을 최적화하는 방법',
    category: '상품 관리',
    relatedIndicators: ['menu_competitiveness', 'menu_cost_rate'],
    type: 'guide',
  },
  {
    id: 'learn_9',
    title: '객단가 향상 전략',
    description: '세트메뉴, 사이드 추천, 업셀링으로 객단가를 높이는 실전 방법',
    category: '수익성',
    relatedIndicators: ['avg_spending_per_customer', 'menu_competitiveness'],
    type: 'strategy',
  },
  {
    id: 'learn_10',
    title: '리뷰 관리 완전 가이드',
    description: '리뷰 요청부터 부정 리뷰 대응까지 체계적인 리뷰 관리법',
    category: '리뷰/평판',
    relatedIndicators: ['review_rating'],
    type: 'guide',
  },
]

export function getLearningByIndicator(indicator: RestaurantIndicatorId): LearningContent[] {
  return LEARNING_CONTENTS.filter(c => c.relatedIndicators.includes(indicator))
}
