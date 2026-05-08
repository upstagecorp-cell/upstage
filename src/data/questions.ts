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
