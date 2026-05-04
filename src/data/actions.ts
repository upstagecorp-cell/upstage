import { ActionItem, AreaId } from './types'

export const ACTION_POOL: ActionItem[] = [
  // 고객이해도
  {
    id: 'act_customer_1',
    title: '잠재 고객 3명에게 연락하기',
    description: '지인이나 SNS를 통해 잠재 고객 3명을 찾아 15분 대화를 요청하세요.',
    areaId: 'customer',
    estimatedTime: '30분',
    criteria: '3명 이상에게 연락하고 최소 1명의 응답을 받으면 완료',
    nextActionId: 'act_customer_2',
    scoreImpact: 5,
  },
  {
    id: 'act_customer_2',
    title: '고객 인터뷰 1회 진행',
    description: '섭외한 잠재 고객과 15~30분 대화를 진행하고 핵심 인사이트를 메모하세요.',
    areaId: 'customer',
    estimatedTime: '1시간',
    criteria: '1회 인터뷰 완료 및 3가지 이상 인사이트 메모',
    nextActionId: 'act_customer_3',
    scoreImpact: 8,
  },
  {
    id: 'act_customer_3',
    title: '고객 페르소나 1장 작성',
    description: '인터뷰 내용을 바탕으로 이름/나이/직업/고민/목표가 담긴 1장짜리 페르소나를 만드세요.',
    areaId: 'customer',
    estimatedTime: '1시간',
    criteria: '페르소나 문서 1개 완성 (디지털 또는 종이)',
    scoreImpact: 7,
  },
  // 문제검증도
  {
    id: 'act_validation_1',
    title: '문제 검증 설문 만들기',
    description: 'Google Forms로 5문항 설문을 만들어 타깃 고객에게 배포하세요.',
    areaId: 'validation',
    estimatedTime: '1시간',
    criteria: '설문지 완성 및 링크 공유 (10명 이상)',
    nextActionId: 'act_validation_2',
    scoreImpact: 4,
  },
  {
    id: 'act_validation_2',
    title: '설문 결과 분석하기',
    description: '수집된 설문 결과에서 공통 패턴 3가지를 도출하세요.',
    areaId: 'validation',
    estimatedTime: '30분',
    criteria: '공통 패턴 3가지를 문서로 정리',
    scoreImpact: 6,
  },
  {
    id: 'act_validation_3',
    title: '작은 MVP 테스트 진행',
    description: '가장 단순한 형태로 1명에게 실제로 판매/서비스를 제공해보세요.',
    areaId: 'validation',
    estimatedTime: '반나절',
    criteria: '1명에게 실제 판매 또는 서비스 제공 완료',
    scoreImpact: 10,
  },
  // 상품경쟁력
  {
    id: 'act_product_1',
    title: '경쟁사 3곳 조사하기',
    description: '주요 경쟁사 3곳의 가격/강점/약점을 조사하여 비교표를 만드세요.',
    areaId: 'product',
    estimatedTime: '2시간',
    criteria: '3곳 비교표 완성',
    nextActionId: 'act_product_2',
    scoreImpact: 5,
  },
  {
    id: 'act_product_2',
    title: '차별화 포인트 1가지 정의하기',
    description: '경쟁사와 비교해 우리만 잘할 수 있는 1가지를 선택하고 한 문장으로 적으세요.',
    areaId: 'product',
    estimatedTime: '30분',
    criteria: '차별화 한 문장 완성',
    scoreImpact: 7,
  },
  // 유입구조
  {
    id: 'act_acquisition_1',
    title: 'SNS 계정 개설 또는 정비하기',
    description: '타깃 고객이 가장 많은 플랫폼(인스타/블로그/유튜브)에 계정을 개설하거나 프로필을 완성하세요.',
    areaId: 'acquisition',
    estimatedTime: '1시간',
    criteria: '프로필 사진/소개/링크까지 완성',
    nextActionId: 'act_acquisition_2',
    scoreImpact: 3,
  },
  {
    id: 'act_acquisition_2',
    title: '첫 번째 콘텐츠 게시하기',
    description: '고객에게 도움이 되는 짧은 글이나 이미지를 1개 올리세요.',
    areaId: 'acquisition',
    estimatedTime: '1시간',
    criteria: 'SNS에 게시물 1개 업로드',
    nextActionId: 'act_acquisition_3',
    scoreImpact: 4,
  },
  {
    id: 'act_acquisition_3',
    title: '지인 20명에게 소식 알리기',
    description: '카카오톡/문자로 지인 20명에게 오픈/서비스 소식을 개인적으로 알리세요.',
    areaId: 'acquisition',
    estimatedTime: '1시간',
    criteria: '20명 이상에게 개별 메시지 발송',
    scoreImpact: 5,
  },
  // 수익성
  {
    id: 'act_revenue_1',
    title: '월 고정비 목록 작성하기',
    description: '임대료/인건비/재료비 등 모든 월 고정 지출을 목록으로 만드세요.',
    areaId: 'revenue',
    estimatedTime: '30분',
    criteria: '고정비 목록 완성 및 합계 계산',
    nextActionId: 'act_revenue_2',
    scoreImpact: 4,
  },
  {
    id: 'act_revenue_2',
    title: '손익분기점(BEP) 계산하기',
    description: '고정비 ÷ (판매가 - 변동비) = BEP 수량을 계산하세요.',
    areaId: 'revenue',
    estimatedTime: '1시간',
    criteria: 'BEP 수량/금액 계산 완료',
    scoreImpact: 7,
  },
  // 운영지속성
  {
    id: 'act_operation_1',
    title: '하루 업무 흐름 기록하기',
    description: '오늘 하루 한 모든 업무를 시간 순서대로 기록하세요.',
    areaId: 'operation',
    estimatedTime: '30분',
    criteria: '하루 업무 타임라인 문서 완성',
    nextActionId: 'act_operation_2',
    scoreImpact: 3,
  },
  {
    id: 'act_operation_2',
    title: '핵심 반복 업무 매뉴얼 작성',
    description: '매일 반복하는 핵심 업무 1개를 5단계 매뉴얼로 작성하세요.',
    areaId: 'operation',
    estimatedTime: '1시간',
    criteria: '5단계 이상의 업무 매뉴얼 1개 완성',
    scoreImpact: 7,
  },
  // 성장가능성
  {
    id: 'act_growth_1',
    title: '30일 성장 목표 설정',
    description: '측정 가능한 30일 목표 1개를 수치로 설정하세요. (예: 매출 10% 증가)',
    areaId: 'growth',
    estimatedTime: '30분',
    criteria: '수치가 있는 30일 목표 문서 완성',
    nextActionId: 'act_growth_2',
    scoreImpact: 4,
  },
  {
    id: 'act_growth_2',
    title: '성장 가설 1개 실험 설계',
    description: '"A를 하면 B가 개선될 것이다" 형식의 가설과 실험 방법을 설계하세요.',
    areaId: 'growth',
    estimatedTime: '1시간',
    criteria: '가설 1개 + 측정 방법 문서 완성',
    scoreImpact: 6,
  },
]

export function getActionsByArea(areaId: AreaId): ActionItem[] {
  return ACTION_POOL.filter(a => a.areaId === areaId)
}

export function getActionById(id: string): ActionItem | undefined {
  return ACTION_POOL.find(a => a.id === id)
}
