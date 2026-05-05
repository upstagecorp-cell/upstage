import { Industry, Stage, Area, SubIndustry, ActionType } from './types'

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

export const AREAS: Area[] = [
  { id: 'customer', label: '고객이해도', description: '타깃 고객을 얼마나 잘 이해하고 있는지', icon: '👥', color: '#6366f1' },
  { id: 'validation', label: '문제검증도', description: '실제 문제가 존재하는지 검증된 정도', icon: '✅', color: '#8b5cf6' },
  { id: 'product', label: '상품경쟁력', description: '제품/서비스의 차별성과 품질 수준', icon: '🎯', color: '#ec4899' },
  { id: 'acquisition', label: '유입구조', description: '고객을 어떻게 유입시킬지의 명확성', icon: '📣', color: '#f59e0b' },
  { id: 'revenue', label: '수익성', description: '지속 가능한 수익 구조 여부', icon: '💰', color: '#10b981' },
  { id: 'operation', label: '운영지속성', description: '장기적으로 운영 가능한 체계 여부', icon: '⚙️', color: '#3b82f6' },
  { id: 'growth', label: '성장가능성', description: '미래 성장을 위한 잠재력과 전략', icon: '📈', color: '#14b8a6' },
]

export const SUB_INDUSTRIES: SubIndustry[] = [
  // online
  { id: 'shopping', label: '쇼핑몰', parentIndustry: 'online' },
  { id: 'saas', label: 'SaaS', parentIndustry: 'online' },
  { id: 'content', label: '콘텐츠', parentIndustry: 'online' },
  { id: 'education', label: '교육', parentIndustry: 'online' },
  { id: 'marketplace', label: '마켓플레이스', parentIndustry: 'online' },
  // service
  { id: 'b2c', label: 'B2C', parentIndustry: 'service' },
  { id: 'b2b', label: 'B2B', parentIndustry: 'service' },
  { id: 'reservation', label: '예약형', parentIndustry: 'service' },
  { id: 'visit', label: '방문형', parentIndustry: 'service' },
  { id: 'subscription', label: '구독형', parentIndustry: 'service' },
  // restaurant
  { id: 'hall', label: '홀중심', parentIndustry: 'restaurant' },
  { id: 'delivery', label: '배달중심', parentIndustry: 'restaurant' },
  { id: 'takeout', label: '테이크아웃', parentIndustry: 'restaurant' },
  // cafe
  { id: 'general_cafe', label: '일반카페', parentIndustry: 'cafe' },
  { id: 'dessert', label: '디저트전문', parentIndustry: 'cafe' },
  { id: 'bakery', label: '베이커리', parentIndustry: 'cafe' },
  // accommodation
  { id: 'hotel', label: '호텔', parentIndustry: 'accommodation' },
  { id: 'pension', label: '펜션', parentIndustry: 'accommodation' },
  { id: 'airbnb', label: '에어비앤비', parentIndustry: 'accommodation' },
  { id: 'guesthouse', label: '게스트하우스', parentIndustry: 'accommodation' },
]

export const ACTION_TYPE_CONFIG: Record<ActionType, { label: string; icon: string; color: string }> = {
  research: { label: '조사형', icon: 'Search', color: 'blue' },
  create: { label: '제작형', icon: 'PenTool', color: 'purple' },
  test: { label: '테스트형', icon: 'FlaskConical', color: 'amber' },
  operate: { label: '운영형', icon: 'Settings', color: 'slate' },
  measure: { label: '측정형', icon: 'BarChart2', color: 'emerald' },
  improve: { label: '개선형', icon: 'TrendingUp', color: 'rose' },
  learn: { label: '학습형', icon: 'BookOpen', color: 'indigo' },
}

export const LEVEL_CONFIG: { level: number; label: string; requiredActions: number }[] = [
  { level: 1, label: '시작', requiredActions: 0 },
  { level: 2, label: '도전자', requiredActions: 3 },
  { level: 3, label: '실행가', requiredActions: 7 },
  { level: 4, label: '성장러', requiredActions: 12 },
  { level: 5, label: '전략가', requiredActions: 18 },
  { level: 6, label: '리더', requiredActions: 25 },
  { level: 7, label: '전문가', requiredActions: 33 },
  { level: 8, label: '혁신가', requiredActions: 40 },
  { level: 9, label: '챔피언', requiredActions: 45 },
  { level: 10, label: '마스터', requiredActions: 50 },
]
