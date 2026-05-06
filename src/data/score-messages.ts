import { AreaId } from './types'

export const SCORE_MESSAGES: Record<AreaId, { threshold: number; message: string }[]> = {
  customer: [
    {
      threshold: 80,
      message: '고객을 깊이 이해하고 있습니다. 페르소나가 명확하고 인터뷰 기반의 인사이트가 전략에 반영되어 있어요.',
    },
    {
      threshold: 50,
      message: '고객에 대한 기본적인 이해는 있지만, 더 많은 직접 인터뷰와 데이터가 필요합니다.',
    },
    {
      threshold: 0,
      message: '아직 타깃 고객이 명확하지 않습니다. 잠재 고객 3명에게 먼저 연락해보세요.',
    },
  ],
  validation: [
    {
      threshold: 80,
      message: '문제가 충분히 검증되었습니다. 실제 데이터와 MVP 테스트를 통해 시장의 니즈를 확인했어요.',
    },
    {
      threshold: 50,
      message: '어느 정도 검증은 됐지만, 더 다양한 고객에게 실제로 테스트해볼 필요가 있습니다.',
    },
    {
      threshold: 0,
      message: '문제 검증이 아직 부족합니다. 설문이나 인터뷰로 실제 니즈가 있는지 먼저 확인하세요.',
    },
  ],
  product: [
    {
      threshold: 80,
      message: '명확한 차별화 포인트와 경쟁 우위를 갖추고 있습니다. 고객이 선택할 이유가 분명합니다.',
    },
    {
      threshold: 50,
      message: '상품/서비스가 있지만 경쟁사 대비 차별점이 아직 약합니다. 강점을 더 날카롭게 다듬어보세요.',
    },
    {
      threshold: 0,
      message: '상품 경쟁력이 낮습니다. 경쟁사 조사와 차별화 포인트 정의부터 시작해보세요.',
    },
  ],
  acquisition: [
    {
      threshold: 80,
      message: '고객 유입 채널이 다양하고 효과적으로 작동하고 있습니다. 꾸준한 콘텐츠와 입소문이 쌓이고 있어요.',
    },
    {
      threshold: 50,
      message: '일부 채널은 있지만 유입이 안정적이지 않습니다. 채널을 강화하거나 새로운 채널을 실험해보세요.',
    },
    {
      threshold: 0,
      message: '고객이 어떻게 유입될지 아직 불명확합니다. SNS 계정 개설과 첫 콘텐츠 게시부터 시작하세요.',
    },
  ],
  revenue: [
    {
      threshold: 80,
      message: '수익 구조가 명확하고 지속 가능합니다. BEP를 초과했거나 달성 경로가 명확합니다.',
    },
    {
      threshold: 50,
      message: '수익이 발생하고 있지만 아직 안정적이지 않습니다. 고정비와 BEP를 다시 검토해보세요.',
    },
    {
      threshold: 0,
      message: '수익 구조가 불분명합니다. 고정비 목록 작성과 손익분기점 계산을 우선 진행하세요.',
    },
  ],
  operation: [
    {
      threshold: 80,
      message: '운영 체계가 잘 갖춰져 있습니다. 매뉴얼화된 프로세스 덕분에 안정적인 운영이 가능합니다.',
    },
    {
      threshold: 50,
      message: '기본 운영은 되고 있지만 일부 업무가 체계화되지 않았습니다. 핵심 반복 업무를 매뉴얼로 만들어보세요.',
    },
    {
      threshold: 0,
      message: '운영이 즉흥적으로 이루어지고 있습니다. 하루 업무 흐름 기록부터 시작해 체계를 만들어가세요.',
    },
  ],
  growth: [
    {
      threshold: 80,
      message: '명확한 성장 전략과 실험 사이클이 있습니다. 가설 기반의 빠른 실험이 성장을 가속하고 있어요.',
    },
    {
      threshold: 50,
      message: '성장에 대한 의지는 있지만 구체적인 전략이 부족합니다. 측정 가능한 목표를 먼저 설정해보세요.',
    },
    {
      threshold: 0,
      message: '성장 방향이 아직 불명확합니다. 30일 목표 설정과 성장 가설 실험 설계부터 시작하세요.',
    },
  ],
}
