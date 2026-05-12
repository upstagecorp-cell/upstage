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
  { indicator: 'lodging_positioning', good: '숙소 컨셉과 타겟 고객이 명확해 상세 페이지와 가격 전략에 일관되게 반영됨', normal: '대략적인 컨셉은 있으나 고객 페르소나와 차별화 메시지가 약함', danger: '위치와 가격 외 선택 이유가 약해 대체 가능한 숙소로 보임' },
  { indicator: 'occupancy_rate', good: '객실 점유율을 상시 추적하고 62% 이하에서 가격·LOS 조정을 실행함', normal: '예약률은 보지만 기준점과 대응 규칙이 부족함', danger: '점유율을 몰라 공실 원인과 대응 시점을 놓침' },
  { indicator: 'adr_revpar', good: 'ADR과 RevPAR를 함께 관리해 객단가와 점유율 균형을 맞춤', normal: '평균 객실 단가는 알지만 객실당 수익 효율 관리는 부족함', danger: '감으로 가격을 정해 저가 경쟁 또는 공실 리스크가 큼' },
  { indicator: 'direct_booking_share', good: '직접 예약 채널을 운영해 수수료와 고객 데이터 손실을 줄임', normal: '직접 문의는 있으나 성과 관리가 체계적이지 않음', danger: 'OTA에만 의존해 수수료와 정책 변화에 취약함' },
  { indicator: 'ota_dependency', good: '채널별 예약 비중을 분산해 플랫폼 리스크를 낮춤', normal: '복수 채널은 있으나 실제 의존도 관리는 부족함', danger: '특정 플랫폼 매출 비중이 높아 외부 변화에 취약함' },
  { indicator: 'weekday_weekend_gap', good: '요일별 수요에 맞춰 요금·패키지·최소숙박일을 운영함', normal: '주말 강세는 알지만 평일 상품 실험은 부족함', danger: '요일별 편차를 몰라 평일 공실과 주말 수익 손실이 발생함' },
  { indicator: 'visual_content_ctr', good: '대표 사진과 영상이 숙소의 X-Factor를 명확히 보여줌', normal: '사진은 있으나 썸네일과 클릭률 개선 관점이 부족함', danger: '사진 품질과 정보량이 부족해 예약 전 신뢰 형성이 약함' },
  { indicator: 'conversion_rate', good: '상세 페이지 전환율을 보고 설명·사진·가격을 개선함', normal: '예약 수는 보지만 퍼널별 병목 분석은 부족함', danger: '예약 저조 원인을 몰라 무엇을 고칠지 불명확함' },
  { indicator: 'reply_speed', good: '빠른 응답과 표준 안내로 예약 전 불안을 줄임', normal: '응답은 하지만 속도와 품질이 상황에 따라 흔들림', danger: '응답 지연과 안내 불일치로 예약 기회를 놓침' },
  { indicator: 'review_reputation', good: '최근 리뷰와 응답률을 관리해 사회적 증거를 강화함', normal: '리뷰 확인은 하지만 수집과 응답 루틴이 부족함', danger: '리뷰 최신성과 응답이 부족해 신규 예약 신뢰가 약함' },
  { indicator: 'naver_trust_layer', good: '네이버 플레이스와 스토리 콘텐츠로 한국형 검색 신뢰를 확보함', normal: '기본 정보는 있으나 후기와 콘텐츠 업데이트가 부족함', danger: '네이버 검증 채널이 약해 한국 고객 신뢰 확보가 어려움' },
  { indicator: 'amenity_transparency', good: '41개 이상 수준의 세부 안내로 예약 전 불확실성을 제거함', normal: '주요 시설 안내는 있으나 세부 비품과 생활 정보가 부족함', danger: '정보 부족으로 문의, 기대 불일치, 취소가 늘 수 있음' },
  { indicator: 'ugc_sns', good: '포토존과 언박싱 경험이 자발적 UGC 확산을 만듦', normal: '공유될 요소는 있으나 고객 행동 유도 장치가 약함', danger: 'SNS 확산 구조가 없어 감성 경쟁력이 외부로 퍼지지 않음' },
  { indicator: 'housekeeping_efficiency', good: '하우스키핑 비용과 품질을 함께 관리해 마진과 리뷰를 보호함', normal: '품질 관리는 하지만 비용 효율 비교가 부족함', danger: '청소 비용과 클레임을 추적하지 않아 수익성과 평판 리스크가 큼' },
  { indicator: 'cancellation_rate', good: '취소율과 원인을 분석해 정책과 안내 문구를 개선함', normal: '취소 현황은 보지만 원인별 개선 루틴은 부족함', danger: '취소 데이터를 보지 않아 예약 안정성과 매출 예측력이 낮음' },
]

export function getBenchmark(indicator: string): BenchmarkStatus | undefined {
  return BENCHMARKS.find(b => b.indicator === indicator)
}
