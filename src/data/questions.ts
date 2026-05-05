import { Question, IndustryId, StageId, SubIndustryId } from './types'

const commonQuestions: Question[] = [
  {
    id: 'common_1',
    text: '당신의 핵심 고객은 누구인가요?',
    why: '고객을 구체적으로 정의하지 않으면 마케팅, 상품, 운영 모두 방향을 잃습니다. 성공한 사업은 "모든 사람"이 아닌 "특정 누군가"를 위해 만들어졌습니다.',
    areaId: 'customer',
    improvementHint: '고객 페르소나를 1명 구체적으로 정의하면 마케팅 효율이 2~3배 높아집니다.',
    options: [
      { label: '구체적으로 정의되어 있다 (나이/직업/라이프스타일까지)', score: 10, interpretation: '탁월합니다. 고객 이해가 사업의 나침반이 됩니다.' },
      { label: '대략적으로 알고 있다 (연령대/성별 정도)', score: 6, interpretation: '출발점은 있지만, 더 깊이 이해할 필요가 있습니다.' },
      { label: '막연하게 생각하고 있다', score: 3, interpretation: '고객 정의가 불명확하면 모든 투자가 비효율적이 됩니다.' },
      { label: '아직 생각해보지 않았다', score: 0, interpretation: '이것이 가장 먼저 해야 할 일입니다.' },
    ],
  },
  {
    id: 'common_2',
    text: '고객이 지금 겪는 가장 큰 불편함을 직접 들어본 적 있나요?',
    why: '내 생각이 아닌 고객의 실제 말로 문제를 확인해야 합니다. 직접 들어본 피드백만이 진짜 수요를 증명합니다.',
    areaId: 'validation',
    improvementHint: '10명에게 직접 인터뷰하면 검증도 점수가 크게 오릅니다.',
    options: [
      { label: '10명 이상 인터뷰/설문을 했다', score: 10, interpretation: '검증 기반이 탄탄합니다. 데이터 기반 사업의 시작입니다.' },
      { label: '3~9명에게 이야기를 들었다', score: 7, interpretation: '좋은 시작이지만 샘플이 더 필요합니다.' },
      { label: '1~2명에게만 물어봤다', score: 4, interpretation: '편향될 수 있습니다. 더 다양한 의견이 필요합니다.' },
      { label: '아직 직접 물어본 적 없다', score: 0, interpretation: '가정만으로는 위험합니다. 지금 당장 물어보세요.' },
    ],
  },
  {
    id: 'common_3',
    text: '경쟁자 대비 우리만의 차별점은 무엇인가요?',
    why: '고객이 경쟁자 대신 당신을 선택해야 하는 이유가 명확해야 합니다. 차별점이 없으면 가격 경쟁만 남습니다.',
    areaId: 'product',
    improvementHint: '차별점을 한 문장으로 표현할 수 있을 때 경쟁력이 생깁니다.',
    options: [
      { label: '고객도 인정하는 명확한 차별점이 있다', score: 10, interpretation: '핵심 경쟁력을 보유하고 있습니다.' },
      { label: '차별점은 있지만 고객 반응은 모른다', score: 6, interpretation: '내부 확신이 고객 검증으로 이어져야 합니다.' },
      { label: '생각은 있지만 말로 설명하기 어렵다', score: 3, interpretation: '말로 못하면 마케팅도 할 수 없습니다.' },
      { label: '특별한 차별점이 없다', score: 0, interpretation: '지금 가장 긴급한 과제입니다.' },
    ],
  },
  {
    id: 'common_4',
    text: '신규 고객을 어떻게 확보할 계획인가요?',
    why: '좋은 상품도 사람들이 알지 못하면 팔리지 않습니다. 체계적인 고객 유입 전략이 없으면 우연에만 의존하게 됩니다.',
    areaId: 'acquisition',
    improvementHint: '하나의 주력 채널을 선택해 집중하면 효과가 빠릅니다.',
    options: [
      { label: '구체적인 채널과 예산 계획이 있다', score: 10, interpretation: '체계적인 성장 기반이 갖춰져 있습니다.' },
      { label: '몇 가지 방법을 생각해두었다', score: 6, interpretation: '구체화가 필요합니다. 어떤 채널이 우선인지 결정하세요.' },
      { label: '입소문에 주로 의존할 계획이다', score: 3, interpretation: '입소문은 불확실합니다. 적극적인 유입 전략이 필요합니다.' },
      { label: '아직 생각해보지 않았다', score: 0, interpretation: '고객 없이는 사업도 없습니다. 지금 시작하세요.' },
    ],
  },
  {
    id: 'common_5',
    text: '한 달에 필요한 최소 매출(손익분기점)을 계산해봤나요?',
    why: '얼마를 벌어야 살아남을 수 있는지 모르면 목표도 전략도 없는 상태입니다. BEP(손익분기점)은 모든 수익 전략의 출발점입니다.',
    areaId: 'revenue',
    improvementHint: '고정비를 정확히 파악하고 BEP를 계산하면 수익성 전략이 명확해집니다.',
    options: [
      { label: '계산했고 달성 전략도 있다', score: 10, interpretation: '재무적으로 탄탄한 기반을 갖추고 있습니다.' },
      { label: '대략 알고 있다', score: 6, interpretation: '정확한 숫자로 다시 검토해보세요.' },
      { label: '막연히 생각만 해봤다', score: 3, interpretation: '숫자로 확인하지 않으면 계획이 아닙니다.' },
      { label: '아직 계산해보지 않았다', score: 0, interpretation: '지금 당장 계산이 필요합니다.' },
    ],
  },
  {
    id: 'common_6',
    text: '혼자 아프거나 바쁠 때도 사업이 돌아갈 수 있나요?',
    why: '창업자 1인에 모든 것이 집중되면 지속가능하지 않습니다. 시스템과 매뉴얼이 있어야 진정한 사업이 됩니다.',
    areaId: 'operation',
    improvementHint: '핵심 업무를 매뉴얼화하면 위임과 확장이 가능해집니다.',
    options: [
      { label: '대리인이 있고 운영 매뉴얼도 있다', score: 10, interpretation: '시스템 기반의 안정적인 운영 구조입니다.' },
      { label: '누군가 있지만 내가 없으면 문제가 생긴다', score: 6, interpretation: '핵심 업무의 문서화가 필요합니다.' },
      { label: '나 혼자만 알고 있다', score: 3, interpretation: '위험한 구조입니다. 매뉴얼화를 시작하세요.' },
      { label: '전혀 안 된다', score: 0, interpretation: '당장 운영 체계 구축이 필요합니다.' },
    ],
  },
  {
    id: 'common_7',
    text: '1년 후 사업이 지금보다 2배 커질 구체적인 계획이 있나요?',
    why: '성장 없이는 시장 변화에 도태됩니다. 구체적인 성장 계획은 방향성과 동기를 동시에 제공합니다.',
    areaId: 'growth',
    improvementHint: '성장 목표를 수치화하고 분기별 마일스톤을 설정하면 실행력이 높아집니다.',
    options: [
      { label: '수치화된 목표와 실행 계획이 있다', score: 10, interpretation: '성장을 위한 준비가 되어 있습니다.' },
      { label: '방향은 있지만 구체적이지 않다', score: 6, interpretation: '방향을 숫자로 바꾸는 것이 다음 단계입니다.' },
      { label: '막연하게 더 잘 될 것 같다', score: 3, interpretation: '희망은 전략이 아닙니다. 계획을 세우세요.' },
      { label: '당장 유지도 버겁다', score: 0, interpretation: '현재 문제 해결이 먼저입니다.' },
    ],
  },
]

const restaurantQuestions: Question[] = [
  {
    id: 'rest_1',
    text: '메뉴 개발 시 고객 테스트를 해봤나요?',
    why: '요리사가 맛있다고 생각하는 메뉴와 고객이 지갑을 여는 메뉴는 다릅니다. 실제 고객 피드백이 메뉴 성공의 핵심입니다.',
    areaId: 'product',
    improvementHint: '10명에게 무료 시식 테스트를 하면 메뉴 경쟁력이 빠르게 검증됩니다.',
    options: [
      { label: '다수의 고객 피드백으로 메뉴를 수정했다', score: 10, interpretation: '고객 중심의 메뉴 개발입니다.' },
      { label: '일부 지인에게만 맛을 봤다', score: 5, interpretation: '지인은 솔직한 피드백을 주기 어렵습니다.' },
      { label: '내 판단으로만 결정했다', score: 2, interpretation: '고객 테스트가 시급합니다.' },
      { label: '아직 메뉴가 확정되지 않았다', score: 0, interpretation: '메뉴 확정이 가장 먼저입니다.' },
    ],
  },
  {
    id: 'rest_2',
    text: '상권 분석(유동인구, 경쟁업체, 임대료)을 해봤나요?',
    why: '같은 메뉴도 상권에 따라 성패가 갈립니다. 유동인구와 경쟁 구도를 모르면 입지 결정이 도박이 됩니다.',
    areaId: 'validation',
    improvementHint: '소상공인시장진흥공단 상권분석 서비스를 활용하면 무료로 분석할 수 있습니다.',
    options: [
      { label: '정식 상권 분석 보고서를 만들었다', score: 10, interpretation: '데이터 기반의 입지 선택입니다.' },
      { label: '직접 현장 조사를 해봤다', score: 7, interpretation: '좋은 접근이지만 데이터로 보완하세요.' },
      { label: '느낌상 좋아 보인다', score: 2, interpretation: '직관만으로는 위험합니다.' },
      { label: '아직 상권을 정하지 않았다', score: 0, interpretation: '상권 분석 후 입지를 결정하세요.' },
    ],
  },
  {
    id: 'rest_3',
    text: '테이블 회전율과 객단가 목표가 있나요?',
    why: '음식점 수익성은 회전율 × 객단가 × 영업일수로 결정됩니다. 이 숫자를 모르면 수익 예측이 불가능합니다.',
    areaId: 'revenue',
    improvementHint: '목표 회전율과 객단가를 설정하면 마케팅과 메뉴 전략이 명확해집니다.',
    options: [
      { label: '구체적인 수치 목표와 달성 전략이 있다', score: 10, interpretation: '수익 구조를 명확히 이해하고 있습니다.' },
      { label: '대략적인 목표는 있다', score: 6, interpretation: '더 구체적인 수치로 정리해보세요.' },
      { label: '잘 모르겠다', score: 2, interpretation: '매출 구조 계산이 필요합니다.' },
      { label: '생각해본 적 없다', score: 0, interpretation: '기본 재무 설계부터 시작하세요.' },
    ],
  },
]

const cafeQuestions: Question[] = [
  {
    id: 'cafe_1',
    text: '카페의 핵심 경험(시그니처)은 무엇인가요?',
    why: '커피 맛만으로는 경쟁에서 살아남기 어렵습니다. 고객이 "이 카페만의 것"이라고 느끼는 경험이 재방문을 만듭니다.',
    areaId: 'product',
    improvementHint: '시그니처 메뉴 1개와 공간 콘셉트 1개를 명확히 정의하세요.',
    options: [
      { label: '명확한 시그니처와 브랜드 스토리가 있다', score: 10, interpretation: '강력한 브랜드 아이덴티티입니다.' },
      { label: '대략적인 콘셉트는 있다', score: 6, interpretation: '더 구체적인 차별화가 필요합니다.' },
      { label: '좋은 커피와 인테리어가 전부다', score: 3, interpretation: '기준점을 더 높여야 합니다.' },
      { label: '아직 정하지 않았다', score: 0, interpretation: '핵심 콘셉트 정립이 먼저입니다.' },
    ],
  },
  {
    id: 'cafe_2',
    text: '소셜미디어 마케팅 전략이 있나요?',
    why: '카페는 인스타그램/틱톡 등 비주얼 플랫폼의 영향이 매우 큽니다. 온라인 존재감 없이는 신규 고객 유입이 어렵습니다.',
    areaId: 'acquisition',
    improvementHint: '인스타그램 계정 개설 후 오픈 전부터 콘텐츠를 올리면 초기 팔로워를 확보할 수 있습니다.',
    options: [
      { label: 'SNS 계정 운영 중이고 팔로워도 있다', score: 10, interpretation: '디지털 마케팅 기반이 있습니다.' },
      { label: '계정은 있지만 거의 안 올린다', score: 5, interpretation: '꾸준한 콘텐츠 운영이 필요합니다.' },
      { label: '오픈 후 시작할 예정이다', score: 2, interpretation: '오픈 전부터 시작하는 게 효과적입니다.' },
      { label: 'SNS는 잘 모른다', score: 0, interpretation: '기초 SNS 마케팅 학습이 필요합니다.' },
    ],
  },
  {
    id: 'cafe_3',
    text: '임대료가 예상 매출의 몇 %를 차지하나요?',
    why: '카페는 임대료가 수익성에 가장 큰 영향을 미칩니다. 일반적으로 매출의 10~15%를 넘으면 지속이 어렵습니다.',
    areaId: 'revenue',
    improvementHint: '임대료 비율을 10% 이하로 낮추거나, 매출을 높이는 전략을 병행하세요.',
    options: [
      { label: '10% 이하', score: 10, interpretation: '건강한 임대료 비율입니다.' },
      { label: '10~15%', score: 7, interpretation: '적정 범위지만 최적화를 고려하세요.' },
      { label: '15~20%', score: 4, interpretation: '위험 신호입니다. 매출 증대가 시급합니다.' },
      { label: '20% 이상 또는 모르겠다', score: 0, interpretation: '즉각적인 재무 검토가 필요합니다.' },
    ],
  },
]

const accommodationQuestions: Question[] = [
  {
    id: 'acc_1',
    text: '주요 예약 채널(OTA/직예약)은 어디인가요?',
    why: '숙박업의 객실 점유율은 예약 채널 전략에 달려 있습니다. OTA 수수료 vs 직예약 수익성의 균형이 핵심입니다.',
    areaId: 'acquisition',
    improvementHint: '직예약 채널을 강화하면 OTA 수수료를 줄이고 수익성을 높일 수 있습니다.',
    options: [
      { label: '다양한 채널을 최적화하여 운영 중', score: 10, interpretation: '체계적인 채널 전략입니다.' },
      { label: 'OTA 1~2개를 활용 중', score: 6, interpretation: '채널 다각화를 고려해보세요.' },
      { label: '입소문과 SNS에만 의존', score: 3, interpretation: '안정적인 예약 채널 구축이 필요합니다.' },
      { label: '아직 결정하지 못했다', score: 0, interpretation: '채널 전략 수립이 시급합니다.' },
    ],
  },
  {
    id: 'acc_2',
    text: '비수기 대비 전략이 있나요?',
    why: '숙박업은 계절성이 강합니다. 비수기 전략 없이는 연간 수익성 유지가 어렵습니다.',
    areaId: 'revenue',
    improvementHint: '비수기 특가 패키지나 장기 투숙 할인을 도입하면 점유율을 높일 수 있습니다.',
    options: [
      { label: '비수기 전략(패키지/할인/부가서비스)이 있다', score: 10, interpretation: '연간 안정적인 수익이 기대됩니다.' },
      { label: '몇 가지 아이디어는 있다', score: 5, interpretation: '구체적인 실행 계획으로 발전시키세요.' },
      { label: '비수기엔 쉬는 게 낫다고 생각한다', score: 2, interpretation: '고정비는 비수기에도 발생합니다.' },
      { label: '생각해보지 않았다', score: 0, interpretation: '비수기 전략 수립이 필요합니다.' },
    ],
  },
  {
    id: 'acc_3',
    text: '숙박 후기 관리를 하고 있나요?',
    why: '숙박업에서 온라인 리뷰는 예약 결정의 70% 이상에 영향을 미칩니다. 후기 관리는 마케팅의 핵심입니다.',
    areaId: 'customer',
    improvementHint: '퇴실 시 후기 요청 카드를 제공하고, 모든 후기에 24시간 내 답변하는 시스템을 만드세요.',
    options: [
      { label: '모든 후기에 응대하고 개선에 반영한다', score: 10, interpretation: '훌륭한 고객 관계 관리입니다.' },
      { label: '부정적인 후기에만 답변한다', score: 5, interpretation: '긍정적 후기 답변도 마케팅 효과가 있습니다.' },
      { label: '후기는 보지만 답변은 안 한다', score: 2, interpretation: '적극적인 후기 관리가 필요합니다.' },
      { label: '후기 관리를 안 한다', score: 0, interpretation: '즉시 후기 관리 시스템을 만드세요.' },
    ],
  },
]

const serviceQuestions: Question[] = [
  {
    id: 'svc_1',
    text: '서비스 가격 책정 근거가 있나요?',
    why: '가격은 가치의 신호입니다. 원가 기반도 아니고 경쟁사 따라가기도 아닌, 고객 가치 기반의 가격 전략이 수익성을 만듭니다.',
    areaId: 'revenue',
    improvementHint: '경쟁사 대비 가치 차별점을 기준으로 프리미엄 가격 책정을 고려해보세요.',
    options: [
      { label: '가치 기반 가격 전략이 있다', score: 10, interpretation: '수익성 있는 가격 구조입니다.' },
      { label: '경쟁사 가격을 참고했다', score: 6, interpretation: '차별화된 가치를 가격에 반영해보세요.' },
      { label: '원가에 마진만 붙였다', score: 3, interpretation: '가치 기반 가격 재검토가 필요합니다.' },
      { label: '가격이 아직 미정이다', score: 0, interpretation: '가격 전략 수립이 시급합니다.' },
    ],
  },
  {
    id: 'svc_2',
    text: '재구매율(재방문/재계약) 데이터가 있나요?',
    why: '서비스업에서 재구매율은 만족도의 핵심 지표입니다. 신규 고객 획득보다 기존 고객 유지가 5배 저렴합니다.',
    areaId: 'customer',
    improvementHint: '고객 만족도 조사를 정기적으로 실시하고 재구매 인센티브를 만드세요.',
    options: [
      { label: '60% 이상의 재구매율을 달성하고 있다', score: 10, interpretation: '탁월한 고객 만족도입니다.' },
      { label: '30~60% 수준이다', score: 6, interpretation: '개선의 여지가 있습니다.' },
      { label: '30% 미만이다', score: 3, interpretation: '서비스 품질 또는 후속 관리 개선이 필요합니다.' },
      { label: '데이터가 없다', score: 1, interpretation: '지금부터라도 추적을 시작하세요.' },
    ],
  },
  {
    id: 'svc_3',
    text: '서비스 제공 프로세스가 표준화되어 있나요?',
    why: '표준화된 프로세스는 서비스 품질의 일관성을 보장하고, 확장 시 새로운 직원에게 업무를 전달할 수 있게 합니다.',
    areaId: 'operation',
    improvementHint: '핵심 서비스 단계를 5~7단계로 정리한 SOP 문서를 만드세요.',
    options: [
      { label: '표준 운영 절차(SOP)가 문서화되어 있다', score: 10, interpretation: '확장 가능한 운영 구조입니다.' },
      { label: '머릿속에는 있지만 문서화 안 됨', score: 5, interpretation: '문서화가 다음 단계입니다.' },
      { label: '케이스마다 다르게 대응한다', score: 2, interpretation: '표준화로 품질을 안정시키세요.' },
      { label: '아직 초기라 없다', score: 0, interpretation: '초기부터 표준화하는 것이 중요합니다.' },
    ],
  },
]

const onlineQuestions: Question[] = [
  {
    id: 'online_1',
    text: '월간 활성 사용자(MAU)나 일간 방문자 데이터가 있나요?',
    why: '온라인 사업에서 트래픽 데이터는 성장의 체온계입니다. 측정하지 않으면 무엇을 개선해야 할지 알 수 없습니다.',
    areaId: 'customer',
    improvementHint: 'Google Analytics를 설치하고 주간 데이터 리뷰를 루틴으로 만드세요.',
    options: [
      { label: '정기적으로 추적하고 분석한다', score: 10, interpretation: '데이터 기반 운영입니다.' },
      { label: '가끔 확인한다', score: 5, interpretation: '정기 리뷰 루틴을 만드세요.' },
      { label: '데이터는 있지만 분석을 안 한다', score: 3, interpretation: '수집한 데이터를 활용하세요.' },
      { label: '데이터 추적 자체가 없다', score: 0, interpretation: '즉시 분석 도구 설치가 필요합니다.' },
    ],
  },
  {
    id: 'online_2',
    text: '고객 획득 비용(CAC)과 생애 가치(LTV)를 알고 있나요?',
    why: 'LTV > CAC 이어야 온라인 사업이 지속 가능합니다. 이 두 숫자를 모르면 광고비 투자 결정을 할 수 없습니다.',
    areaId: 'revenue',
    improvementHint: 'CAC = 마케팅 총비용 / 신규 고객 수. 이것부터 계산해보세요.',
    options: [
      { label: '두 수치 모두 알고 최적화 중', score: 10, interpretation: '수익성 있는 성장 구조입니다.' },
      { label: '대략적으로는 알고 있다', score: 6, interpretation: '정확한 계산으로 더 세밀한 전략을 세우세요.' },
      { label: '한 가지만 알고 있다', score: 3, interpretation: '두 수치 모두 파악이 필요합니다.' },
      { label: '모른다', score: 0, interpretation: '온라인 사업의 필수 지표입니다. 지금 계산하세요.' },
    ],
  },
  {
    id: 'online_3',
    text: '제품/서비스의 온보딩 완료율은 어떤가요?',
    why: '신규 사용자가 처음 가치를 경험하는 순간이 성패를 좌우합니다. 온보딩 이탈이 높으면 모든 유입 비용이 낭비됩니다.',
    areaId: 'product',
    improvementHint: '첫 3분 안에 핵심 가치를 경험하게 하는 온보딩 플로우를 설계하세요.',
    options: [
      { label: '70% 이상 완료한다', score: 10, interpretation: '훌륭한 초기 사용자 경험입니다.' },
      { label: '40~70% 수준이다', score: 6, interpretation: '개선 포인트를 찾아 A/B 테스트를 해보세요.' },
      { label: '40% 미만이다', score: 2, interpretation: '온보딩 개선이 가장 긴급한 과제입니다.' },
      { label: '측정하지 않는다', score: 0, interpretation: '먼저 측정 시스템을 갖추세요.' },
    ],
  },
  {
    id: 'online_4',
    text: 'SEO 또는 콘텐츠 마케팅 전략이 있나요?',
    why: '유료 광고에만 의존하면 비용이 계속 증가합니다. 검색/콘텐츠를 통한 자연 유입이 장기적 경쟁력입니다.',
    areaId: 'acquisition',
    improvementHint: '주 1회 블로그 포스팅으로 SEO를 시작하면 6개월 후 효과가 나타납니다.',
    options: [
      { label: '체계적인 SEO/콘텐츠 전략이 있다', score: 10, interpretation: '지속 가능한 성장 채널을 구축했습니다.' },
      { label: '가끔 글을 올린다', score: 5, interpretation: '일관된 주기로 더 효과적입니다.' },
      { label: '유료 광고에만 집중한다', score: 3, interpretation: '자연 유입 채널 구축을 병행하세요.' },
      { label: '아무것도 안 한다', score: 0, interpretation: '콘텐츠 마케팅을 시작할 때입니다.' },
    ],
  },
]

const otherQuestions: Question[] = [
  {
    id: 'other_1',
    text: '이 사업이 해결하는 문제를 한 문장으로 말할 수 있나요?',
    why: '핵심 가치 제안(Value Proposition)을 명확히 할 수 없다면 고객도, 투자자도, 직원도 설득할 수 없습니다.',
    areaId: 'validation',
    improvementHint: '"[타깃]이 [문제]를 해결하기 위한 [해결책]"의 형식으로 한 문장을 만들어보세요.',
    options: [
      { label: '명확하고 간결하게 말할 수 있다', score: 10, interpretation: '강력한 사업의 시작입니다.' },
      { label: '설명하면 이해하지만 한 문장이 어렵다', score: 6, interpretation: '단순화 작업이 필요합니다.' },
      { label: '설명해도 잘 이해 못한다', score: 2, interpretation: '핵심 가치 재정의가 필요합니다.' },
      { label: '나도 아직 명확하지 않다', score: 0, interpretation: '가장 먼저 해결해야 할 과제입니다.' },
    ],
  },
  {
    id: 'other_2',
    text: '수익 모델(어떻게 돈을 버는지)이 명확한가요?',
    why: '좋은 아이디어도 수익 모델 없이는 사업이 아닙니다. 어떻게 지속적으로 돈을 버는지가 명확해야 합니다.',
    areaId: 'revenue',
    improvementHint: '단일 수익원보다 2~3개 수익원을 결합하면 안정성이 높아집니다.',
    options: [
      { label: '여러 수익 모델을 검토하고 최적을 선택했다', score: 10, interpretation: '탄탄한 수익 구조입니다.' },
      { label: '한 가지 수익 모델만 있다', score: 6, interpretation: '추가 수익 모델을 탐색해보세요.' },
      { label: '생각은 있지만 검증은 안 됐다', score: 3, interpretation: '소규모 검증부터 시작하세요.' },
      { label: '아직 모른다', score: 0, interpretation: '수익 모델 없는 사업은 취미입니다.' },
    ],
  },
  {
    id: 'other_3',
    text: '운영 자금(최소 6개월치)이 확보되어 있나요?',
    why: '대부분의 사업은 현금이 마르기 때문에 실패합니다. 초기 6개월은 수익 없이도 운영 가능한 현금이 필요합니다.',
    areaId: 'operation',
    improvementHint: '월 고정비 × 6개월치 금액을 별도 계좌에 분리해두세요.',
    options: [
      { label: '6개월 이상 운영 자금이 있다', score: 10, interpretation: '안정적인 재정 기반입니다.' },
      { label: '3~6개월치는 있다', score: 6, interpretation: '추가 자금 확보 계획을 세우세요.' },
      { label: '1~3개월치만 있다', score: 3, interpretation: '긴급하게 자금 계획을 세워야 합니다.' },
      { label: '현재 자금이 거의 없다', score: 0, interpretation: '자금 확보 전 오픈은 매우 위험합니다.' },
    ],
  },
]

export const QUESTIONS_BY_INDUSTRY: Record<IndustryId, Question[]> = {
  restaurant: [...commonQuestions, ...restaurantQuestions],
  cafe: [...commonQuestions, ...cafeQuestions],
  accommodation: [...commonQuestions, ...accommodationQuestions],
  service: [...commonQuestions, ...serviceQuestions],
  online: [...commonQuestions, ...onlineQuestions],
  other: [...commonQuestions, ...otherQuestions],
}

const contextualQuestions: Question[] = [
  {
    id: 'ctx_saas_activation',
    text: '신규 사용자가 첫 가치를 경험하는 핵심 행동을 정의했나요?',
    why: 'SaaS는 가입보다 활성화가 중요합니다. 사용자가 처음으로 가치를 느끼는 행동이 명확해야 온보딩과 제품 개선의 기준을 잡을 수 있습니다.',
    areaId: 'product',
    subIndustryFilter: ['saas'],
    improvementHint: '첫 가치 행동을 1개로 정하고, 가입 후 10분 안에 그 행동을 하도록 온보딩을 줄여보세요.',
    options: [
      { label: '핵심 행동과 측정 지표가 명확하다', score: 10, interpretation: '제품 개선의 기준이 명확한 상태입니다.' },
      { label: '대략적인 행동은 있지만 지표가 없다', score: 6, interpretation: '좋은 출발이지만 측정 기준이 필요합니다.' },
      { label: '여러 행동이 섞여 있어 하나로 말하기 어렵다', score: 3, interpretation: '온보딩이 흐려질 수 있는 상태입니다.' },
      { label: '아직 정의하지 않았다', score: 0, interpretation: '제품 진단에서 먼저 잡아야 할 핵심 과제입니다.' },
    ],
  },
  {
    id: 'ctx_shopping_repeat',
    text: '재구매를 유도하는 상품/쿠폰/메시지 흐름이 있나요?',
    why: '쇼핑몰은 첫 구매보다 반복 구매 구조가 수익성을 좌우합니다. 재구매 흐름이 없으면 광고비 의존도가 계속 높아집니다.',
    areaId: 'growth',
    subIndustryFilter: ['shopping'],
    improvementHint: '구매 후 7일 이내 재구매 메시지와 추천 상품 1개를 연결해보세요.',
    options: [
      { label: '구매 후 재구매 흐름을 자동으로 운영한다', score: 10, interpretation: '반복 매출을 만들 기반이 있습니다.' },
      { label: '가끔 쿠폰이나 메시지를 보낸다', score: 6, interpretation: '루틴화하면 더 강해질 수 있습니다.' },
      { label: '아이디어만 있고 실행하지 않았다', score: 3, interpretation: '성장 구조가 아직 약합니다.' },
      { label: '재구매를 고려하지 않았다', score: 0, interpretation: '광고 효율이 악화될 위험이 큽니다.' },
    ],
  },
  {
    id: 'ctx_delivery_platform',
    text: '배달앱 노출, 리뷰, 대표 메뉴 사진을 주기적으로 관리하나요?',
    why: '배달 중심 매장은 플랫폼 내 노출 품질이 유입과 전환을 직접 좌우합니다. 메뉴 사진과 리뷰 관리는 매장 앞 유동인구만큼 중요합니다.',
    areaId: 'acquisition',
    subIndustryFilter: ['delivery'],
    improvementHint: '대표 메뉴 사진 3개와 최근 리뷰 답변 상태를 먼저 점검하세요.',
    options: [
      { label: '주 1회 이상 노출/리뷰/사진을 점검한다', score: 10, interpretation: '배달 유입 관리가 체계적입니다.' },
      { label: '문제가 생길 때만 확인한다', score: 6, interpretation: '정기 점검 루틴이 필요합니다.' },
      { label: '거의 관리하지 않는다', score: 2, interpretation: '플랫폼 전환율 손실이 생길 수 있습니다.' },
      { label: '배달앱 전략이 없다', score: 0, interpretation: '유입 구조를 다시 세워야 합니다.' },
    ],
  },
  {
    id: 'ctx_preopen_launch',
    text: '오픈 전 첫 고객을 모을 사전 홍보 리스트가 있나요?',
    why: '오픈 직전에는 완벽한 전략보다 첫 방문/첫 구매를 만드는 명단이 중요합니다. 초기 반응이 있어야 이후 개선 속도가 빨라집니다.',
    areaId: 'acquisition',
    stageFilter: ['pre-open'],
    improvementHint: '지인, 지역 커뮤니티, SNS 팔로워를 포함해 첫 알림 대상 30명을 리스트업하세요.',
    options: [
      { label: '30명 이상에게 알릴 리스트와 메시지가 있다', score: 10, interpretation: '초기 유입 준비가 잘 되어 있습니다.' },
      { label: '리스트는 있지만 메시지가 없다', score: 6, interpretation: '실행 직전 단계까지 왔습니다.' },
      { label: '몇 명만 떠오른다', score: 3, interpretation: '오픈 초반 유입이 약할 수 있습니다.' },
      { label: '아직 준비하지 않았다', score: 0, interpretation: '오픈 전 최우선 과제입니다.' },
    ],
  },
  {
    id: 'ctx_plateau_bottleneck',
    text: '매출 정체의 원인을 유입, 전환, 재구매 중 하나로 구분했나요?',
    why: '매출 정체는 원인이 다르면 처방도 완전히 달라집니다. 유입 문제인지, 전환 문제인지, 재구매 문제인지 구분해야 액션이 정확해집니다.',
    areaId: 'growth',
    stageFilter: ['plateau'],
    improvementHint: '최근 30일 데이터를 보고 방문자 수, 구매/예약 수, 재방문 수 중 가장 약한 지표를 고르세요.',
    options: [
      { label: '원인 영역과 근거 지표를 알고 있다', score: 10, interpretation: '개선 방향이 명확한 상태입니다.' },
      { label: '짐작은 하지만 지표 확인은 부족하다', score: 6, interpretation: '데이터 확인으로 정확도를 높여야 합니다.' },
      { label: '여러 원인이 섞여 보인다', score: 3, interpretation: '우선순위가 흐려질 수 있습니다.' },
      { label: '아직 구분하지 못했다', score: 0, interpretation: '성장 액션 전에 병목 진단이 필요합니다.' },
    ],
  },
]

export function getQuestionsForContext(
  industry: IndustryId,
  subIndustry?: SubIndustryId | null,
  stage?: StageId | null
): Question[] {
  const baseQuestions = QUESTIONS_BY_INDUSTRY[industry]
  const extraQuestions = contextualQuestions.filter(question => {
    const matchesSubIndustry =
      !question.subIndustryFilter?.length ||
      (subIndustry ? question.subIndustryFilter.includes(subIndustry) : false)
    const matchesStage =
      !question.stageFilter?.length ||
      (stage ? question.stageFilter.includes(stage) : false)

    return matchesSubIndustry && matchesStage
  })

  return [...baseQuestions, ...extraQuestions]
}
