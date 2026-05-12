import { DiagnosisQuestion } from './types'

export const RESTAURANT_QUESTIONS: DiagnosisQuestion[] = [

  // ─────────────────────────────────────────────
  // 1. 주 고객층 (main_customer)
  // ─────────────────────────────────────────────
  {
    question_id: 'rest_mc_1',
    category: 'main_customer',
    business_type: 'restaurant',
    question: '우리 매장의 주요 고객층을 구체적으로 알고 있나요?',
    answer_options: [
      {
        label: '나이대·직업·방문 목적까지 구체적으로 파악하고 있다',
        score: 5,
        status_text: '고객 이해도가 높아 타깃 마케팅이 가능한 상태',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '대략적인 연령대·성별 정도는 알고 있다',
        score: 3,
        status_text: '고객 정보가 부족해 마케팅 효율이 낮을 수 있음',
        risk_level: 'medium',
        recommended_actions: ['act_customer_survey'],
      },
      {
        label: '잘 모르거나 생각해본 적 없다',
        score: 1,
        status_text: '주요 고객층 파악이 전혀 되지 않아 운영 방향 설정이 어려움',
        risk_level: 'high',
        recommended_actions: ['act_customer_survey', 'act_traffic_check'],
      },
    ],
    benchmark_text: {
      good: '주요 고객의 연령·직업·방문 목적을 구체적으로 파악하고 메뉴·운영 시간에 반영하고 있음',
      normal: '고객층을 대략적으로 알고 있으나 데이터 기반의 구체적인 분석은 없음',
      danger: '주요 고객층을 파악하지 못해 메뉴·가격·마케팅 방향이 불명확한 상태',
    },
    weight: { hall: 5, delivery: 5, takeout: 5 },
  },
  {
    question_id: 'rest_mc_2',
    category: 'main_customer',
    business_type: 'restaurant',
    question: '주요 고객층의 방문 동기(이유)를 파악하고 있나요?',
    answer_options: [
      {
        label: '인터뷰나 설문을 통해 방문 이유를 직접 확인했다',
        score: 5,
        status_text: '방문 동기 파악을 통해 메뉴·서비스 개선이 가능한 상태',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '경험상으로 대략 짐작하고 있다',
        score: 3,
        status_text: '짐작에 의존해 실제 고객 니즈와 차이가 생길 수 있음',
        risk_level: 'medium',
        recommended_actions: ['act_customer_survey'],
      },
      {
        label: '전혀 파악되지 않았다',
        score: 1,
        status_text: '고객 방문 동기를 모르면 재방문 전략 수립이 불가능함',
        risk_level: 'high',
        recommended_actions: ['act_customer_survey', 'act_regular_classify'],
      },
    ],
    benchmark_text: {
      good: '직접 설문·인터뷰를 통해 고객 방문 동기를 파악하고 메뉴와 운영에 반영하고 있음',
      normal: '경험으로 방문 동기를 짐작하지만 검증된 데이터는 없는 상태',
      danger: '고객이 왜 오는지 전혀 파악되지 않아 지속적인 개선이 어려운 상태',
    },
    weight: { hall: 5, delivery: 5, takeout: 5 },
  },

  // ─────────────────────────────────────────────
  // 2. 상권 유동 인구 (commercial_traffic)
  // ─────────────────────────────────────────────
  {
    question_id: 'rest_ct_1',
    category: 'commercial_traffic',
    business_type: 'restaurant',
    question: '매장 주변 상권의 유동 인구 규모와 특성을 파악하고 있나요?',
    answer_options: [
      {
        label: '유동 인구 수·시간대·특성(직장인/주거/관광 등)을 구체적으로 알고 있다',
        score: 5,
        status_text: '상권 이해도가 높아 운영 시간·메뉴 전략 최적화 가능',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '대략 바쁜 시간대 정도는 알고 있다',
        score: 3,
        status_text: '상권 특성 파악이 부분적으로만 이루어져 있음',
        risk_level: 'medium',
        recommended_actions: ['act_traffic_check'],
      },
      {
        label: '상권 유동 인구를 거의 파악하지 못하고 있다',
        score: 1,
        status_text: '상권 데이터 없이 운영해 매출 기회를 놓치고 있을 가능성이 높음',
        risk_level: 'high',
        recommended_actions: ['act_traffic_check', 'act_competitor_analysis'],
      },
    ],
    benchmark_text: {
      good: '유동 인구 규모와 시간대별 특성을 파악하고 영업 시간·메뉴 구성에 반영하고 있음',
      normal: '바쁜 시간대는 경험으로 알고 있으나 구체적인 상권 데이터를 갖고 있지 않음',
      danger: '상권 유동 인구를 전혀 분석하지 않아 운영 시간·인원 배치가 비효율적인 상태',
    },
    weight: { hall: 9, delivery: 2, takeout: 10 },
  },
  {
    question_id: 'rest_ct_2',
    category: 'commercial_traffic',
    business_type: 'restaurant',
    question: '주변 경쟁 음식점의 수와 상태를 파악하고 있나요?',
    answer_options: [
      {
        label: '반경 300m 내 경쟁점 수·강약점을 정리해 두었다',
        score: 5,
        status_text: '경쟁 환경 이해를 바탕으로 차별화 전략 수립 가능',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '경쟁점이 있다는 것은 알지만 상세 분석은 없다',
        score: 3,
        status_text: '경쟁점 분석이 부족해 차별화 포인트 발굴이 어려움',
        risk_level: 'medium',
        recommended_actions: ['act_competitor_analysis'],
      },
      {
        label: '경쟁점 현황을 전혀 파악하지 못하고 있다',
        score: 1,
        status_text: '경쟁 상황 무지로 가격·메뉴 전략이 비효율적일 가능성 높음',
        risk_level: 'high',
        recommended_actions: ['act_competitor_analysis', 'act_traffic_check'],
      },
    ],
    benchmark_text: {
      good: '주변 경쟁점을 정기적으로 조사하고 차별화 포인트를 메뉴와 운영에 반영하고 있음',
      normal: '경쟁점의 존재는 알지만 체계적인 분석이나 대응 전략이 없음',
      danger: '주변 경쟁 음식점을 분석하지 않아 가격·메뉴 경쟁력을 파악하지 못하고 있음',
    },
    weight: { hall: 9, delivery: 2, takeout: 10 },
  },

  // ─────────────────────────────────────────────
  // 3. 점심/저녁/주말 매출 차이 (sales_time_diff)
  // ─────────────────────────────────────────────
  {
    question_id: 'rest_st_1',
    category: 'sales_time_diff',
    business_type: 'restaurant',
    question: '점심·저녁·주말 시간대별 매출 비율을 파악하고 있나요?',
    answer_options: [
      {
        label: '시간대별 매출 비율을 수치로 알고 있고 운영에 반영하고 있다',
        score: 5,
        status_text: '시간대 매출 분석이 잘 이루어져 인력·메뉴 최적화 가능',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '어느 시간이 바쁜지 대략 알지만 수치로는 모른다',
        score: 3,
        status_text: '직관적 파악에 의존해 정확한 운영 최적화가 어려움',
        risk_level: 'medium',
        recommended_actions: ['act_peak_analysis'],
      },
      {
        label: '시간대별 매출 차이를 전혀 모른다',
        score: 1,
        status_text: '피크타임 관리가 안 되어 인력 낭비 또는 매출 손실이 발생하고 있을 수 있음',
        risk_level: 'high',
        recommended_actions: ['act_peak_analysis', 'act_table_record'],
      },
    ],
    benchmark_text: {
      good: '점심·저녁·주말 매출 비율을 수치로 파악하고 인력 배치와 메뉴 운영에 활용하고 있음',
      normal: '바쁜 시간은 감각적으로 알지만 데이터 기반으로 관리하지 않음',
      danger: '시간대별 매출 차이를 파악하지 못해 피크타임 대응이 체계적이지 않음',
    },
    weight: { hall: 8, delivery: 3, takeout: 7 },
  },
  {
    question_id: 'rest_st_2',
    category: 'sales_time_diff',
    business_type: 'restaurant',
    question: '매출이 낮은 시간대를 개선하기 위한 전략을 갖고 있나요?',
    answer_options: [
      {
        label: '비피크타임 전용 메뉴·할인·이벤트를 운영하고 있다',
        score: 5,
        status_text: '매출 공백 시간대를 전략적으로 채우고 있는 상태',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '아이디어는 있지만 아직 실행하지 않았다',
        score: 3,
        status_text: '개선 여지를 인식하고 있으나 실행으로 이어지지 않음',
        risk_level: 'medium',
        recommended_actions: ['act_peak_analysis'],
      },
      {
        label: '비피크타임 개선을 전혀 고려하지 않았다',
        score: 1,
        status_text: '공백 시간대 매출 손실이 누적되고 있는 상태',
        risk_level: 'high',
        recommended_actions: ['act_peak_analysis', 'act_revisit_coupon'],
      },
    ],
    benchmark_text: {
      good: '비피크타임 전략(런치 특가·사이드 메뉴·이벤트)을 운영해 공백 시간대 매출을 보완하고 있음',
      normal: '비피크타임 개선 필요성을 알지만 구체적인 실행 전략이 없음',
      danger: '매출 공백 시간대를 방치해 전체 매출 효율이 낮은 상태',
    },
    weight: { hall: 8, delivery: 3, takeout: 7 },
  },

  // ─────────────────────────────────────────────
  // 4. 대표 메뉴 경쟁력 (menu_competitiveness)
  // ─────────────────────────────────────────────
  {
    question_id: 'rest_mv_1',
    category: 'menu_competitiveness',
    business_type: 'restaurant',
    question: '대표 메뉴가 주변 경쟁 음식점과 비교해 차별화되어 있나요?',
    answer_options: [
      {
        label: '고객이 인정하는 명확한 차별화 포인트(맛·비주얼·양·가격 등)가 있다',
        score: 5,
        status_text: '대표 메뉴의 경쟁력이 확보되어 재방문과 추천을 유도하고 있음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '차별화 요소가 있다고 생각하지만 고객 반응 데이터는 없다',
        score: 3,
        status_text: '자체 판단에 의존해 실제 경쟁력을 검증하지 못한 상태',
        risk_level: 'medium',
        recommended_actions: ['act_competitor_analysis'],
      },
      {
        label: '특별한 차별점이 없거나 모르겠다',
        score: 1,
        status_text: '메뉴 차별화 부재로 가격 경쟁에만 의존하게 될 위험이 높음',
        risk_level: 'high',
        recommended_actions: ['act_competitor_analysis', 'act_menu_name_fix'],
      },
    ],
    benchmark_text: {
      good: '대표 메뉴의 차별화 포인트를 고객이 인식하고 있으며 리뷰나 재방문으로 검증되고 있음',
      normal: '메뉴에 특색은 있지만 고객에게 명확히 전달되지 않거나 검증되지 않은 상태',
      danger: '주변 경쟁점 대비 메뉴 차별화가 없어 선택받을 이유가 약한 상태',
    },
    weight: { hall: 4, delivery: 8, takeout: 5 },
  },
  {
    question_id: 'rest_mv_2',
    category: 'menu_competitiveness',
    business_type: 'restaurant',
    question: '대표 메뉴의 이름과 설명이 고객에게 매력적으로 전달되고 있나요?',
    answer_options: [
      {
        label: '메뉴명·설명·사진이 모두 갖춰져 있고 주기적으로 업데이트한다',
        score: 5,
        status_text: '메뉴 표현력이 높아 첫 방문 고객의 선택을 돕고 있음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '기본 메뉴명은 있지만 설명이나 사진이 빈약하다',
        score: 3,
        status_text: '메뉴판 매력도가 낮아 주문 전환율이 떨어질 수 있음',
        risk_level: 'medium',
        recommended_actions: ['act_menu_name_fix'],
      },
      {
        label: '메뉴명만 있고 설명·사진이 전혀 없다',
        score: 1,
        status_text: '메뉴 정보 부족으로 고객의 주문 결정을 방해하고 있음',
        risk_level: 'high',
        recommended_actions: ['act_menu_name_fix', 'act_delivery_photo'],
      },
    ],
    benchmark_text: {
      good: '메뉴명·설명·사진을 갖추고 정기적으로 업데이트하여 고객의 주문 결정을 돕고 있음',
      normal: '메뉴명은 있지만 고객의 선택을 유도하는 설명이나 사진이 부족함',
      danger: '메뉴 정보가 최소한으로만 제공되어 고객이 주문을 망설이게 만드는 상태',
    },
    weight: { hall: 4, delivery: 8, takeout: 5 },
  },

  // ─────────────────────────────────────────────
  // 5. 메뉴 원가율 (menu_cost_rate)
  // ─────────────────────────────────────────────
  {
    question_id: 'rest_cost_1',
    category: 'menu_cost_rate',
    business_type: 'restaurant',
    question: '대표 메뉴의 원가율을 알고 있나요?',
    answer_options: [
      {
        label: '최근 1개월 내 직접 계산했다',
        score: 5,
        status_text: '원가 관리가 잘 되고 있음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '대략 알고 있다',
        score: 3,
        status_text: '수익성 판단이 불완전함',
        risk_level: 'medium',
        recommended_actions: ['act_cost_calc'],
      },
      {
        label: '모른다',
        score: 1,
        status_text: '팔수록 손해 보는 메뉴가 있을 수 있음',
        risk_level: 'high',
        recommended_actions: ['act_cost_calc', 'act_high_margin'],
      },
    ],
    benchmark_text: {
      good: '최근 원가율을 정기적으로 계산하고 메뉴별 수익성을 관리하고 있음',
      normal: '원가율을 대략 파악하고 있으나 정기적 관리가 이루어지지 않음',
      danger: '원가율을 모르고 있어 수익 구조 파악이 불가능한 상태',
    },
    weight: { hall: 3, delivery: 4, takeout: 4 },
  },
  {
    question_id: 'rest_cost_2',
    category: 'menu_cost_rate',
    business_type: 'restaurant',
    question: '마진이 높은 메뉴와 낮은 메뉴를 구분해서 관리하고 있나요?',
    answer_options: [
      {
        label: '메뉴별 마진율을 알고 고마진 메뉴 판매를 유도하고 있다',
        score: 5,
        status_text: '수익성 높은 메뉴 중심으로 운영되어 수익 구조가 최적화되어 있음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '어떤 메뉴가 남는지 대략은 알지만 체계적으로 관리하지 않는다',
        score: 3,
        status_text: '마진 관리 체계가 없어 전체 수익성이 낮을 수 있음',
        risk_level: 'medium',
        recommended_actions: ['act_high_margin'],
      },
      {
        label: '메뉴별 마진 차이를 전혀 구분하지 못한다',
        score: 1,
        status_text: '저마진 메뉴를 열심히 팔고 있을 가능성이 높아 개선이 시급함',
        risk_level: 'high',
        recommended_actions: ['act_cost_calc', 'act_high_margin'],
      },
    ],
    benchmark_text: {
      good: '메뉴별 마진율을 파악하고 고마진 메뉴를 메뉴판 상단에 배치하거나 추천하고 있음',
      normal: '어떤 메뉴가 남는지는 알지만 체계적인 마진 관리와 판매 유도 전략은 없음',
      danger: '메뉴별 마진을 구분하지 못해 저마진 메뉴 중심의 비효율적 운영이 이루어지고 있음',
    },
    weight: { hall: 3, delivery: 4, takeout: 4 },
  },

  // ─────────────────────────────────────────────
  // 6. 객단가 (avg_spending_per_customer)
  // ─────────────────────────────────────────────
  {
    question_id: 'rest_asp_1',
    category: 'avg_spending_per_customer',
    business_type: 'restaurant',
    question: '현재 1인당 평균 지출 금액(객단가)을 알고 있나요?',
    answer_options: [
      {
        label: '정기적으로 계산하고 있으며 목표 객단가도 설정되어 있다',
        score: 5,
        status_text: '객단가 관리가 잘 이루어져 수익 목표 달성이 용이함',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '대략적인 수준은 알고 있다',
        score: 3,
        status_text: '정확한 객단가 파악이 안 되어 수익성 관리가 어려움',
        risk_level: 'medium',
        recommended_actions: ['act_peak_analysis'],
      },
      {
        label: '객단가를 계산해본 적 없다',
        score: 1,
        status_text: '매출 구조 파악이 불가능해 가격 전략을 세울 수 없는 상태',
        risk_level: 'high',
        recommended_actions: ['act_peak_analysis', 'act_cost_calc'],
      },
    ],
    benchmark_text: {
      good: '현재 객단가를 파악하고 목표 객단가를 설정해 메뉴 구성과 추가 판매 전략에 반영하고 있음',
      normal: '객단가를 대략 알고 있지만 이를 높이기 위한 전략적 접근이 없음',
      danger: '객단가를 모르고 있어 적정 판매 가격이나 메뉴 구성의 기준이 없는 상태',
    },
    weight: { hall: 5, delivery: 5, takeout: 8 },
  },
  {
    question_id: 'rest_asp_2',
    category: 'avg_spending_per_customer',
    business_type: 'restaurant',
    question: '객단가를 높이기 위한 전략(추가 메뉴 제안·세트 구성 등)을 운영하고 있나요?',
    answer_options: [
      {
        label: '사이드 메뉴 추천, 세트 메뉴, 업셀링 전략을 실행하고 있다',
        score: 5,
        status_text: '객단가 향상 전략이 운영되어 수익 효율이 높은 상태',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '아이디어는 있지만 체계적으로 실행하지 않고 있다',
        score: 3,
        status_text: '추가 수익 창출 기회를 충분히 활용하지 못하고 있음',
        risk_level: 'medium',
        recommended_actions: ['act_menu_name_fix'],
      },
      {
        label: '객단가를 높이려는 시도를 해본 적 없다',
        score: 1,
        status_text: '객단가 개선 없이는 매출 증가에 한계가 있음',
        risk_level: 'high',
        recommended_actions: ['act_menu_name_fix', 'act_high_margin'],
      },
    ],
    benchmark_text: {
      good: '사이드 메뉴 추천·세트 구성·업셀링 등 객단가 향상 전략이 일상 운영에 반영되어 있음',
      normal: '추가 메뉴 판매 기회가 있지만 체계적인 전략이나 직원 교육 없이 운영되고 있음',
      danger: '고객 1인당 지출을 높이려는 시도가 없어 매출 한계에 봉착할 가능성이 높음',
    },
    weight: { hall: 5, delivery: 5, takeout: 8 },
  },

  // ─────────────────────────────────────────────
  // 7. 테이블 회전율 (table_turnover)
  // ─────────────────────────────────────────────
  {
    question_id: 'rest_tt_1',
    category: 'table_turnover',
    business_type: 'restaurant',
    question: '피크타임 기준 테이블 1개당 하루 평균 몇 회 회전하는지 알고 있나요?',
    answer_options: [
      {
        label: '피크·비피크 시간대 별로 회전 횟수를 기록하고 있다',
        score: 5,
        status_text: '테이블 효율 관리가 잘 이루어져 매출 최적화 가능',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '대략적인 회전 횟수는 알고 있다',
        score: 3,
        status_text: '정확한 데이터 없이 감각에 의존해 개선 기회를 놓치고 있음',
        risk_level: 'medium',
        recommended_actions: ['act_table_record'],
      },
      {
        label: '회전율을 계산해본 적 없다',
        score: 1,
        status_text: '테이블 효율을 파악하지 못해 병목 구간 발견이 불가능한 상태',
        risk_level: 'high',
        recommended_actions: ['act_table_record', 'act_peak_analysis'],
      },
    ],
    benchmark_text: {
      good: '피크타임 회전 횟수를 기록하고 병목 원인을 파악해 서빙·결제 속도를 개선하고 있음',
      normal: '바쁜 시간대를 알고 있지만 회전율을 수치로 관리하지 않고 있음',
      danger: '테이블 회전율을 전혀 파악하지 못해 매출 병목 원인을 발견하지 못하고 있음',
    },
    weight: { hall: 10, delivery: 1, takeout: 1 },
  },
  {
    question_id: 'rest_tt_2',
    category: 'table_turnover',
    business_type: 'restaurant',
    question: '대기 손님이 생길 때 테이블 회전을 빠르게 하기 위한 운영 방식이 있나요?',
    answer_options: [
      {
        label: '결제 속도 개선·수저 세팅 시스템·대기 안내 프로세스가 갖춰져 있다',
        score: 5,
        status_text: '대기 상황에서도 효율적인 운영으로 추가 매출을 확보하고 있음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '일부 방법을 쓰고 있지만 체계적이지 않다',
        score: 3,
        status_text: '대기 시 회전 최적화가 충분하지 않아 기회 손실이 발생할 수 있음',
        risk_level: 'medium',
        recommended_actions: ['act_table_record'],
      },
      {
        label: '특별한 방법 없이 그냥 운영한다',
        score: 1,
        status_text: '대기 고객 이탈과 테이블 비효율로 매출 손실이 반복되고 있음',
        risk_level: 'high',
        recommended_actions: ['act_table_record', 'act_peak_analysis'],
      },
    ],
    benchmark_text: {
      good: '결제 프로세스 최적화·테이블 정리 시스템·대기 안내로 회전율을 높이고 있음',
      normal: '바쁜 시간 경험은 있지만 체계적인 회전율 개선 방법이 없음',
      danger: '대기 상황에서 아무런 회전 개선 조치 없이 고객 이탈이 반복되는 상태',
    },
    weight: { hall: 10, delivery: 1, takeout: 1 },
  },

  // ─────────────────────────────────────────────
  // 8. 배달앱 노출 (delivery_app_exposure)
  // ─────────────────────────────────────────────
  {
    question_id: 'rest_da_1',
    category: 'delivery_app_exposure',
    business_type: 'restaurant',
    question: '배달앱에서 매장이 상위에 노출되고 있는지 주기적으로 확인하나요?',
    answer_options: [
      {
        label: '주 1회 이상 노출 순위를 확인하고 광고·운영 시간을 조정하고 있다',
        score: 5,
        status_text: '배달앱 노출 관리가 체계적으로 이루어지고 있음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '가끔 확인하지만 체계적으로 관리하지 않는다',
        score: 3,
        status_text: '노출 관리 부재로 잠재 주문 기회를 놓치고 있음',
        risk_level: 'medium',
        recommended_actions: ['act_delivery_menu_desc'],
      },
      {
        label: '배달앱 노출 현황을 거의 확인하지 않는다',
        score: 1,
        status_text: '노출이 낮아 배달 매출이 침체되고 있을 가능성이 높음',
        risk_level: 'high',
        recommended_actions: ['act_delivery_menu_desc', 'act_delivery_photo'],
      },
    ],
    benchmark_text: {
      good: '배달앱 노출 순위를 정기적으로 확인하고 운영 시간·광고 설정으로 노출을 최적화하고 있음',
      normal: '배달앱에 등록되어 있지만 노출 순위나 클릭율을 체계적으로 관리하지 않음',
      danger: '배달앱 노출 현황을 확인하지 않아 경쟁 매장 대비 뒤처지고 있는 상태',
    },
    weight: { hall: 1, delivery: 10, takeout: 2 },
  },
  {
    question_id: 'rest_da_2',
    category: 'delivery_app_exposure',
    business_type: 'restaurant',
    question: '배달앱 메뉴 사진과 설명이 최신 상태로 관리되고 있나요?',
    answer_options: [
      {
        label: '전문가 촬영 또는 고품질 사진이 있고 메뉴 설명도 최신 상태다',
        score: 5,
        status_text: '배달앱 메뉴 품질이 높아 클릭·주문 전환율이 좋은 상태',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '사진은 있지만 품질이 낮거나 설명이 부족하다',
        score: 3,
        status_text: '메뉴 사진·설명 품질이 낮아 주문 전환율 저하 가능성이 있음',
        risk_level: 'medium',
        recommended_actions: ['act_delivery_photo'],
      },
      {
        label: '사진이 없거나 매우 오래된 사진을 사용하고 있다',
        score: 1,
        status_text: '메뉴 사진 부재로 경쟁 매장 대비 주문 전환율이 매우 낮을 가능성이 높음',
        risk_level: 'high',
        recommended_actions: ['act_delivery_photo', 'act_delivery_menu_desc'],
      },
    ],
    benchmark_text: {
      good: '고품질 메뉴 사진과 구체적인 설명을 제공해 배달앱 주문 전환율을 높이고 있음',
      normal: '메뉴 사진은 있지만 품질이 낮거나 설명이 부족해 클릭 대비 주문율이 낮음',
      danger: '메뉴 사진이 없거나 오래된 사진으로 고객의 주문 결정을 방해하고 있는 상태',
    },
    weight: { hall: 1, delivery: 10, takeout: 2 },
  },

  // ─────────────────────────────────────────────
  // 9. 리뷰 수/평점 (review_rating)
  // ─────────────────────────────────────────────
  {
    question_id: 'rest_rr_1',
    category: 'review_rating',
    business_type: 'restaurant',
    question: '최근 30일 리뷰 수와 평균 평점을 확인하고 있나요?',
    answer_options: [
      {
        label: '매주 확인하고 부정 리뷰에 답변하며 개선에 반영하고 있다',
        score: 5,
        status_text: '리뷰 관리가 잘 되어 신규 고객의 신뢰도와 선택률이 높은 상태',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '가끔 확인하지만 답변이나 개선 조치는 없다',
        score: 3,
        status_text: '리뷰를 운영 개선에 활용하지 못하고 있음',
        risk_level: 'medium',
        recommended_actions: ['act_review_response'],
      },
      {
        label: '리뷰를 거의 확인하지 않는다',
        score: 1,
        status_text: '부정 리뷰가 누적되어 신규 고객 유입을 막고 있을 가능성이 높음',
        risk_level: 'high',
        recommended_actions: ['act_review_response', 'act_review_request'],
      },
    ],
    benchmark_text: {
      good: '최근 30일 리뷰 수와 평점을 정기적으로 확인하고 부정 리뷰에 응답하고 있음',
      normal: '리뷰는 확인하지만 응답 기준이나 개선 루틴이 없음',
      danger: '최근 리뷰를 거의 확인하지 않고 고객 불만을 운영 개선에 반영하지 않음',
    },
    weight: { hall: 6, delivery: 9, takeout: 3 },
  },
  {
    question_id: 'rest_rr_2',
    category: 'review_rating',
    business_type: 'restaurant',
    question: '고객에게 리뷰 작성을 적극적으로 요청하고 있나요?',
    answer_options: [
      {
        label: '리뷰 요청 문구·QR코드·영수증 안내 등을 통해 정기적으로 요청하고 있다',
        score: 5,
        status_text: '리뷰 확보 체계가 갖춰져 신규 고객 신뢰도를 높이고 있음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '가끔 구두로 요청하지만 체계적이지 않다',
        score: 3,
        status_text: '리뷰 확보 기회를 충분히 활용하지 못하고 있음',
        risk_level: 'medium',
        recommended_actions: ['act_review_request'],
      },
      {
        label: '리뷰 요청을 전혀 하지 않는다',
        score: 1,
        status_text: '리뷰 자연 증가에만 의존해 경쟁 매장 대비 리뷰 수가 부족할 가능성이 높음',
        risk_level: 'high',
        recommended_actions: ['act_review_request', 'act_review_response'],
      },
    ],
    benchmark_text: {
      good: '리뷰 요청 문구·QR코드·스티커 등을 활용해 만족 고객의 리뷰 작성을 유도하고 있음',
      normal: '좋은 서비스를 제공하지만 리뷰 요청을 체계적으로 하지 않아 리뷰가 천천히 쌓임',
      danger: '리뷰 요청 시스템이 없어 경쟁 매장 대비 리뷰 수와 신뢰도가 낮은 상태',
    },
    weight: { hall: 6, delivery: 9, takeout: 3 },
  },

  // ─────────────────────────────────────────────
  // 10. 네이버 플레이스 상태 (naver_place_status)
  // ─────────────────────────────────────────────
  {
    question_id: 'rest_np_1',
    category: 'naver_place_status',
    business_type: 'restaurant',
    question: '네이버 플레이스에 영업시간·메뉴·전화번호가 정확하게 등록되어 있나요?',
    answer_options: [
      {
        label: '모든 정보가 최신 상태이고 사진도 10장 이상 등록되어 있다',
        score: 5,
        status_text: '네이버 플레이스 관리가 우수해 검색 유입과 신뢰도가 높음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '기본 정보는 있지만 사진이나 메뉴 정보가 오래됐다',
        score: 3,
        status_text: '플레이스 정보가 불완전해 방문 전 고객의 신뢰도를 낮추고 있음',
        risk_level: 'medium',
        recommended_actions: ['act_naver_update'],
      },
      {
        label: '정보가 부정확하거나 플레이스를 관리하지 않고 있다',
        score: 1,
        status_text: '잘못된 정보로 방문 기회를 잃고 있으며 고객 불만이 발생할 수 있음',
        risk_level: 'high',
        recommended_actions: ['act_naver_update', 'act_review_response'],
      },
    ],
    benchmark_text: {
      good: '영업시간·메뉴·가격·사진·전화번호가 최신 상태로 관리되고 있음',
      normal: '기본 정보는 있지만 사진이나 메뉴 정보가 오래됨',
      danger: '영업시간·메뉴·가격·전화번호 중 일부가 부정확하거나 관리되지 않음',
    },
    weight: { hall: 7, delivery: 2, takeout: 9 },
  },
  {
    question_id: 'rest_np_2',
    category: 'naver_place_status',
    business_type: 'restaurant',
    question: '네이버 플레이스에 등록된 사진이 매장의 현재 모습을 잘 표현하고 있나요?',
    answer_options: [
      {
        label: '음식·내부·외부 사진이 모두 최근 촬영본으로 20장 이상 있다',
        score: 5,
        status_text: '풍부한 사진으로 방문 전 고객에게 좋은 인상을 주고 있음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '사진이 5~10장 정도 있지만 오래됐거나 품질이 낮다',
        score: 3,
        status_text: '사진 품질과 수량이 부족해 검색 고객의 방문 결정이 어려울 수 있음',
        risk_level: 'medium',
        recommended_actions: ['act_naver_update'],
      },
      {
        label: '사진이 거의 없거나 매우 오래된 것만 있다',
        score: 1,
        status_text: '사진 부재로 네이버 검색 고객의 방문 전환율이 매우 낮을 가능성이 높음',
        risk_level: 'high',
        recommended_actions: ['act_naver_update', 'act_delivery_photo'],
      },
    ],
    benchmark_text: {
      good: '음식·매장 내부·외부 사진을 정기적으로 업데이트해 방문 전 고객의 기대감을 높이고 있음',
      normal: '사진이 있지만 수량이 부족하거나 오래된 사진이 섞여 있어 매장 이미지 전달이 약함',
      danger: '사진이 거의 없어 검색 고객이 매장 정보를 파악하기 어려운 상태',
    },
    weight: { hall: 7, delivery: 2, takeout: 9 },
  },

  // ─────────────────────────────────────────────
  // 11. 재방문율 (revisit_rate)
  // ─────────────────────────────────────────────
  {
    question_id: 'rest_rv_1',
    category: 'revisit_rate',
    business_type: 'restaurant',
    question: '단골 고객(재방문 고객)의 비율을 파악하고 있나요?',
    answer_options: [
      {
        label: '단골 고객 비율을 수치로 알고 있고 단골 관리 프로그램을 운영하고 있다',
        score: 5,
        status_text: '재방문율 관리가 잘 되어 안정적인 매출 기반이 형성되어 있음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '단골 얼굴은 알지만 비율을 수치로 파악하지 못한다',
        score: 3,
        status_text: '재방문 관리 체계가 없어 단골 이탈을 조기에 발견하기 어려움',
        risk_level: 'medium',
        recommended_actions: ['act_regular_classify'],
      },
      {
        label: '재방문율을 전혀 파악하지 못하고 있다',
        score: 1,
        status_text: '재방문 고객 관리가 안 되어 신규 고객 유치에만 의존하는 상태',
        risk_level: 'high',
        recommended_actions: ['act_regular_classify', 'act_revisit_coupon'],
      },
    ],
    benchmark_text: {
      good: '단골 고객 비율을 수치로 파악하고 재방문을 유도하는 프로그램을 운영하고 있음',
      normal: '단골 고객을 얼굴로 알고 있지만 비율이나 재방문 주기를 데이터로 관리하지 않음',
      danger: '재방문율을 전혀 파악하지 못해 고객 이탈을 인식하지 못하고 있는 상태',
    },
    weight: { hall: 2, delivery: 6, takeout: 6 },
  },
  {
    question_id: 'rest_rv_2',
    category: 'revisit_rate',
    business_type: 'restaurant',
    question: '고객의 재방문을 유도하는 프로그램이나 장치가 있나요?',
    answer_options: [
      {
        label: '스탬프 카드·쿠폰·SNS 이벤트 등 재방문 유도 프로그램을 운영하고 있다',
        score: 5,
        status_text: '재방문 유도 장치가 갖춰져 단골 확보에 유리한 구조임',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '가끔 쿠폰이나 이벤트를 진행하지만 지속적이지 않다',
        score: 3,
        status_text: '재방문 유도 활동이 산발적으로 이루어져 효과가 낮음',
        risk_level: 'medium',
        recommended_actions: ['act_revisit_coupon'],
      },
      {
        label: '재방문을 유도하는 특별한 장치가 없다',
        score: 1,
        status_text: '재방문 유도 시스템 부재로 단골 고객 확보가 어려운 상태',
        risk_level: 'high',
        recommended_actions: ['act_revisit_coupon', 'act_regular_classify'],
      },
    ],
    benchmark_text: {
      good: '스탬프 카드·쿠폰·SNS 팔로우 이벤트 등 체계적인 재방문 유도 프로그램을 운영하고 있음',
      normal: '재방문 유도 아이디어는 있지만 지속적으로 운영되지 않아 효과가 낮음',
      danger: '재방문 유도 장치가 전혀 없어 한 번 방문한 고객을 놓치는 상태',
    },
    weight: { hall: 2, delivery: 6, takeout: 6 },
  },
  {
    question_id: 'rest_rv_3',
    category: 'revisit_rate',
    business_type: 'restaurant',
    question: '오랫동안 방문하지 않은 단골 고객을 다시 부르는 방법이 있나요?',
    answer_options: [
      {
        label: 'SNS·카카오 채널·문자 등을 통해 휴면 고객에게 정기적으로 연락하고 있다',
        score: 5,
        status_text: '휴면 고객 재활성화 채널이 있어 매출 회복력이 높음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '가끔 SNS를 통해 소식을 전하지만 개인 맞춤 연락은 없다',
        score: 3,
        status_text: '휴면 고객 대상 맞춤 접근이 부족해 이탈 고객 회복률이 낮음',
        risk_level: 'medium',
        recommended_actions: ['act_regular_classify'],
      },
      {
        label: '단골이 안 오더라도 별다른 조치를 취하지 않는다',
        score: 1,
        status_text: '고객 이탈을 방치해 매출이 서서히 감소할 위험이 있음',
        risk_level: 'high',
        recommended_actions: ['act_regular_classify', 'act_revisit_coupon'],
      },
    ],
    benchmark_text: {
      good: '휴면 고객에게 정기적으로 소식을 전하고 특별 혜택으로 재방문을 유도하고 있음',
      normal: 'SNS를 통해 소식을 전하지만 개인 맞춤형 재방문 유도 활동은 없음',
      danger: '단골 고객이 발길을 끊어도 별다른 조치가 없어 고객 기반이 서서히 줄고 있음',
    },
    weight: { hall: 2, delivery: 6, takeout: 6 },
  },
]

const accommodationWeights = { boutique: 7, social: 7, stay: 7 }

export const ACCOMMODATION_QUESTIONS: DiagnosisQuestion[] = [
  {
    question_id: 'acc_pos_1',
    category: 'lodging_positioning',
    business_type: 'accommodation',
    question: '우리 숙소의 핵심 타겟과 컨셉이 명확히 정의되어 있나요?',
    answer_options: [
      { label: '타겟 페르소나와 숙소 세계관, 차별화 포인트가 문서로 정리되어 있다', score: 5, status_text: '가격 경쟁이 아닌 컨셉 경쟁을 할 수 있는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '감성 숙소, 가족 숙소처럼 대략적인 방향은 있다', score: 3, status_text: '컨셉은 있으나 예약 이유로 연결되는 메시지가 약할 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_positioning_matrix'] },
      { label: '위치와 가격 외에 뚜렷한 포지셔닝이 없다', score: 1, status_text: '대체 가능한 숙소로 보일 가능성이 높음', risk_level: 'high', recommended_actions: ['act_acc_positioning_matrix', 'act_acc_competitor_xfactor'] },
    ],
    benchmark_text: { good: '타겟 고객, 컨셉, X-Factor가 명확해 상세 페이지와 가격 전략에 일관되게 반영됨', normal: '컨셉은 있으나 고객 페르소나와 메시지가 충분히 구체화되지 않음', danger: '숙소가 누구를 위한 어떤 경험인지 불명확해 가격 경쟁에 노출됨' },
    weight: { boutique: 9, social: 8, stay: 4 },
  },
  {
    question_id: 'acc_occ_1',
    category: 'occupancy_rate',
    business_type: 'accommodation',
    question: '최근 30일 객실 점유율과 62% 경고 구간 여부를 확인하고 있나요?',
    answer_options: [
      { label: '점유율을 매주 확인하고 62% 이하일 때 요금·최소숙박일을 조정한다', score: 5, status_text: '수요 변화에 빠르게 대응하는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '월별 예약률은 보지만 기준점에 따른 대응 규칙은 없다', score: 3, status_text: '공실 위험을 늦게 인식할 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_occupancy_los'] },
      { label: '점유율을 따로 계산하지 않는다', score: 1, status_text: '공실과 가격 전략의 원인을 파악하기 어려움', risk_level: 'high', recommended_actions: ['act_acc_occupancy_los'] },
    ],
    benchmark_text: { good: '점유율을 상시 추적하고 62% 이하에서 Quick Win 액션을 실행함', normal: '예약률은 보지만 명확한 판단 기준과 대응 루틴은 없음', danger: '객실 점유율을 몰라 공실 원인과 가격 조정 시점을 놓침' },
    weight: { boutique: 5, social: 5, stay: 10 },
  },
  {
    question_id: 'acc_adr_1',
    category: 'adr_revpar',
    business_type: 'accommodation',
    question: 'ADR과 RevPAR를 기준으로 가격 경쟁력을 관리하고 있나요?',
    answer_options: [
      { label: 'ADR·RevPAR를 함께 보고 요일/성수기별 요금을 조정한다', score: 5, status_text: '점유율과 객단가의 균형을 관리하는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '평균 객실 단가는 알지만 RevPAR까지 보지는 않는다', score: 3, status_text: '수익 효율보다 단순 가격에 의존할 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_revpar_sheet'] },
      { label: '주변 시세를 보고 감으로 가격을 정한다', score: 1, status_text: '브랜드 가치와 수익성을 동시에 놓칠 위험이 큼', risk_level: 'high', recommended_actions: ['act_acc_revpar_sheet'] },
    ],
    benchmark_text: { good: 'ADR과 RevPAR를 기준으로 가격을 조정하고 객실당 수익을 관리함', normal: '객단가는 알지만 점유율과 결합한 수익 효율 분석은 부족함', danger: '감에 의존해 가격을 정해 저가 경쟁 또는 공실 리스크가 큼' },
    weight: { boutique: 9, social: 4, stay: 8 },
  },
  {
    question_id: 'acc_direct_1',
    category: 'direct_booking_share',
    business_type: 'accommodation',
    question: 'OTA 외 직접 예약 채널의 매출 비중을 관리하고 있나요?',
    answer_options: [
      { label: '자사 예약 링크/채널을 운영하고 직접 예약 비중과 수수료 절감액을 본다', score: 5, status_text: '플랫폼 비용과 고객 데이터를 함께 관리하는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '인스타그램/네이버 문의는 받지만 비중은 따로 계산하지 않는다', score: 3, status_text: '직접 예약 성장 가능성이 수치로 관리되지 않음', risk_level: 'medium', recommended_actions: ['act_acc_direct_booking_link'] },
      { label: '예약은 거의 OTA에만 의존한다', score: 1, status_text: '수수료와 플랫폼 정책 변화에 취약한 상태', risk_level: 'high', recommended_actions: ['act_acc_direct_booking_link', 'act_acc_ota_mix'] },
    ],
    benchmark_text: { good: '직접 예약 비중을 높이며 OTA 수수료와 고객 데이터 손실을 줄이고 있음', normal: '직접 문의는 있으나 채널과 성과 관리가 체계적이지 않음', danger: 'OTA 의존으로 수수료와 정책 리스크에 그대로 노출됨' },
    weight: { boutique: 5, social: 5, stay: 9 },
  },
  {
    question_id: 'acc_ota_1',
    category: 'ota_dependency',
    business_type: 'accommodation',
    question: '특정 OTA나 플랫폼 의존도를 분산하고 있나요?',
    answer_options: [
      { label: '채널별 예약 비중을 보고 특정 플랫폼 의존도를 제한한다', score: 5, status_text: '채널 리스크를 관리하는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '여러 채널에 등록되어 있지만 비중 관리는 하지 않는다', score: 3, status_text: '실제 매출은 특정 채널에 쏠려 있을 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_ota_mix'] },
      { label: '한 플랫폼 매출이 대부분이다', score: 1, status_text: '노출 정책·수수료·보안 이슈에 취약함', risk_level: 'high', recommended_actions: ['act_acc_ota_mix'] },
    ],
    benchmark_text: { good: '채널별 예약 비중을 분산해 플랫폼 리스크를 낮춤', normal: '복수 채널은 있으나 의존도 관리와 대체 채널 육성이 부족함', danger: '특정 플랫폼 의존도가 높아 외부 변화에 매출이 크게 흔들릴 수 있음' },
    weight: { boutique: 4, social: 5, stay: 6 },
  },
  {
    question_id: 'acc_gap_1',
    category: 'weekday_weekend_gap',
    business_type: 'accommodation',
    question: '평일/주말 예약 편차에 맞춰 요금과 상품을 다르게 운영하나요?',
    answer_options: [
      { label: '요일별 예약률을 보고 평일 패키지·최소숙박일·요금을 조정한다', score: 5, status_text: '수요 편차를 상품과 가격으로 흡수하는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '주말이 강한 것은 알지만 별도 상품은 없다', score: 3, status_text: '평일 공실을 줄일 실험이 부족함', risk_level: 'medium', recommended_actions: ['act_acc_weekday_package'] },
      { label: '요일별 편차를 따로 분석하지 않는다', score: 1, status_text: '평일 공실과 주말 과소가격 문제가 동시에 생길 수 있음', risk_level: 'high', recommended_actions: ['act_acc_weekday_package'] },
    ],
    benchmark_text: { good: '요일별 수요 차이에 맞춰 요금·패키지·LOS를 유연하게 운영함', normal: '편차는 알고 있으나 상품화나 가격 실험은 부족함', danger: '요일별 수요를 몰라 평일 공실과 주말 수익 손실이 발생할 수 있음' },
    weight: { boutique: 4, social: 4, stay: 7 },
  },
  {
    question_id: 'acc_visual_1',
    category: 'visual_content_ctr',
    business_type: 'accommodation',
    question: '대표 사진과 상세 페이지가 예약 전환을 위한 디지털 로비 역할을 하나요?',
    answer_options: [
      { label: '전문 사진·노을/야간컷·공간감 영상까지 갖추고 클릭률을 본다', score: 5, status_text: '시각적 신뢰와 감성 전달력이 높은 상태', risk_level: 'low', recommended_actions: [] },
      { label: '사진은 충분하지만 클릭률이나 첫 사진 테스트는 하지 않는다', score: 3, status_text: '좋은 공간이어도 썸네일 경쟁에서 밀릴 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_hero_photo'] },
      { label: '사진이 오래됐거나 객실 일부만 보여준다', score: 1, status_text: '예약 전 신뢰 형성이 약해 전환율이 낮아질 수 있음', risk_level: 'high', recommended_actions: ['act_acc_hero_photo', 'act_acc_shortform_video'] },
    ],
    benchmark_text: { good: '대표 사진과 영상이 숙소의 X-Factor를 명확히 보여주고 클릭률을 관리함', normal: '사진은 있으나 썸네일/구도/CTR 관점의 개선은 부족함', danger: '사진 품질과 정보량이 부족해 고객이 예약 전 불확실성을 느낌' },
    weight: { boutique: 10, social: 7, stay: 3 },
  },
  {
    question_id: 'acc_conv_1',
    category: 'conversion_rate',
    business_type: 'accommodation',
    question: '상세 페이지 방문 후 예약 전환율을 확인하고 개선하나요?',
    answer_options: [
      { label: '방문-문의-예약 흐름을 추적하고 설명/사진/가격을 A/B 테스트한다', score: 5, status_text: '예약 퍼널의 병목을 개선할 수 있는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '예약 수는 보지만 방문 대비 전환율은 모른다', score: 3, status_text: '노출 문제와 상세 페이지 문제를 구분하기 어려움', risk_level: 'medium', recommended_actions: ['act_acc_conversion_check'] },
      { label: '예약이 적은 원인을 감으로만 판단한다', score: 1, status_text: '광고비를 써도 전환 병목이 남을 수 있음', risk_level: 'high', recommended_actions: ['act_acc_conversion_check'] },
    ],
    benchmark_text: { good: '상세 페이지 전환율을 보고 설명·사진·가격을 지속 개선함', normal: '예약 수는 보지만 퍼널별 원인 분석은 부족함', danger: '예약 저조 원인을 몰라 노출·콘텐츠·가격 중 무엇을 고칠지 불명확함' },
    weight: { boutique: 8, social: 6, stay: 5 },
  },
  {
    question_id: 'acc_reply_1',
    category: 'reply_speed',
    business_type: 'accommodation',
    question: '고객 문의와 예약 요청에 빠르게 응답하는 체계가 있나요?',
    answer_options: [
      { label: '자동응답/템플릿을 갖추고 대부분 1시간 내 응답한다', score: 5, status_text: '실시간 예약 시대에 맞는 응대 체계가 있음', risk_level: 'low', recommended_actions: [] },
      { label: '가능하면 빨리 답하지만 표준 템플릿은 없다', score: 3, status_text: '응대 품질과 속도가 상황에 따라 흔들릴 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_reply_template'] },
      { label: '문의 확인이 늦거나 답변 내용이 매번 다르다', score: 1, status_text: '예약 이탈과 낮은 만족도로 이어질 수 있음', risk_level: 'high', recommended_actions: ['act_acc_reply_template'] },
    ],
    benchmark_text: { good: '빠른 응답과 표준 안내로 예약 전 불안을 줄임', normal: '응답은 하지만 속도와 품질을 시스템화하지 못함', danger: '응답 지연과 안내 불일치로 예약 기회를 놓침' },
    weight: { boutique: 5, social: 7, stay: 5 },
  },
  {
    question_id: 'acc_review_1',
    category: 'review_reputation',
    business_type: 'accommodation',
    question: '최근 리뷰 수, 평점, 응답률을 신뢰 자산으로 관리하나요?',
    answer_options: [
      { label: '최근 리뷰를 매주 확인하고 체크아웃 직후 리뷰 요청/응답 루틴이 있다', score: 5, status_text: '사회적 증거가 꾸준히 축적되는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '리뷰는 확인하지만 요청과 답글 루틴은 없다', score: 3, status_text: '리뷰 최신성과 응답률이 약해질 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_review_automation'] },
      { label: '리뷰를 거의 관리하지 않는다', score: 1, status_text: '신규 고객의 예약 결정을 막는 요인이 될 수 있음', risk_level: 'high', recommended_actions: ['act_acc_review_automation'] },
    ],
    benchmark_text: { good: '최근 리뷰와 응답률을 관리해 신뢰 레이어를 강화함', normal: '리뷰 확인은 하지만 수집/응답 루틴이 체계적이지 않음', danger: '리뷰 최신성과 응답이 부족해 사회적 증거가 약함' },
    weight: { boutique: 7, social: 9, stay: 4 },
  },
  {
    question_id: 'acc_naver_1',
    category: 'naver_trust_layer',
    business_type: 'accommodation',
    question: '네이버 플레이스/블로그/카페에서 숙소 신뢰도를 구축하고 있나요?',
    answer_options: [
      { label: '플레이스 정보, 블로그 후기, 로컬 스토리 콘텐츠를 정기적으로 관리한다', score: 5, status_text: '한국형 검색 신뢰 레이어가 구축된 상태', risk_level: 'low', recommended_actions: [] },
      { label: '네이버 정보는 있으나 콘텐츠 업데이트가 드물다', score: 3, status_text: '검색 검증 단계에서 신뢰가 약할 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_naver_story'] },
      { label: '네이버 채널을 거의 관리하지 않는다', score: 1, status_text: '예약 전 검증 과정에서 경쟁 숙소에 밀릴 수 있음', risk_level: 'high', recommended_actions: ['act_acc_naver_story'] },
    ],
    benchmark_text: { good: '네이버 생태계에서 정보 정확성과 스토리 콘텐츠로 신뢰를 확보함', normal: '기본 정보는 있지만 후기와 스토리텔링 업데이트가 부족함', danger: '네이버 검증 채널이 약해 한국 고객의 신뢰 확보가 어려움' },
    weight: { boutique: 6, social: 8, stay: 4 },
  },
  {
    question_id: 'acc_amenity_1',
    category: 'amenity_transparency',
    business_type: 'accommodation',
    question: '어메니티와 생활 편의시설을 41개 이상 수준으로 구체적으로 안내하나요?',
    answer_options: [
      { label: '비품·편의시설·주의사항을 세부 리스트로 투명하게 공개한다', score: 5, status_text: '예약 전 불확실성을 낮추고 가격 정당성을 높이는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '주요 시설은 적었지만 세부 비품까지는 부족하다', score: 3, status_text: '고객이 머무는 장면을 충분히 상상하기 어려움', risk_level: 'medium', recommended_actions: ['act_acc_amenity_41'] },
      { label: '시설 안내가 짧거나 누락된 항목이 많다', score: 1, status_text: '문의 증가, 기대 불일치, 취소로 이어질 수 있음', risk_level: 'high', recommended_actions: ['act_acc_amenity_41'] },
    ],
    benchmark_text: { good: '41개 이상 수준의 세부 안내로 불확실성을 제거함', normal: '주요 시설 안내는 있으나 세부 어메니티와 생활 정보가 부족함', danger: '정보 부족으로 고객 기대치 관리와 가격 정당화가 어려움' },
    weight: { boutique: 7, social: 5, stay: 8 },
  },
  {
    question_id: 'acc_ugc_1',
    category: 'ugc_sns',
    business_type: 'accommodation',
    question: '고객이 자발적으로 공유하고 싶어지는 포토존과 SNS 경험이 있나요?',
    answer_options: [
      { label: '포토존, 언박싱 경험, 마이크로 인플루언서 협업을 운영한다', score: 5, status_text: 'UGC가 자연스럽게 쌓이는 구조가 있음', risk_level: 'low', recommended_actions: [] },
      { label: '사진 찍기 좋은 공간은 있지만 공유 유도 장치는 약하다', score: 3, status_text: '감성 자산이 실제 확산으로 연결되지 않을 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_ugc_spot'] },
      { label: 'SNS에 공유될 만한 장면을 설계하지 않았다', score: 1, status_text: '마케팅 비용 없이 확산되는 구조가 부족함', risk_level: 'high', recommended_actions: ['act_acc_ugc_spot', 'act_acc_micro_influencer'] },
    ],
    benchmark_text: { good: '포토존과 언박싱 경험이 UGC 플라이휠을 만들고 있음', normal: '공유될 요소는 있으나 고객 행동을 유도하는 장치가 약함', danger: 'SNS 확산 구조가 없어 숙소의 감성 경쟁력이 외부로 퍼지지 않음' },
    weight: { boutique: 6, social: 10, stay: 3 },
  },
  {
    question_id: 'acc_housekeeping_1',
    category: 'housekeeping_efficiency',
    business_type: 'accommodation',
    question: '청소/정비 비용과 품질을 수치로 관리하고 있나요?',
    answer_options: [
      { label: '건당 청소비, 소요 시간, 클레임을 기록하고 내재화/외주를 비교한다', score: 5, status_text: '운영 비용을 가격 경쟁력으로 전환할 수 있는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '청소 품질은 관리하지만 비용 효율 분석은 부족하다', score: 3, status_text: '마진을 갉아먹는 비용 구조를 놓칠 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_housekeeping_cost'] },
      { label: '청소 비용과 품질 문제를 별도 데이터로 남기지 않는다', score: 1, status_text: '운영비 증가와 리뷰 악화를 늦게 발견할 수 있음', risk_level: 'high', recommended_actions: ['act_acc_housekeeping_cost'] },
    ],
    benchmark_text: { good: '하우스키핑 비용과 품질을 함께 관리해 마진과 리뷰를 보호함', normal: '품질 관리는 하지만 비용 효율과 대안 비교가 부족함', danger: '청소 비용과 클레임을 추적하지 않아 수익성과 평판 리스크가 큼' },
    weight: { boutique: 3, social: 3, stay: 8 },
  },
  {
    question_id: 'acc_cancel_1',
    category: 'cancellation_rate',
    business_type: 'accommodation',
    question: '취소율과 취소 원인을 추적해 고객 기대치를 조정하나요?',
    answer_options: [
      { label: '취소율과 사유를 기록하고 상세 설명/정책/안내 메시지를 개선한다', score: 5, status_text: '기대 불일치와 예약 불안을 관리하는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '취소 건은 보지만 원인 분류는 하지 않는다', score: 3, status_text: '반복 취소 원인을 놓칠 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_cancel_reason'] },
      { label: '취소율을 따로 보지 않는다', score: 1, status_text: '매출 예측과 고객 기대치 관리가 불안정함', risk_level: 'high', recommended_actions: ['act_acc_cancel_reason'] },
    ],
    benchmark_text: { good: '취소율과 원인을 분석해 정책과 안내 문구를 개선함', normal: '취소 현황은 보지만 원인별 개선 루틴은 부족함', danger: '취소 데이터를 보지 않아 예약 안정성과 매출 예측력이 낮음' },
    weight: accommodationWeights,
  },
]

export const QUESTIONS_BY_INDUSTRY = {
  restaurant: RESTAURANT_QUESTIONS,
  accommodation: ACCOMMODATION_QUESTIONS,
}
