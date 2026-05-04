import { Industry, Stage, Area } from './types'

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
