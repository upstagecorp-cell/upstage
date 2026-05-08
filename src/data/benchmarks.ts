import { BenchmarkStatus } from './types'

export const BENCHMARKS: BenchmarkStatus[] = [
  {
    indicator: 'main_customer',
    good: '주요 고객의 연령·직업·방문 목적을 구체적으로 파악하고 메뉴·운영 시간에 반영하고 있음',
    normal: '고객층을 대략적으로 알고 있으나 데이터 기반의 구체적인 분석은 없음',
    danger: '주요 고객층을 파악하지 못해 메뉴·가격·마케팅 방향이 불명확한 상태',
  },
  {
    indicator: 'commercial_traffic',
    good: '유동 인구 규모와 시간대별 특성을 파악하고 영업 시간·메뉴 구성에 반영하고 있음',
    normal: '바쁜 시간대는 경험으로 알고 있으나 구체적인 상권 데이터를 갖고 있지 않음',
    danger: '상권 유동 인구를 전혀 분석하지 않아 운영 시간·인원 배치가 비효율적인 상태',
  },
  {
    indicator: 'sales_time_diff',
    good: '점심·저녁·주말 매출 비율을 수치로 파악하고 인력 배치와 메뉴 운영에 활용하고 있음',
    normal: '바쁜 시간은 감각적으로 알지만 데이터 기반으로 관리하지 않음',
    danger: '시간대별 매출 차이를 파악하지 못해 피크타임 대응이 체계적이지 않음',
  },
  {
    indicator: 'menu_competitiveness',
    good: '대표 메뉴의 차별화 포인트를 고객이 인식하고 있으며 리뷰나 재방문으로 검증되고 있음',
    normal: '메뉴에 특색은 있지만 고객에게 명확히 전달되지 않거나 검증되지 않은 상태',
    danger: '주변 경쟁점 대비 메뉴 차별화가 없어 선택받을 이유가 약한 상태',
  },
  {
    indicator: 'menu_cost_rate',
    good: '최근 원가율을 정기적으로 계산하고 메뉴별 수익성을 관리하고 있음',
    normal: '원가율을 대략 파악하고 있으나 정기적 관리가 이루어지지 않음',
    danger: '원가율을 모르고 있어 수익 구조 파악이 불가능한 상태',
  },
  {
    indicator: 'avg_spending_per_customer',
    good: '현재 객단가를 파악하고 목표 객단가를 설정해 메뉴 구성과 추가 판매 전략에 반영하고 있음',
    normal: '객단가를 대략 알고 있지만 이를 높이기 위한 전략적 접근이 없음',
    danger: '객단가를 모르고 있어 적정 판매 가격이나 메뉴 구성의 기준이 없는 상태',
  },
  {
    indicator: 'table_turnover',
    good: '피크 시간대 테이블 사용 시간과 회전율을 기록하고 있음',
    normal: '바쁜 시간대는 알고 있지만 수치로 관리하지 않음',
    danger: '테이블 회전율을 모르고 병목 원인을 파악하지 못함',
  },
  {
    indicator: 'delivery_app_exposure',
    good: '배달앱 노출 순위를 정기적으로 확인하고 운영 시간·광고 설정으로 노출을 최적화하고 있음',
    normal: '배달앱에 등록되어 있지만 노출 순위나 클릭율을 체계적으로 관리하지 않음',
    danger: '배달앱 노출 현황을 확인하지 않아 경쟁 매장 대비 뒤처지고 있는 상태',
  },
  {
    indicator: 'review_rating',
    good: '최근 30일 리뷰 수와 평점을 정기적으로 확인하고 부정 리뷰에 응답하고 있음',
    normal: '리뷰는 확인하지만 응답 기준이나 개선 루틴이 없음',
    danger: '최근 리뷰를 거의 확인하지 않고 고객 불만을 운영 개선에 반영하지 않음',
  },
  {
    indicator: 'naver_place_status',
    good: '영업시간·메뉴·가격·사진·전화번호가 최신 상태로 관리되고 있음',
    normal: '기본 정보는 있지만 사진이나 메뉴 정보가 오래됨',
    danger: '영업시간·메뉴·가격·전화번호 중 일부가 부정확하거나 관리되지 않음',
  },
  {
    indicator: 'revisit_rate',
    good: '단골 고객 비율을 수치로 파악하고 재방문을 유도하는 프로그램을 운영하고 있음',
    normal: '단골 고객을 얼굴로 알고 있지만 비율이나 재방문 주기를 데이터로 관리하지 않음',
    danger: '재방문율을 전혀 파악하지 못해 고객 이탈을 인식하지 못하고 있는 상태',
  },
]

export function getBenchmark(indicator: string): BenchmarkStatus | undefined {
  return BENCHMARKS.find(b => b.indicator === indicator)
}
