import { Strategy, Resource, AreaId } from './types'

export const STRATEGIES: Strategy[] = [
  {
    id: 'str_customer_1',
    areaId: 'customer',
    title: '고객 페르소나 인터뷰',
    description: '실제 잠재 고객 10명과 1:1 인터뷰를 진행하여 고객의 진짜 needs를 발견합니다.',
    steps: [
      '인터뷰 대상 10명을 선정한다 (SNS/지인 네트워크 활용)',
      '5개 핵심 질문을 준비한다 (현재 불편함, 해결 방법, 비용 지불 의향 등)',
      '30분씩 인터뷰를 진행하고 녹음/메모한다',
      '공통 패턴 3가지를 도출한다',
      '페르소나 1장 문서를 완성한다',
    ],
  },
  {
    id: 'str_customer_2',
    areaId: 'customer',
    title: '고객 여정 지도 작성',
    description: '고객이 문제를 인식하고 구매하고 재구매하는 전체 여정을 시각화합니다.',
    steps: [
      '인식 → 검색 → 비교 → 구매 → 사용 → 재구매 단계를 나열한다',
      '각 단계에서 고객이 느끼는 감정과 장벽을 파악한다',
      '가장 큰 장벽을 제거하는 전략을 수립한다',
    ],
  },
  {
    id: 'str_validation_1',
    areaId: 'validation',
    title: '최소 기능 제품(MVP) 검증',
    description: '완벽한 제품 전에 핵심 가치만 담은 MVP로 실제 구매 의향을 검증합니다.',
    steps: [
      '핵심 가치 1가지만 담은 MVP를 정의한다',
      '10명에게 실제 돈을 받고 판매 테스트를 한다',
      '피드백을 수집하고 개선점을 도출한다',
      '재구매 의향을 확인한다',
    ],
  },
  {
    id: 'str_validation_2',
    areaId: 'validation',
    title: '사전 예약/사전 판매',
    description: '실제 오픈 전에 사전 예약을 받아 수요를 검증합니다.',
    steps: [
      '사전 예약 랜딩페이지를 만든다',
      'SNS에 홍보하고 100명에게 공유한다',
      '예약 전환율을 측정한다',
      '5% 이상이면 수요가 있다고 판단한다',
    ],
  },
  {
    id: 'str_product_1',
    areaId: 'product',
    title: '경쟁사 분석 및 차별화 포인트 도출',
    description: '주요 경쟁사 3곳을 분석하고 우리만의 차별점을 명확히 합니다.',
    steps: [
      '직접 경쟁사 3곳을 선정한다',
      '가격/품질/서비스/고객 리뷰를 분석한다',
      '우리가 더 잘할 수 있는 1가지를 선택한다',
      '차별화 한 문장을 작성한다',
    ],
  },
  {
    id: 'str_acquisition_1',
    areaId: 'acquisition',
    title: '단일 채널 집중 전략',
    description: '모든 채널을 동시에 하는 대신, 1가지 채널에 집중하여 효율을 극대화합니다.',
    steps: [
      '타깃 고객이 가장 많이 있는 채널 1개를 선택한다',
      '30일간 해당 채널에만 집중한다',
      '주간 결과를 측정한다',
      '효과가 있으면 스케일업, 없으면 다른 채널로 전환한다',
    ],
  },
  {
    id: 'str_revenue_1',
    areaId: 'revenue',
    title: '단위 경제 계산',
    description: 'CAC, LTV, 마진율을 정확히 계산하여 수익성을 진단합니다.',
    steps: [
      '최근 3개월 마케팅 비용 합산 ÷ 신규 고객 수 = CAC를 계산한다',
      '고객 1명의 평균 구매 금액 × 마진율 × 구매 횟수 = LTV를 계산한다',
      'LTV/CAC 비율이 3 이상이면 건강한 구조다',
      '개선 목표를 설정한다',
    ],
  },
  {
    id: 'str_operation_1',
    areaId: 'operation',
    title: '핵심 업무 매뉴얼화',
    description: '반복되는 핵심 업무를 문서화하여 위임과 확장을 가능하게 합니다.',
    steps: [
      '하루 업무를 시간 순서로 기록한다',
      '반복되는 업무를 5~7단계로 정리한다',
      '각 단계를 사진/영상으로 문서화한다',
      '새로운 사람에게 전달하고 완료 여부를 확인한다',
    ],
  },
  {
    id: 'str_growth_1',
    areaId: 'growth',
    title: '90일 성장 목표 설정',
    description: '측정 가능한 90일 목표를 설정하고 주간 진도를 추적합니다.',
    steps: [
      '핵심 지표(매출/고객 수/재구매율 등) 1개를 선택한다',
      '현재 수치를 측정한다',
      '90일 후 목표 수치를 설정한다',
      '주간 마일스톤을 설정한다',
      '매주 실제 vs 목표를 비교한다',
    ],
  },
  {
    id: 'str_growth_2',
    areaId: 'growth',
    title: '레퍼럴 프로그램 구축',
    description: '기존 고객이 새 고객을 데려오는 바이럴 구조를 만듭니다.',
    steps: [
      '추천 인센티브를 설계한다 (양쪽 모두 혜택)',
      '간단한 추천 코드/링크 시스템을 만든다',
      '만족도 높은 고객 상위 20%에게 먼저 제안한다',
      '전환율을 측정하고 인센티브를 최적화한다',
    ],
  },
]

export const RESOURCES: Resource[] = [
  { id: 'res_1', areaId: 'customer', title: '고객 인터뷰 완벽 가이드', description: '스타트업에서 검증한 고객 인터뷰 방법론 총정리', type: 'article' },
  { id: 'res_2', areaId: 'customer', title: '페르소나 템플릿', description: '바로 사용 가능한 고객 페르소나 작성 양식', type: 'template' },
  { id: 'res_3', areaId: 'validation', title: 'The Mom Test', description: '고객이 거짓말을 못하게 하는 인터뷰 기법', type: 'article' },
  { id: 'res_4', areaId: 'validation', title: '린 스타트업 방법론', description: 'Build-Measure-Learn 사이클로 빠른 검증하기', type: 'article' },
  { id: 'res_5', areaId: 'product', title: '가치 제안 캔버스', description: '고객 문제와 제품 솔루션을 맞추는 프레임워크', type: 'tool' },
  { id: 'res_6', areaId: 'product', title: '경쟁사 분석 템플릿', description: '체계적인 경쟁사 비교 분석 양식', type: 'template' },
  { id: 'res_7', areaId: 'acquisition', title: '디지털 마케팅 채널 가이드', description: 'SNS/SEO/광고 채널별 특성과 활용법', type: 'article' },
  { id: 'res_8', areaId: 'acquisition', title: '퍼널 최적화 실전 가이드', description: '인지 → 관심 → 구매 단계별 최적화 방법', type: 'article' },
  { id: 'res_9', areaId: 'revenue', title: '단위 경제 계산기', description: 'CAC, LTV, BEP를 쉽게 계산하는 스프레드시트', type: 'tool' },
  { id: 'res_10', areaId: 'revenue', title: '가격 전략 프레임워크', description: '가치 기반 가격 설정 방법론', type: 'article' },
  { id: 'res_11', areaId: 'operation', title: '업무 매뉴얼 작성 템플릿', description: 'SOP 문서 작성을 위한 기본 양식', type: 'template' },
  { id: 'res_12', areaId: 'operation', title: '시간 관리 매트릭스', description: '긴급/중요도 기반의 업무 우선순위 정하기', type: 'article' },
  { id: 'res_13', areaId: 'growth', title: 'OKR 설정 가이드', description: '목표와 핵심 결과를 통한 성장 관리', type: 'article' },
  { id: 'res_14', areaId: 'growth', title: '그로스 해킹 사례집', description: '스타트업 성장 전략 실제 사례 모음', type: 'article' },
]

export function getStrategiesByArea(areaId: AreaId): Strategy[] {
  return STRATEGIES.filter(s => s.areaId === areaId)
}

export function getResourcesByArea(areaId: AreaId): Resource[] {
  return RESOURCES.filter(r => r.areaId === areaId)
}
