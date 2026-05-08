import { ActionCard } from './types'

export const ACTION_CARDS: ActionCard[] = [

  // ─────────────────────────────────────────────
  // 메뉴 원가율 (menu_cost_rate)
  // ─────────────────────────────────────────────
  {
    action_id: 'act_cost_calc',
    title: '대표 메뉴 원가 계산',
    difficulty: 'normal',
    expected_time: '50분',
    impact: 'high',
    cost: 'none',
    solo_possible: true,
    repeatable: 'repeatable',
    recurrence_cycle: '월 1회',
    execution_steps: [
      '대표 메뉴 3개를 선정한다',
      '각 메뉴의 재료 목록을 작성한다',
      '재료별 현재 구매 단가를 확인한다',
      '1인분 기준 원가를 계산한다',
      '판매가 대비 원가율을 산출한다',
    ],
    success_condition: '대표 메뉴 3개의 원가율이 숫자로 계산되어 있음',
    related_indicator: 'menu_cost_rate',
  },
  {
    action_id: 'act_high_margin',
    title: '고마진 메뉴 후보 찾기',
    difficulty: 'normal',
    expected_time: '40분',
    impact: 'high',
    cost: 'none',
    solo_possible: true,
    repeatable: 'once',
    recurrence_cycle: '분기 1회',
    execution_steps: [
      '전체 메뉴의 원가율을 계산한다',
      '원가율 30% 이하인 메뉴를 목록으로 추린다',
      '해당 메뉴 중 고객 선호도가 높은 것을 우선순위로 선별한다',
      '고마진 메뉴를 메뉴판 상단·추천란에 배치할 계획을 세운다',
      '1개월 후 해당 메뉴 판매 비중을 측정한다',
    ],
    success_condition: '고마진 메뉴 3개 이상을 확인하고 판매 비중을 높이기 위한 배치 변경을 완료함',
    related_indicator: 'menu_cost_rate',
  },

  // ─────────────────────────────────────────────
  // 대표 메뉴 경쟁력 (menu_competitiveness)
  // ─────────────────────────────────────────────
  {
    action_id: 'act_competitor_analysis',
    title: '경쟁 음식점 3곳 분석',
    difficulty: 'normal',
    expected_time: '2시간',
    impact: 'high',
    cost: 'low',
    solo_possible: true,
    repeatable: 'repeatable',
    recurrence_cycle: '분기 1회',
    execution_steps: [
      '반경 300m 이내 경쟁 음식점 3곳을 선정한다',
      '각 가게의 대표 메뉴·가격·사진·리뷰를 온라인으로 조사한다',
      '가능하면 직접 방문해 분위기·서비스·음식 품질을 체험한다',
      '우리 매장 대비 강점·약점을 비교표로 정리한다',
      '우리만의 차별화 포인트 1가지를 도출한다',
    ],
    success_condition: '경쟁 3곳 비교표 완성 및 우리 매장 차별화 포인트 1개 도출',
    related_indicator: 'menu_competitiveness',
  },
  {
    action_id: 'act_menu_name_fix',
    title: '대표 메뉴명/설명 수정',
    difficulty: 'easy',
    expected_time: '60분',
    impact: 'medium',
    cost: 'none',
    solo_possible: true,
    repeatable: 'once',
    recurrence_cycle: '반기 1회',
    execution_steps: [
      '현재 메뉴판의 대표 메뉴 3개를 선정한다',
      '각 메뉴의 특징·재료·맛을 한 줄로 표현하는 설명을 작성한다',
      '경쟁점 메뉴명과 비교해 더 매력적인 이름으로 개선한다',
      '고객 1~2명에게 새 메뉴명과 설명에 대한 의견을 구한다',
      '메뉴판·배달앱·네이버 플레이스에 동시 반영한다',
    ],
    success_condition: '대표 메뉴 3개의 메뉴명·설명이 개선되어 모든 채널에 반영됨',
    related_indicator: 'menu_competitiveness',
  },

  // ─────────────────────────────────────────────
  // 배달앱 노출 (delivery_app_exposure)
  // ─────────────────────────────────────────────
  {
    action_id: 'act_delivery_photo',
    title: '배달앱 메뉴 사진 교체',
    difficulty: 'normal',
    expected_time: '2시간',
    impact: 'high',
    cost: 'low',
    solo_possible: true,
    repeatable: 'repeatable',
    recurrence_cycle: '반기 1회',
    execution_steps: [
      '배달앱에서 주문 상위 메뉴 5개를 선정한다',
      '밝은 자연광 또는 조명 아래에서 스마트폰으로 메뉴를 촬영한다',
      '음식이 먹음직스럽게 보이도록 구도와 배경을 조정한다',
      '스마트폰 무료 편집 앱으로 밝기·대비를 보정한다',
      '배달앱에 새 사진으로 교체 업로드한다',
    ],
    success_condition: '상위 판매 메뉴 5개의 사진이 새 고품질 이미지로 교체되어 업로드 완료됨',
    related_indicator: 'delivery_app_exposure',
  },
  {
    action_id: 'act_delivery_menu_desc',
    title: '배달앱 메뉴 설명 수정',
    difficulty: 'easy',
    expected_time: '40분',
    impact: 'medium',
    cost: 'none',
    solo_possible: true,
    repeatable: 'repeatable',
    recurrence_cycle: '분기 1회',
    execution_steps: [
      '배달앱 주문 상위 메뉴 5개를 확인한다',
      '각 메뉴의 재료·조리 방식·특징을 2~3문장으로 작성한다',
      '알레르기 정보와 양 정보를 추가한다',
      '고객이 주문하기 싫어질 표현(예: 보통)을 매력적인 표현으로 교체한다',
      '배달앱에 수정된 설명을 반영하고 저장한다',
    ],
    success_condition: '주문 상위 메뉴 5개의 설명이 구체적이고 매력적인 내용으로 업데이트됨',
    related_indicator: 'delivery_app_exposure',
  },

  // ─────────────────────────────────────────────
  // 리뷰 수/평점 (review_rating)
  // ─────────────────────────────────────────────
  {
    action_id: 'act_review_request',
    title: '리뷰 요청 문구 작성',
    difficulty: 'easy',
    expected_time: '30분',
    impact: 'high',
    cost: 'none',
    solo_possible: true,
    repeatable: 'once',
    recurrence_cycle: '-',
    execution_steps: [
      '고객이 리뷰를 남기기 쉬운 플랫폼을 1개 선정한다 (네이버·배달앱 등)',
      '계산 시 또는 식사 마무리 시점에 전달할 리뷰 요청 문구를 작성한다',
      'QR코드 또는 리뷰 링크를 생성한다',
      '영수증·테이블 스티커·카카오 알림에 문구와 QR코드를 삽입한다',
      '직원에게 리뷰 요청 시점과 방법을 교육한다',
    ],
    success_condition: '리뷰 요청 QR코드 또는 문구가 인쇄물이나 디지털 채널에 실제로 배치됨',
    related_indicator: 'review_rating',
  },
  {
    action_id: 'act_review_response',
    title: '리뷰 응답 템플릿 작성',
    difficulty: 'easy',
    expected_time: '40분',
    impact: 'medium',
    cost: 'none',
    solo_possible: true,
    repeatable: 'required',
    recurrence_cycle: '주 1회',
    execution_steps: [
      '최근 리뷰 20개를 읽고 긍정·중립·부정으로 분류한다',
      '긍정 리뷰 응답 템플릿 1개를 작성한다 (감사 + 재방문 유도)',
      '부정 리뷰 응답 템플릿 1개를 작성한다 (공감 + 개선 약속)',
      '미응답 리뷰를 모두 확인하고 우선 템플릿을 활용해 답변한다',
      '매주 새로운 리뷰를 확인하고 응답하는 루틴을 캘린더에 등록한다',
    ],
    success_condition: '최근 리뷰 전체에 응답 완료 및 주간 리뷰 확인 루틴이 캘린더에 등록됨',
    related_indicator: 'review_rating',
  },

  // ─────────────────────────────────────────────
  // 네이버 플레이스 상태 (naver_place_status)
  // ─────────────────────────────────────────────
  {
    action_id: 'act_naver_update',
    title: '네이버 플레이스 정보 수정',
    difficulty: 'easy',
    expected_time: '60분',
    impact: 'high',
    cost: 'none',
    solo_possible: true,
    repeatable: 'repeatable',
    recurrence_cycle: '월 1회',
    execution_steps: [
      '네이버 플레이스 관리 페이지에 로그인한다',
      '영업시간·휴무일·전화번호가 현재와 일치하는지 확인하고 수정한다',
      '메뉴판 정보(메뉴명·가격)를 최신화한다',
      '매장 내부·외부·음식 사진을 최소 10장 이상 업로드한다',
      '소개글과 특징 태그를 최신 운영 방향에 맞게 수정한다',
    ],
    success_condition: '영업시간·메뉴·가격·사진이 최신 상태로 반영되어 있음',
    related_indicator: 'naver_place_status',
  },

  // ─────────────────────────────────────────────
  // 재방문율 (revisit_rate)
  // ─────────────────────────────────────────────
  {
    action_id: 'act_revisit_coupon',
    title: '재방문 쿠폰 테스트',
    difficulty: 'easy',
    expected_time: '45분',
    impact: 'medium',
    cost: 'low',
    solo_possible: true,
    repeatable: 'repeatable',
    recurrence_cycle: '월 1회',
    execution_steps: [
      '재방문 유도에 사용할 쿠폰 혜택을 결정한다 (예: 다음 방문 시 사이드 1개 무료)',
      '계산 시 전달할 쿠폰을 직접 제작한다 (인쇄 또는 디지털)',
      '테스트 기간 2주 동안 모든 고객에게 쿠폰을 제공한다',
      '2주 후 쿠폰 회수율과 재방문 고객 수를 기록한다',
      '효과가 있으면 정기 운영으로 전환하고, 없으면 혜택을 수정해 재시도한다',
    ],
    success_condition: '쿠폰 2주 테스트 완료 및 회수율 데이터가 기록됨',
    related_indicator: 'revisit_rate',
  },
  {
    action_id: 'act_regular_classify',
    title: '단골 고객 분류',
    difficulty: 'easy',
    expected_time: '30분',
    impact: 'medium',
    cost: 'none',
    solo_possible: true,
    repeatable: 'repeatable',
    recurrence_cycle: '월 1회',
    execution_steps: [
      '최근 1개월 동안 2회 이상 방문한 고객을 파악한다',
      '단골 고객의 이름(또는 특징)·자주 주문하는 메뉴·방문 요일을 메모한다',
      '단골 고객 리스트를 간단한 스프레드시트 또는 메모장에 작성한다',
      '단골 고객에게 감사 인사나 소소한 혜택을 제공할 방법을 정한다',
      '다음 달 방문 여부를 확인해 이탈 고객을 파악한다',
    ],
    success_condition: '단골 고객 5명 이상의 이름·메뉴·방문 패턴이 기록된 리스트가 완성됨',
    related_indicator: 'revisit_rate',
  },

  // ─────────────────────────────────────────────
  // 테이블 회전율 (table_turnover)
  // ─────────────────────────────────────────────
  {
    action_id: 'act_table_record',
    title: '테이블 회전율 기록',
    difficulty: 'easy',
    expected_time: '30분 (설정) + 일일 5분',
    impact: 'medium',
    cost: 'none',
    solo_possible: true,
    repeatable: 'required',
    recurrence_cycle: '매일',
    execution_steps: [
      '테이블 회전율 기록 양식을 만든다 (날짜·시간대·테이블 수·착석 횟수)',
      '피크타임 1시간 동안 테이블별 착석·퇴석 횟수를 기록한다',
      '1주일 데이터를 모아 평균 회전 횟수를 계산한다',
      '회전율이 낮은 시간대와 원인을 파악한다 (주문 지연·서빙 지연·체류 시간 과다)',
      '원인에 맞는 개선 방법을 1개 선정해 실행한다',
    ],
    success_condition: '1주일치 피크타임 테이블 회전율 데이터가 기록되고 개선 포인트 1개가 도출됨',
    related_indicator: 'table_turnover',
  },

  // ─────────────────────────────────────────────
  // 점심/저녁/주말 매출 차이 (sales_time_diff)
  // ─────────────────────────────────────────────
  {
    action_id: 'act_peak_analysis',
    title: '피크타임 매출 분석',
    difficulty: 'easy',
    expected_time: '60분',
    impact: 'high',
    cost: 'none',
    solo_possible: true,
    repeatable: 'repeatable',
    recurrence_cycle: '월 1회',
    execution_steps: [
      '최근 1개월 POS 또는 배달앱 매출 데이터를 내려받는다',
      '시간대별(점심·저녁·주말)로 매출을 분류한다',
      '피크타임과 비피크타임 매출 차이 비율을 계산한다',
      '비피크타임 매출을 높이기 위한 프로모션 아이디어 3개를 작성한다',
      '가장 실현 가능한 아이디어 1개를 다음 달에 테스트한다',
    ],
    success_condition: '시간대별 매출 비율 데이터가 정리되고 비피크타임 개선 아이디어 1개 실행 계획이 수립됨',
    related_indicator: 'sales_time_diff',
  },

  // ─────────────────────────────────────────────
  // 주 고객층 (main_customer)
  // ─────────────────────────────────────────────
  {
    action_id: 'act_customer_survey',
    title: '고객층 설문 조사',
    difficulty: 'easy',
    expected_time: '1시간 (제작) + 1주일 (수집)',
    impact: 'medium',
    cost: 'none',
    solo_possible: true,
    repeatable: 'repeatable',
    recurrence_cycle: '반기 1회',
    execution_steps: [
      '5문항 이내의 짧은 설문을 작성한다 (나이대·방문 목적·만족 이유·개선점·재방문 의향)',
      '설문 방식을 결정한다 (테이블 설문지 또는 QR코드 구글 폼)',
      '1주일 동안 방문 고객에게 설문 응답을 요청한다',
      '30건 이상 응답을 수집한다',
      '결과를 분석해 주요 고객층 특성과 방문 동기를 정리한다',
    ],
    success_condition: '30건 이상 설문 응답 수집 및 주요 고객층 특성 요약 문서 완성',
    related_indicator: 'main_customer',
  },

  // ─────────────────────────────────────────────
  // 상권 유동 인구 (commercial_traffic)
  // ─────────────────────────────────────────────
  {
    action_id: 'act_traffic_check',
    title: '상권 유동 인구 조사',
    difficulty: 'normal',
    expected_time: '3시간',
    impact: 'medium',
    cost: 'none',
    solo_possible: true,
    repeatable: 'repeatable',
    recurrence_cycle: '분기 1회',
    execution_steps: [
      '소상공인 상권 분석 서비스(http://sg.sbiz.or.kr)에서 우리 상권 데이터를 조회한다',
      '점심·저녁·주말 시간대별 유동 인구 수를 기록한다',
      '주요 유동 인구 특성(직장인·주거민·관광객)을 파악한다',
      '우리 매장의 운영 시간이 유동 인구 피크와 일치하는지 확인한다',
      '불일치 시 운영 시간 조정 또는 해당 고객층을 위한 메뉴 추가를 검토한다',
    ],
    success_condition: '시간대별 유동 인구 데이터를 수집하고 운영 시간 최적화 여부를 결론 내림',
    related_indicator: 'commercial_traffic',
  },
]

export function getActionById(id: string): ActionCard | undefined {
  return ACTION_CARDS.find(a => a.action_id === id)
}

export function getActionsByIndicator(indicator: string): ActionCard[] {
  return ACTION_CARDS.filter(a => a.related_indicator === indicator)
}
