import { DiagnosisQuestion } from './types'

export const RESTAURANT_QUESTIONS: DiagnosisQuestion[] = [

  // ─────────────────────────────────────────────
  // 1. 주 고객층 (main_customer)
  // ─────────────────────────────────────────────
  {
    question_id: 'rest_mc_1',
    category: 'main_customer',
    business_type: 'restaurant',
    question: '최근 30일 매출/방문 기록에서 상위 고객층 1~2개를 숫자로 구분해 두었나요?',
    answer_options: [
      {
        label: '상위 고객층의 연령대·방문 목적·매출 비중을 수치로 정리했다',
        score: 5,
        status_text: '고객 이해도가 높아 타깃 마케팅이 가능한 상태',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '자주 오는 고객 유형은 알지만 매출/방문 비중은 계산하지 않았다',
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
    question: '최근 30일 내 고객 10명 이상에게 방문 이유를 직접 물어보고 기록했나요?',
    answer_options: [
      {
        label: '10명 이상에게 방문 이유를 물어보고 공통 이유를 정리했다',
        score: 5,
        status_text: '방문 동기 파악을 통해 메뉴·서비스 개선이 가능한 상태',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '몇 명에게 들은 적은 있지만 10명 이상 기록은 없다',
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
    question: '최근 3개월 내 상권 데이터나 직접 관찰로 시간대별 유동 인구를 기록했나요?',
    answer_options: [
      {
        label: '시간대별 유동 인구와 주요 고객 특성을 숫자로 기록했다',
        score: 5,
        status_text: '상권 이해도가 높아 운영 시간·메뉴 전략 최적화 가능',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '바쁜 시간대는 알지만 유동 인구 수치는 기록하지 않았다',
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
    question: '최근 3개월 내 반경 300m 경쟁 음식점 3곳 이상을 비교표로 정리했나요?',
    answer_options: [
      {
        label: '반경 300m 내 경쟁점 수·강약점을 정리해 두었다',
        score: 5,
        status_text: '경쟁 환경 이해를 바탕으로 차별화 전략 수립 가능',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '경쟁점은 알고 있지만 3곳 이상 비교표는 없다',
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
    question: '최근 30일 매출을 점심·저녁·주말로 나눠 비율을 계산했나요?',
    answer_options: [
      {
        label: '시간대별 매출 비율을 계산했고 인력/메뉴 운영에 반영했다',
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
    question: '최근 30일 기준 매출이 가장 낮은 시간대에 개선 실험을 1회 이상 실행했나요?',
    answer_options: [
      {
        label: '비피크타임 전용 메뉴·할인·이벤트를 1회 이상 실행했다',
        score: 5,
        status_text: '매출 공백 시간대를 전략적으로 채우고 있는 상태',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '낮은 시간대는 파악했지만 아직 실행한 실험은 없다',
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
    question: '최근 30일 리뷰/주문 데이터에서 대표 메뉴가 선택되는 이유를 3건 이상 확인했나요?',
    answer_options: [
      {
        label: '리뷰·설문·재주문에서 차별화 이유가 3건 이상 확인된다',
        score: 5,
        status_text: '대표 메뉴의 경쟁력이 확보되어 재방문과 추천을 유도하고 있음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '차별화 요소는 있다고 생각하지만 고객 반응 기록은 3건 미만이다',
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
    question: '대표 메뉴 3개의 이름·사진·설명이 모든 판매 채널에 최신 상태로 등록되어 있나요?',
    answer_options: [
      {
        label: '대표 메뉴 3개 모두 이름·사진·설명이 있고 최근 3개월 내 업데이트했다',
        score: 5,
        status_text: '메뉴 표현력이 높아 첫 방문 고객의 선택을 돕고 있음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '메뉴명은 있지만 사진 또는 설명이 빠진 대표 메뉴가 있다',
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
    question: '최근 30일 기준 대표 메뉴 3개의 원가율을 계산했나요?',
    answer_options: [
      {
        label: '대표 메뉴 3개 모두 최근 30일 내 원가율을 계산했다',
        score: 5,
        status_text: '원가 관리가 잘 되고 있음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '일부 메뉴만 계산했거나 30일 이전 자료만 있다',
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
    question: '전체 메뉴 중 고마진/저마진 메뉴를 구분하고 판매 비중을 기록하나요?',
    answer_options: [
      {
        label: '메뉴별 마진율과 판매 비중을 보고 고마진 메뉴를 노출한다',
        score: 5,
        status_text: '수익성 높은 메뉴 중심으로 운영되어 수익 구조가 최적화되어 있음',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '남는 메뉴는 대략 알지만 판매 비중까지 기록하지 않는다',
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
    question: '최근 30일 기준 1인당 평균 지출 금액(객단가)을 계산했나요?',
    answer_options: [
      {
        label: '최근 30일 객단가와 다음 달 목표 객단가가 숫자로 있다',
        score: 5,
        status_text: '객단가 관리가 잘 이루어져 수익 목표 달성이 용이함',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '대략적인 수준은 알지만 최근 30일 계산값은 없다',
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
    question: '최근 30일 내 객단가를 높이기 위한 세트/추가 메뉴 실험을 1회 이상 실행했나요?',
    answer_options: [
      {
        label: '세트/추가 메뉴/추천 문구 실험을 실행했고 객단가 변화를 기록했다',
        score: 5,
        status_text: '객단가 향상 전략이 운영되어 수익 효율이 높은 상태',
        risk_level: 'low',
        recommended_actions: [],
      },
      {
        label: '아이디어는 있지만 최근 30일 내 실행 기록은 없다',
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
    question: '최근 7일 피크타임 기준 테이블별 회전 횟수와 평균 체류 시간을 기록했나요?',
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
    question: '최근 30일 대기 발생 시 주문·서빙·결제 시간을 줄이는 개선을 1회 이상 실행했나요?',
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
    question: '최근 7일 배달앱 주요 키워드 검색 순위와 노출 위치를 기록했나요?',
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
    question: '배달앱 상위 판매 메뉴 5개의 사진·설명을 최근 3개월 내 업데이트했나요?',
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
    question: '최근 30일 리뷰 수, 평균 평점, 부정 리뷰 비율을 기록했나요?',
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
    question: '최근 30일 고객에게 리뷰 요청을 몇 건 실행했고 리뷰 전환을 기록했나요?',
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
    question: '최근 30일 내 네이버 플레이스 영업시간·메뉴·전화번호를 점검했나요?',
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
    question: '최근 3개월 내 네이버 플레이스에 내부·외부·대표 메뉴 사진을 10장 이상 업데이트했나요?',
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
    question: '최근 30일 전체 고객 중 2회 이상 방문한 재방문 고객 비율을 계산했나요?',
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
    question: '최근 30일 재방문 쿠폰/스탬프/문자 등 재방문 유도 실험을 1회 이상 실행했나요?',
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
    question: '최근 60일 방문이 끊긴 단골 고객에게 재방문 메시지나 혜택을 발송했나요?',
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
    question: '최근 30일 예약/문의 고객을 기준으로 핵심 타겟 1개와 예약 이유 3개를 문서화했나요?',
    answer_options: [
      { label: '핵심 타겟 1개와 예약 이유 3개가 문서화되어 상세 페이지에 반영됐다', score: 5, status_text: '가격 경쟁이 아닌 컨셉 경쟁을 할 수 있는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '대략적인 컨셉은 있지만 예약 고객 기준의 문서화는 없다', score: 3, status_text: '컨셉은 있으나 예약 이유로 연결되는 메시지가 약할 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_positioning_matrix'] },
      { label: '위치와 가격 외에 뚜렷한 포지셔닝이 없다', score: 1, status_text: '대체 가능한 숙소로 보일 가능성이 높음', risk_level: 'high', recommended_actions: ['act_acc_positioning_matrix', 'act_acc_competitor_xfactor'] },
    ],
    benchmark_text: { good: '타겟 고객, 컨셉, X-Factor가 명확해 상세 페이지와 가격 전략에 일관되게 반영됨', normal: '컨셉은 있으나 고객 페르소나와 메시지가 충분히 구체화되지 않음', danger: '숙소가 누구를 위한 어떤 경험인지 불명확해 가격 경쟁에 노출됨' },
    weight: { boutique: 9, social: 8, stay: 4 },
  },
  {
    question_id: 'acc_occ_1',
    category: 'occupancy_rate',
    business_type: 'accommodation',
    question: '최근 30일 객실 점유율을 계산하고 62% 이하 날짜 수를 확인했나요?',
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
    question: '최근 30일 ADR과 RevPAR를 계산하고 요일/성수기별 가격 조정에 반영했나요?',
    answer_options: [
      { label: '최근 30일 ADR·RevPAR를 계산했고 가격 조정 기준으로 사용한다', score: 5, status_text: '점유율과 객단가의 균형을 관리하는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '평균 객실 단가는 알지만 최근 30일 RevPAR 계산값은 없다', score: 3, status_text: '수익 효율보다 단순 가격에 의존할 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_revpar_sheet'] },
      { label: '주변 시세를 보고 감으로 가격을 정한다', score: 1, status_text: '브랜드 가치와 수익성을 동시에 놓칠 위험이 큼', risk_level: 'high', recommended_actions: ['act_acc_revpar_sheet'] },
    ],
    benchmark_text: { good: 'ADR과 RevPAR를 기준으로 가격을 조정하고 객실당 수익을 관리함', normal: '객단가는 알지만 점유율과 결합한 수익 효율 분석은 부족함', danger: '감에 의존해 가격을 정해 저가 경쟁 또는 공실 리스크가 큼' },
    weight: { boutique: 9, social: 4, stay: 8 },
  },
  {
    question_id: 'acc_direct_1',
    category: 'direct_booking_share',
    business_type: 'accommodation',
    question: '최근 30일 전체 예약 중 직접 예약 비중과 OTA 수수료 금액을 계산했나요?',
    answer_options: [
      { label: '직접 예약 비중과 OTA 수수료 금액을 최근 30일 기준으로 계산했다', score: 5, status_text: '플랫폼 비용과 고객 데이터를 함께 관리하는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '직접 문의는 받지만 예약 비중과 수수료 금액은 계산하지 않는다', score: 3, status_text: '직접 예약 성장 가능성이 수치로 관리되지 않음', risk_level: 'medium', recommended_actions: ['act_acc_direct_booking_link'] },
      { label: '예약은 거의 OTA에만 의존한다', score: 1, status_text: '수수료와 플랫폼 정책 변화에 취약한 상태', risk_level: 'high', recommended_actions: ['act_acc_direct_booking_link', 'act_acc_ota_mix'] },
    ],
    benchmark_text: { good: '직접 예약 비중을 높이며 OTA 수수료와 고객 데이터 손실을 줄이고 있음', normal: '직접 문의는 있으나 채널과 성과 관리가 체계적이지 않음', danger: 'OTA 의존으로 수수료와 정책 리스크에 그대로 노출됨' },
    weight: { boutique: 5, social: 5, stay: 9 },
  },
  {
    question_id: 'acc_ota_1',
    category: 'ota_dependency',
    business_type: 'accommodation',
    question: '최근 30일 예약을 채널별로 나누고 1위 플랫폼 매출 비중을 계산했나요?',
    answer_options: [
      { label: '채널별 예약 비중을 계산했고 1위 플랫폼 비중을 관리한다', score: 5, status_text: '채널 리스크를 관리하는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '여러 채널에 등록되어 있지만 최근 30일 비중 계산은 없다', score: 3, status_text: '실제 매출은 특정 채널에 쏠려 있을 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_ota_mix'] },
      { label: '채널별 예약 비중을 전혀 계산하지 않는다', score: 1, status_text: '노출 정책·수수료·보안 이슈에 취약함', risk_level: 'high', recommended_actions: ['act_acc_ota_mix'] },
    ],
    benchmark_text: { good: '채널별 예약 비중을 분산해 플랫폼 리스크를 낮춤', normal: '복수 채널은 있으나 의존도 관리와 대체 채널 육성이 부족함', danger: '특정 플랫폼 의존도가 높아 외부 변화에 매출이 크게 흔들릴 수 있음' },
    weight: { boutique: 4, social: 5, stay: 6 },
  },
  {
    question_id: 'acc_gap_1',
    category: 'weekday_weekend_gap',
    business_type: 'accommodation',
    question: '최근 30일 평일/주말 예약률 차이를 계산하고 평일 상품 실험을 실행했나요?',
    answer_options: [
      { label: '요일별 예약률 차이를 계산했고 평일 패키지/요금 실험을 실행했다', score: 5, status_text: '수요 편차를 상품과 가격으로 흡수하는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '주말이 강한 것은 알지만 최근 30일 평일 실험은 없다', score: 3, status_text: '평일 공실을 줄일 실험이 부족함', risk_level: 'medium', recommended_actions: ['act_acc_weekday_package'] },
      { label: '요일별 편차를 따로 분석하지 않는다', score: 1, status_text: '평일 공실과 주말 과소가격 문제가 동시에 생길 수 있음', risk_level: 'high', recommended_actions: ['act_acc_weekday_package'] },
    ],
    benchmark_text: { good: '요일별 수요 차이에 맞춰 요금·패키지·LOS를 유연하게 운영함', normal: '편차는 알고 있으나 상품화나 가격 실험은 부족함', danger: '요일별 수요를 몰라 평일 공실과 주말 수익 손실이 발생할 수 있음' },
    weight: { boutique: 4, social: 4, stay: 7 },
  },
  {
    question_id: 'acc_visual_1',
    category: 'visual_content_ctr',
    business_type: 'accommodation',
    question: '최근 3개월 내 대표 사진을 교체하고 조회/클릭/문의 변화를 기록했나요?',
    answer_options: [
      { label: '대표 사진을 교체했고 전후 조회/클릭/문의 변화를 기록했다', score: 5, status_text: '시각적 신뢰와 감성 전달력이 높은 상태', risk_level: 'low', recommended_actions: [] },
      { label: '사진은 충분하지만 최근 3개월 내 대표 사진 테스트 기록은 없다', score: 3, status_text: '좋은 공간이어도 썸네일 경쟁에서 밀릴 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_hero_photo'] },
      { label: '사진이 오래됐거나 객실 일부만 보여준다', score: 1, status_text: '예약 전 신뢰 형성이 약해 전환율이 낮아질 수 있음', risk_level: 'high', recommended_actions: ['act_acc_hero_photo', 'act_acc_shortform_video'] },
    ],
    benchmark_text: { good: '대표 사진과 영상이 숙소의 X-Factor를 명확히 보여주고 클릭률을 관리함', normal: '사진은 있으나 썸네일/구도/CTR 관점의 개선은 부족함', danger: '사진 품질과 정보량이 부족해 고객이 예약 전 불확실성을 느낌' },
    weight: { boutique: 10, social: 7, stay: 3 },
  },
  {
    question_id: 'acc_conv_1',
    category: 'conversion_rate',
    business_type: 'accommodation',
    question: '최근 30일 상세 페이지 조회 수 대비 문의/예약 전환율을 계산했나요?',
    answer_options: [
      { label: '조회-문의-예약 전환율을 계산했고 설명/사진/가격 개선에 반영했다', score: 5, status_text: '예약 퍼널의 병목을 개선할 수 있는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '예약 수는 보지만 최근 30일 조회 대비 전환율은 모른다', score: 3, status_text: '노출 문제와 상세 페이지 문제를 구분하기 어려움', risk_level: 'medium', recommended_actions: ['act_acc_conversion_check'] },
      { label: '예약이 적은 원인을 감으로만 판단한다', score: 1, status_text: '광고비를 써도 전환 병목이 남을 수 있음', risk_level: 'high', recommended_actions: ['act_acc_conversion_check'] },
    ],
    benchmark_text: { good: '상세 페이지 전환율을 보고 설명·사진·가격을 지속 개선함', normal: '예약 수는 보지만 퍼널별 원인 분석은 부족함', danger: '예약 저조 원인을 몰라 노출·콘텐츠·가격 중 무엇을 고칠지 불명확함' },
    weight: { boutique: 8, social: 6, stay: 5 },
  },
  {
    question_id: 'acc_reply_1',
    category: 'reply_speed',
    business_type: 'accommodation',
    question: '최근 30일 고객 문의의 평균 첫 응답 시간을 계산했나요?',
    answer_options: [
      { label: '평균 첫 응답 시간이 1시간 이내이고 템플릿을 사용한다', score: 5, status_text: '실시간 예약 시대에 맞는 응대 체계가 있음', risk_level: 'low', recommended_actions: [] },
      { label: '빠르게 답하려고 하지만 평균 응답 시간 계산값은 없다', score: 3, status_text: '응대 품질과 속도가 상황에 따라 흔들릴 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_reply_template'] },
      { label: '문의 확인이 늦거나 답변 내용이 매번 다르다', score: 1, status_text: '예약 이탈과 낮은 만족도로 이어질 수 있음', risk_level: 'high', recommended_actions: ['act_acc_reply_template'] },
    ],
    benchmark_text: { good: '빠른 응답과 표준 안내로 예약 전 불안을 줄임', normal: '응답은 하지만 속도와 품질을 시스템화하지 못함', danger: '응답 지연과 안내 불일치로 예약 기회를 놓침' },
    weight: { boutique: 5, social: 7, stay: 5 },
  },
  {
    question_id: 'acc_review_1',
    category: 'review_reputation',
    business_type: 'accommodation',
    question: '최근 30일 리뷰 수, 평균 평점, 리뷰 답글 응답률을 기록했나요?',
    answer_options: [
      { label: '리뷰 수·평점·응답률을 기록하고 체크아웃 리뷰 요청을 운영한다', score: 5, status_text: '사회적 증거가 꾸준히 축적되는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '리뷰는 확인하지만 응답률과 요청 건수는 기록하지 않는다', score: 3, status_text: '리뷰 최신성과 응답률이 약해질 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_review_automation'] },
      { label: '리뷰를 거의 관리하지 않는다', score: 1, status_text: '신규 고객의 예약 결정을 막는 요인이 될 수 있음', risk_level: 'high', recommended_actions: ['act_acc_review_automation'] },
    ],
    benchmark_text: { good: '최근 리뷰와 응답률을 관리해 신뢰 레이어를 강화함', normal: '리뷰 확인은 하지만 수집/응답 루틴이 체계적이지 않음', danger: '리뷰 최신성과 응답이 부족해 사회적 증거가 약함' },
    weight: { boutique: 7, social: 9, stay: 4 },
  },
  {
    question_id: 'acc_naver_1',
    category: 'naver_trust_layer',
    business_type: 'accommodation',
    question: '최근 30일 네이버 플레이스 업데이트와 블로그/카페 후기 노출 건수를 확인했나요?',
    answer_options: [
      { label: '플레이스 정보를 갱신했고 블로그/카페 후기 노출 건수를 기록했다', score: 5, status_text: '한국형 검색 신뢰 레이어가 구축된 상태', risk_level: 'low', recommended_actions: [] },
      { label: '네이버 정보는 있으나 최근 30일 후기/콘텐츠 노출 건수는 모른다', score: 3, status_text: '검색 검증 단계에서 신뢰가 약할 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_naver_story'] },
      { label: '네이버 채널을 거의 관리하지 않는다', score: 1, status_text: '예약 전 검증 과정에서 경쟁 숙소에 밀릴 수 있음', risk_level: 'high', recommended_actions: ['act_acc_naver_story'] },
    ],
    benchmark_text: { good: '네이버 생태계에서 정보 정확성과 스토리 콘텐츠로 신뢰를 확보함', normal: '기본 정보는 있지만 후기와 스토리텔링 업데이트가 부족함', danger: '네이버 검증 채널이 약해 한국 고객의 신뢰 확보가 어려움' },
    weight: { boutique: 6, social: 8, stay: 4 },
  },
  {
    question_id: 'acc_amenity_1',
    category: 'amenity_transparency',
    business_type: 'accommodation',
    question: '상세 페이지에 어메니티와 생활 편의시설을 41개 이상 항목으로 안내하고 있나요?',
    answer_options: [
      { label: '41개 이상 항목을 세부 리스트로 공개하고 없는 항목도 명시했다', score: 5, status_text: '예약 전 불확실성을 낮추고 가격 정당성을 높이는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '주요 시설은 적었지만 41개 미만이거나 세부 비품이 부족하다', score: 3, status_text: '고객이 머무는 장면을 충분히 상상하기 어려움', risk_level: 'medium', recommended_actions: ['act_acc_amenity_41'] },
      { label: '시설 안내가 짧거나 누락된 항목이 많다', score: 1, status_text: '문의 증가, 기대 불일치, 취소로 이어질 수 있음', risk_level: 'high', recommended_actions: ['act_acc_amenity_41'] },
    ],
    benchmark_text: { good: '41개 이상 수준의 세부 안내로 불확실성을 제거함', normal: '주요 시설 안내는 있으나 세부 어메니티와 생활 정보가 부족함', danger: '정보 부족으로 고객 기대치 관리와 가격 정당화가 어려움' },
    weight: { boutique: 7, social: 5, stay: 8 },
  },
  {
    question_id: 'acc_ugc_1',
    category: 'ugc_sns',
    business_type: 'accommodation',
    question: '최근 30일 고객이 SNS/블로그에 자발적으로 올린 숙소 콘텐츠가 몇 건인가요?',
    answer_options: [
      { label: '최근 30일 자발적 게시물이 5건 이상이고 포토존/공유 장치를 운영한다', score: 5, status_text: 'UGC가 자연스럽게 쌓이는 구조가 있음', risk_level: 'low', recommended_actions: [] },
      { label: '자발적 게시물이 1~4건 있거나 건수는 있지만 공유 장치가 약하다', score: 3, status_text: '감성 자산이 실제 확산으로 연결되지 않을 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_ugc_spot'] },
      { label: '최근 30일 자발적 게시물 건수를 모른다', score: 1, status_text: '마케팅 비용 없이 확산되는 구조가 부족함', risk_level: 'high', recommended_actions: ['act_acc_ugc_spot', 'act_acc_micro_influencer'] },
    ],
    benchmark_text: { good: '포토존과 언박싱 경험이 UGC 플라이휠을 만들고 있음', normal: '공유될 요소는 있으나 고객 행동을 유도하는 장치가 약함', danger: 'SNS 확산 구조가 없어 숙소의 감성 경쟁력이 외부로 퍼지지 않음' },
    weight: { boutique: 6, social: 10, stay: 3 },
  },
  {
    question_id: 'acc_housekeeping_1',
    category: 'housekeeping_efficiency',
    business_type: 'accommodation',
    question: '최근 30일 건당 청소비, 청소 소요 시간, 청소 관련 클레임 수를 기록했나요?',
    answer_options: [
      { label: '건당 청소비·소요 시간·클레임 수를 기록하고 외주/내재화를 비교했다', score: 5, status_text: '운영 비용을 가격 경쟁력으로 전환할 수 있는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '청소 품질은 보지만 비용/시간/클레임을 모두 기록하진 않는다', score: 3, status_text: '마진을 갉아먹는 비용 구조를 놓칠 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_housekeeping_cost'] },
      { label: '청소 비용과 품질 문제를 별도 데이터로 남기지 않는다', score: 1, status_text: '운영비 증가와 리뷰 악화를 늦게 발견할 수 있음', risk_level: 'high', recommended_actions: ['act_acc_housekeeping_cost'] },
    ],
    benchmark_text: { good: '하우스키핑 비용과 품질을 함께 관리해 마진과 리뷰를 보호함', normal: '품질 관리는 하지만 비용 효율과 대안 비교가 부족함', danger: '청소 비용과 클레임을 추적하지 않아 수익성과 평판 리스크가 큼' },
    weight: { boutique: 3, social: 3, stay: 8 },
  },
  {
    question_id: 'acc_cancel_1',
    category: 'cancellation_rate',
    business_type: 'accommodation',
    question: '최근 30일 예약 취소율과 취소 사유 상위 1~3개를 기록했나요?',
    answer_options: [
      { label: '취소율과 사유 상위 1~3개를 기록하고 안내/정책을 수정했다', score: 5, status_text: '기대 불일치와 예약 불안을 관리하는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '취소 건은 보지만 최근 30일 취소율이나 사유 순위는 없다', score: 3, status_text: '반복 취소 원인을 놓칠 수 있음', risk_level: 'medium', recommended_actions: ['act_acc_cancel_reason'] },
      { label: '취소율을 따로 보지 않는다', score: 1, status_text: '매출 예측과 고객 기대치 관리가 불안정함', risk_level: 'high', recommended_actions: ['act_acc_cancel_reason'] },
    ],
    benchmark_text: { good: '취소율과 원인을 분석해 정책과 안내 문구를 개선함', normal: '취소 현황은 보지만 원인별 개선 루틴은 부족함', danger: '취소 데이터를 보지 않아 예약 안정성과 매출 예측력이 낮음' },
    weight: accommodationWeights,
  },
]

const cafeWeights = { cafe_takeout: 6, cafe_stay: 6, cafe_dessert: 6, cafe_craft: 6, cafe_local: 6 }

export const CAFE_QUESTIONS: DiagnosisQuestion[] = [
  {
    question_id: 'cafe_pos_1',
    category: 'cafe_positioning',
    business_type: 'cafe',
    question: '최근 30일 고객을 기준으로 우리 카페의 핵심 고객군·방문 상황·핵심 니즈를 1개씩 문서화했나요?',
    answer_options: [
      { label: '고객군, 방문 상황, 핵심 니즈가 문서화되어 메뉴/공간/홍보 문구에 반영됐다', score: 5, status_text: '모든 고객이 아닌 핵심 고객에게 맞춘 운영이 가능한 상태', risk_level: 'low', recommended_actions: [] },
      { label: '대략적인 타겟은 있지만 최근 30일 고객 기준의 문서화는 없다', score: 3, status_text: '운영 판단이 감각에 의존할 수 있음', risk_level: 'medium', recommended_actions: ['act_cafe_positioning'] },
      { label: '누구를 위한 카페인지 구체적으로 정리한 적이 없다', score: 1, status_text: '메뉴·공간·홍보가 넓고 흐릿해질 위험이 큼', risk_level: 'high', recommended_actions: ['act_cafe_positioning'] },
    ],
    benchmark_text: { good: 'Who-Occasion-Need 기준으로 포지셔닝이 정리되어 운영에 반영됨', normal: '타겟 감각은 있으나 최근 데이터 기반 문서화가 부족함', danger: '핵심 고객과 방문 이유가 불명확해 차별화가 약함' },
    weight: { cafe_takeout: 5, cafe_stay: 8, cafe_dessert: 7, cafe_craft: 9, cafe_local: 7 },
  },
  {
    question_id: 'cafe_sig_1',
    category: 'signature_menu',
    business_type: 'cafe',
    question: '최근 30일 시그니처 메뉴의 주문 비중과 SNS/리뷰 언급 건수를 기록했나요?',
    answer_options: [
      { label: '시그니처 주문 비중과 SNS/리뷰 언급 건수를 기록했고 개선에 반영했다', score: 5, status_text: '대표 메뉴가 실제 선택 이유로 검증되는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '대표 메뉴는 있지만 주문 비중 또는 언급 건수는 기록하지 않는다', score: 3, status_text: '대표 메뉴가 고객에게 얼마나 먹히는지 불명확함', risk_level: 'medium', recommended_actions: ['act_cafe_signature_menu'] },
      { label: '시그니처라고 부를 만한 메뉴가 없거나 수치를 모른다', score: 1, status_text: '가격 경쟁을 벗어날 토크 트리거가 부족함', risk_level: 'high', recommended_actions: ['act_cafe_signature_menu'] },
    ],
    benchmark_text: { good: '시그니처 메뉴가 주문과 자발적 언급으로 검증됨', normal: '대표 메뉴는 있으나 고객 반응 수치가 부족함', danger: '압도적 시그니처가 없어 선택 이유와 바이럴이 약함' },
    weight: { cafe_takeout: 4, cafe_stay: 5, cafe_dessert: 10, cafe_craft: 9, cafe_local: 5 },
  },
  {
    question_id: 'cafe_cost_1',
    category: 'menu_cost_rate_cafe',
    business_type: 'cafe',
    question: '최근 30일 상위 음료/디저트 5개의 원가율과 마진율을 계산했나요?',
    answer_options: [
      { label: '상위 5개 메뉴의 원가율·마진율·판매 비중을 계산했다', score: 5, status_text: '수익성 높은 메뉴 중심으로 운영을 조정할 수 있음', risk_level: 'low', recommended_actions: [] },
      { label: '일부 메뉴 원가는 알지만 상위 5개 전체와 판매 비중은 없다', score: 3, status_text: '저마진 인기 메뉴가 수익을 갉아먹을 수 있음', risk_level: 'medium', recommended_actions: ['act_cafe_cost_margin'] },
      { label: '음료/디저트 원가율을 계산하지 않는다', score: 1, status_text: '많이 팔수록 손해 보는 메뉴를 놓칠 수 있음', risk_level: 'high', recommended_actions: ['act_cafe_cost_margin'] },
    ],
    benchmark_text: { good: '상위 메뉴의 원가율과 판매 비중을 함께 관리함', normal: '원가 일부는 알지만 마진 구조 관리가 부족함', danger: '원가율을 몰라 수익성 판단이 불가능함' },
    weight: { cafe_takeout: 7, cafe_stay: 5, cafe_dessert: 6, cafe_craft: 6, cafe_local: 4 },
  },
  {
    question_id: 'cafe_basket_1',
    category: 'avg_basket_size',
    business_type: 'cafe',
    question: '최근 30일 객단가(APC)와 베이커리/디저트 결합률을 계산했나요?',
    answer_options: [
      { label: '객단가와 디저트 결합률을 계산했고 세트/추천 문구에 반영했다', score: 5, status_text: '음료 외 추가 매출을 데이터로 키우는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '객단가는 대략 알지만 디저트 결합률은 계산하지 않는다', score: 3, status_text: '고마진 추가 판매 기회를 놓칠 수 있음', risk_level: 'medium', recommended_actions: ['act_cafe_basket_pairing'] },
      { label: '객단가와 결합률을 모두 모른다', score: 1, status_text: '매출 개선의 기준점이 없는 상태', risk_level: 'high', recommended_actions: ['act_cafe_basket_pairing'] },
    ],
    benchmark_text: { good: '객단가와 결합률을 기준으로 페어링 판매를 개선함', normal: '객단가 감각은 있으나 추가 판매 데이터가 부족함', danger: '객단가를 몰라 가격과 세트 전략을 세우기 어려움' },
    weight: { cafe_takeout: 7, cafe_stay: 9, cafe_dessert: 8, cafe_craft: 6, cafe_local: 6 },
  },
  {
    question_id: 'cafe_wait_1',
    category: 'peak_wait_time',
    business_type: 'cafe',
    question: '최근 7일 피크타임 평균 대기 시간이 5분 이내인지 측정했나요?',
    answer_options: [
      { label: '피크타임 대기 시간을 측정했고 평균 5분 이내로 관리된다', score: 5, status_text: '속도와 정확성이 고객 경험을 해치지 않는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '대기 체감은 알지만 최근 7일 평균 시간을 측정하지 않았다', score: 3, status_text: '불편이 반복되어도 원인을 숫자로 잡기 어려움', risk_level: 'medium', recommended_actions: ['act_cafe_peak_timer'] },
      { label: '피크타임 대기 시간을 전혀 측정하지 않는다', score: 1, status_text: '출근길/점심 고객 이탈 가능성이 높음', risk_level: 'high', recommended_actions: ['act_cafe_peak_timer'] },
    ],
    benchmark_text: { good: '피크타임 대기 5분 이내를 측정하고 유지함', normal: '대기 문제는 알지만 측정 루틴이 부족함', danger: '대기 시간이 관리되지 않아 빠른 고객층을 잃을 수 있음' },
    weight: { cafe_takeout: 10, cafe_stay: 5, cafe_dessert: 3, cafe_craft: 3, cafe_local: 5 },
  },
  {
    question_id: 'cafe_order_1',
    category: 'digital_ordering',
    business_type: 'cafe',
    question: '최근 30일 키오스크/모바일/전화 선주문 비중과 주문 오류 건수를 기록했나요?',
    answer_options: [
      { label: '디지털/선주문 비중과 주문 오류 건수를 기록하고 피크 운영에 반영했다', score: 5, status_text: '마찰 없는 주문 경험을 설계하는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '키오스크나 선주문은 있지만 비중과 오류 건수는 기록하지 않는다', score: 3, status_text: '디지털 전환 효과를 판단하기 어려움', risk_level: 'medium', recommended_actions: ['act_cafe_preorder_check'] },
      { label: '디지털 주문 체계가 없거나 작동 여부를 모른다', score: 1, status_text: '피크타임 처리량과 고객 편의성이 낮을 수 있음', risk_level: 'high', recommended_actions: ['act_cafe_preorder_check'] },
    ],
    benchmark_text: { good: '디지털 주문 비중과 오류를 관리해 피크 처리량을 높임', normal: '도구는 있지만 성과 측정이 부족함', danger: '프리오더/키오스크 운영이 약해 대기와 오류가 커질 수 있음' },
    weight: { cafe_takeout: 10, cafe_stay: 4, cafe_dessert: 3, cafe_craft: 3, cafe_local: 4 },
  },
  {
    question_id: 'cafe_loyalty_1',
    category: 'wallet_loyalty',
    business_type: 'cafe',
    question: '최근 30일 앱 설치 없이 가입 가능한 디지털 멤버십 가입자 수와 재방문율을 기록했나요?',
    answer_options: [
      { label: '디지털 멤버십 가입자 수와 재방문율을 기록하고 리워드를 운영한다', score: 5, status_text: '종이 쿠폰보다 낮은 마찰로 재방문 데이터를 쌓는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '쿠폰/멤버십은 있지만 가입자 수와 재방문율은 기록하지 않는다', score: 3, status_text: '충성 고객 관리가 감각에 머무를 수 있음', risk_level: 'medium', recommended_actions: ['act_cafe_wallet_loyalty'] },
      { label: '멤버십이나 재방문 기록 체계가 없다', score: 1, status_text: '한 번 온 고객을 다시 부르는 시스템이 부족함', risk_level: 'high', recommended_actions: ['act_cafe_wallet_loyalty'] },
    ],
    benchmark_text: { good: '앱 설치 없는 로열티로 가입과 재방문 데이터를 관리함', normal: '혜택은 있으나 데이터 추적이 약함', danger: '재방문 시스템이 없어 신규 고객 유치에만 의존함' },
    weight: { cafe_takeout: 6, cafe_stay: 6, cafe_dessert: 5, cafe_craft: 4, cafe_local: 7 },
  },
  {
    question_id: 'cafe_seo_1',
    category: 'local_seo',
    business_type: 'cafe',
    question: '최근 30일 네이버/구글 지도에서 핵심 키워드 검색 순위와 정보 최신성을 점검했나요?',
    answer_options: [
      { label: '핵심 키워드 순위, 영업시간, 메뉴, 사진을 점검하고 업데이트했다', score: 5, status_text: '방문 전 검색 단계에서 발견될 가능성이 높음', risk_level: 'low', recommended_actions: [] },
      { label: '정보는 등록되어 있지만 최근 30일 검색 순위 점검은 없다', score: 3, status_text: '지도 검색 유입 기회를 놓칠 수 있음', risk_level: 'medium', recommended_actions: ['act_cafe_local_seo'] },
      { label: '지도/플레이스 정보를 거의 관리하지 않는다', score: 1, status_text: '내 주변 카페 검색에서 보이지 않을 가능성이 큼', risk_level: 'high', recommended_actions: ['act_cafe_local_seo'] },
    ],
    benchmark_text: { good: '지도 검색 키워드와 정보를 정기 관리함', normal: '기본 정보는 있으나 순위와 사진 관리가 부족함', danger: '로컬 검색 노출이 약해 신규 방문 기회를 잃음' },
    weight: { cafe_takeout: 8, cafe_stay: 7, cafe_dessert: 7, cafe_craft: 7, cafe_local: 8 },
  },
  {
    question_id: 'cafe_review_1',
    category: 'review_response',
    business_type: 'cafe',
    question: '최근 30일 네이버/구글 리뷰 평점, 신규 리뷰 수, 24시간 내 응답률을 기록했나요?',
    answer_options: [
      { label: '평점·신규 리뷰 수·24시간 내 응답률을 기록하고 응답한다', score: 5, status_text: '리뷰가 신뢰 자산으로 관리되는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '리뷰는 확인하지만 24시간 내 응답률은 기록하지 않는다', score: 3, status_text: '부정 경험 대응이 늦어질 수 있음', risk_level: 'medium', recommended_actions: ['act_cafe_review_routine'] },
      { label: '리뷰를 거의 확인하거나 응답하지 않는다', score: 1, status_text: '방문 전 신뢰와 지도 노출에 악영향이 큼', risk_level: 'high', recommended_actions: ['act_cafe_review_routine'] },
    ],
    benchmark_text: { good: '리뷰 평점과 응답률을 관리해 검색 신뢰를 높임', normal: '리뷰 확인은 하지만 속도와 루틴이 약함', danger: '리뷰 방치로 신뢰와 매출을 잃을 수 있음' },
    weight: { cafe_takeout: 6, cafe_stay: 7, cafe_dessert: 7, cafe_craft: 8, cafe_local: 8 },
  },
  {
    question_id: 'cafe_ugc_1',
    category: 'sns_shortform_ugc',
    business_type: 'cafe',
    question: '최근 30일 고객 자발 SNS 게시물 수와 매장 숏폼 영상 업로드 수를 기록했나요?',
    answer_options: [
      { label: '자발 게시물 5건 이상 또는 숏폼 4개 이상을 기록하고 성과를 확인했다', score: 5, status_text: '시각적 증거가 지속적으로 축적되는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '게시물이나 숏폼은 있지만 최근 30일 건수와 성과 기록은 없다', score: 3, status_text: '콘텐츠가 실제 방문으로 이어지는지 판단하기 어려움', risk_level: 'medium', recommended_actions: ['act_cafe_shortform_ugc'] },
      { label: '자발 게시물 수와 숏폼 업로드를 거의 관리하지 않는다', score: 1, status_text: 'SNS 확인 후 방문하는 고객에게 보이지 않을 수 있음', risk_level: 'high', recommended_actions: ['act_cafe_shortform_ugc'] },
    ],
    benchmark_text: { good: 'UGC와 숏폼 성과를 기록해 디지털 증거를 쌓음', normal: '콘텐츠는 있으나 성과 측정이 부족함', danger: 'SNS 증거가 약해 방문 전 확신을 주기 어려움' },
    weight: { cafe_takeout: 4, cafe_stay: 6, cafe_dessert: 10, cafe_craft: 6, cafe_local: 6 },
  },
  {
    question_id: 'cafe_local_1',
    category: 'local_partnership',
    business_type: 'cafe',
    question: '최근 30일 인근 사업장과 공동 혜택/샘플링/Business of the Day 협업을 1회 이상 실행했나요?',
    answer_options: [
      { label: '인근 사업장 협업을 1회 이상 실행했고 유입/쿠폰 사용 건수를 기록했다', score: 5, status_text: '지역 상권 안에서 단골 유입 경로를 만드는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '협업 아이디어는 있지만 최근 30일 실행과 성과 기록은 없다', score: 3, status_text: '로컬 네트워크가 매출로 연결되지 않음', risk_level: 'medium', recommended_actions: ['act_cafe_business_of_day'] },
      { label: '인근 사업장과 협업한 적이 없다', score: 1, status_text: '지역 기반 반복 유입을 만들 기회가 부족함', risk_level: 'high', recommended_actions: ['act_cafe_business_of_day'] },
    ],
    benchmark_text: { good: '인근 사업장 협업을 실행하고 성과를 측정함', normal: '협업 필요성은 있으나 실행 기록이 부족함', danger: '지역 상권 연결이 약해 단골 확보 경로가 좁음' },
    weight: { cafe_takeout: 4, cafe_stay: 4, cafe_dessert: 4, cafe_craft: 4, cafe_local: 10 },
  },
  {
    question_id: 'cafe_retention_1',
    category: 'retention_winback',
    business_type: 'cafe',
    question: '최근 30일 14일 이상 미방문 고객에게 자동 메시지/리워드를 보내고 복귀율을 기록했나요?',
    answer_options: [
      { label: '14일 미방문 고객에게 자동 리워드를 보내고 복귀율을 기록한다', score: 5, status_text: '이탈 고객을 되돌리는 시스템이 작동 중', risk_level: 'low', recommended_actions: [] },
      { label: '문자나 쿠폰은 보내지만 14일 기준 자동화와 복귀율 기록은 없다', score: 3, status_text: '재방문 유도가 비정기적으로 이루어짐', risk_level: 'medium', recommended_actions: ['act_cafe_winback_14day'] },
      { label: '미방문 고객을 따로 추적하지 않는다', score: 1, status_text: '고객 이탈을 늦게 알아차리고 신규 고객에만 의존함', risk_level: 'high', recommended_actions: ['act_cafe_winback_14day'] },
    ],
    benchmark_text: { good: '14일 미방문 기준으로 자동 복귀 캠페인을 운영함', normal: '혜택은 있으나 이탈 기준과 복귀율 측정이 약함', danger: '이탈 고객을 추적하지 않아 재방문 기반이 약함' },
    weight: { cafe_takeout: 5, cafe_stay: 6, cafe_dessert: 5, cafe_craft: 5, cafe_local: 9 },
  },
  {
    question_id: 'cafe_space_1',
    category: 'space_productivity',
    business_type: 'cafe',
    question: '최근 7일 좌석별 평균 체류 시간과 체류 고객 객단가를 기록했나요?',
    answer_options: [
      { label: '좌석별 체류 시간과 체류 고객 객단가를 기록해 좌석/콘센트 배치에 반영했다', score: 5, status_text: '공간이 매출 생산성 기준으로 관리되는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '오래 머무는 고객은 알지만 체류 시간과 객단가 기록은 없다', score: 3, status_text: '좌석 체류가 수익에 기여하는지 판단하기 어려움', risk_level: 'medium', recommended_actions: ['act_cafe_space_apc'] },
      { label: '좌석 체류 시간이나 공간 생산성을 전혀 보지 않는다', score: 1, status_text: '카공/모임 고객이 매출을 잠식할 수 있음', risk_level: 'high', recommended_actions: ['act_cafe_space_apc'] },
    ],
    benchmark_text: { good: '좌석 체류와 객단가를 함께 관리해 공간 생산성을 높임', normal: '체류 패턴은 알지만 수치 관리가 부족함', danger: '공간이 매출에 기여하는지 알 수 없음' },
    weight: { cafe_takeout: 3, cafe_stay: 10, cafe_dessert: 5, cafe_craft: 4, cafe_local: 5 },
  },
  {
    question_id: 'cafe_story_1',
    category: 'sourcing_story',
    business_type: 'cafe',
    question: '최근 30일 원두 산지/추출/브랜드 스토리 콘텐츠를 메뉴판·SNS·직원 응대에 1회 이상 반영했나요?',
    answer_options: [
      { label: '원두/추출/브랜드 스토리를 콘텐츠와 직원 응대에 반영했고 고객 반응을 기록했다', score: 5, status_text: '전문성과 진정성이 고객에게 전달되는 상태', risk_level: 'low', recommended_actions: [] },
      { label: '스토리는 있지만 최근 30일 콘텐츠나 응대 반영 기록은 없다', score: 3, status_text: '전문성이 고객 경험으로 충분히 전달되지 않음', risk_level: 'medium', recommended_actions: ['act_cafe_origin_story'] },
      { label: '원두나 브랜드 스토리를 거의 소통하지 않는다', score: 1, status_text: '개인 브랜딩형/크래프트형 차별화가 약함', risk_level: 'high', recommended_actions: ['act_cafe_origin_story'] },
    ],
    benchmark_text: { good: '원두와 브랜드 스토리를 지속적으로 소통하고 반응을 기록함', normal: '스토리는 있으나 고객 접점 반영이 부족함', danger: '전문성 스토리가 없어 차별화가 약함' },
    weight: { cafe_takeout: 2, cafe_stay: 3, cafe_dessert: 3, cafe_craft: 10, cafe_local: 3 },
  },
]

export const QUESTIONS_BY_INDUSTRY = {
  restaurant: RESTAURANT_QUESTIONS,
  cafe: CAFE_QUESTIONS,
  accommodation: ACCOMMODATION_QUESTIONS,
}
