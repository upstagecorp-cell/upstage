import type { FinancialSnapshot } from '@/data/types'

export type FinancialStatusLevel = 'loss' | 'danger' | 'warning' | 'good' | 'excellent' | 'unknown'

export interface FinancialAnalysis {
  revenue: number | null
  netProfit: number | null
  netProfitMargin: number | null
  status: {
    level: FinancialStatusLevel
    label: string
    color: string
    bg: string
  }
  headline: string
  recommendation: string
  hasEvidence: boolean
}

function parseKoreanMoneyText(value: string): number | null {
  const normalized = value.replace(/,/g, '').replace(/\s/g, '')
  if (!normalized) return null

  const hasKoreanUnit = /억|만/.test(normalized)
  if (!hasKoreanUnit) {
    const numericOnly = normalized.replace(/[^\d.-]/g, '')
    const parsed = Number(numericOnly)
    return Number.isFinite(parsed) ? parsed : null
  }

  let total = 0
  const eokMatch = normalized.match(/(-?\d+(?:\.\d+)?)억/)
  const manMatch = normalized.match(/(-?\d+(?:\.\d+)?)만/)
  const directNumber = normalized.match(/^(-?\d+(?:\.\d+)?)$/)

  if (eokMatch) total += Number(eokMatch[1]) * 100_000_000
  if (manMatch) total += Number(manMatch[1]) * 10_000
  if (!eokMatch && !manMatch && directNumber) total += Number(directNumber[1])

  return Number.isFinite(total) && total !== 0 ? total : null
}

function getFinancialStatus(netProfit: number | null, margin: number | null): FinancialAnalysis['status'] {
  if (netProfit === null || margin === null) {
    return { level: 'unknown', label: '확인 필요', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800' }
  }
  if (netProfit < 0) {
    return { level: 'loss', label: '적자', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' }
  }
  if (margin < 5) {
    return { level: 'danger', label: '이익 취약', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' }
  }
  if (margin < 10) {
    return { level: 'warning', label: '개선 필요', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' }
  }
  if (margin < 20) {
    return { level: 'good', label: '건강', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' }
  }
  return { level: 'excellent', label: '우수', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' }
}

function formatMargin(margin: number | null) {
  if (margin === null) return '-'
  return `${margin.toFixed(1)}%`
}

export function analyzeFinancialSnapshot(snapshot: FinancialSnapshot | null): FinancialAnalysis | null {
  if (!snapshot) return null

  const revenue = parseKoreanMoneyText(snapshot.monthlyRevenueText)
  const netProfit = parseKoreanMoneyText(snapshot.monthlyNetProfitText)
  const netProfitMargin = revenue && revenue !== 0 && netProfit !== null
    ? (netProfit / revenue) * 100
    : null
  const status = getFinancialStatus(netProfit, netProfitMargin)
  const hasEvidence = snapshot.evidenceFileNames.length > 0

  let headline = '입력한 매출과 순이익을 기준으로 재무 상태를 해석합니다.'
  let recommendation = '매출과 순이익을 다시 확인하면 더 정확한 재무 해석이 가능합니다.'

  if (status.level === 'loss') {
    headline = `최근 3개월 평균 순이익률은 ${formatMargin(netProfitMargin)}로 적자 상태입니다.`
    recommendation = '신규 광고보다 고정비, 원가, 저마진 상품, 피크타임 운영 손실을 먼저 점검하세요.'
  } else if (status.level === 'danger') {
    headline = `최근 3개월 평균 순이익률은 ${formatMargin(netProfitMargin)}로 매우 얇습니다.`
    recommendation = '매출을 늘리기 전에 원가율, 객단가, 고마진 상품 비중, 반복 비용을 우선 개선하세요.'
  } else if (status.level === 'warning') {
    headline = `최근 3개월 평균 순이익률은 ${formatMargin(netProfitMargin)}로 개선 여지가 큽니다.`
    recommendation = '유입 확대와 함께 가격, 세트 구성, 재방문 액션을 병행해 이익률을 10% 이상으로 끌어올리세요.'
  } else if (status.level === 'good') {
    headline = `최근 3개월 평균 순이익률은 ${formatMargin(netProfitMargin)}로 비교적 건강합니다.`
    recommendation = '현재 이익 구조를 유지하면서 고객 유입, 재방문, 운영 자동화 액션을 우선 실행하세요.'
  } else if (status.level === 'excellent') {
    headline = `최근 3개월 평균 순이익률은 ${formatMargin(netProfitMargin)}로 강한 편입니다.`
    recommendation = '확장, 상품 라인 강화, 직원 교육, 반복 가능한 운영 시스템 구축을 검토할 수 있습니다.'
  }

  return {
    revenue,
    netProfit,
    netProfitMargin,
    status,
    headline,
    recommendation,
    hasEvidence,
  }
}
