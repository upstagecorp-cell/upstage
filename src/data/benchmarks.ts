import { AreaId, IndustryId } from './types'

export interface BenchmarkEntry {
  average: number
  top10: number
}

export type IndustryBenchmarks = Record<AreaId, BenchmarkEntry>

export const INDUSTRY_BENCHMARKS: Record<IndustryId, IndustryBenchmarks> = {
  cafe: {
    customer:    { average: 52, top10: 78 },
    validation:  { average: 44, top10: 70 },
    product:     { average: 58, top10: 82 },
    acquisition: { average: 46, top10: 72 },
    revenue:     { average: 50, top10: 76 },
    operation:   { average: 55, top10: 80 },
    growth:      { average: 40, top10: 68 },
  },
  restaurant: {
    customer:    { average: 50, top10: 76 },
    validation:  { average: 42, top10: 68 },
    product:     { average: 60, top10: 84 },
    acquisition: { average: 44, top10: 70 },
    revenue:     { average: 52, top10: 78 },
    operation:   { average: 58, top10: 82 },
    growth:      { average: 38, top10: 65 },
  },
  accommodation: {
    customer:    { average: 48, top10: 74 },
    validation:  { average: 40, top10: 66 },
    product:     { average: 56, top10: 80 },
    acquisition: { average: 50, top10: 76 },
    revenue:     { average: 54, top10: 80 },
    operation:   { average: 52, top10: 78 },
    growth:      { average: 42, top10: 68 },
  },
  service: {
    customer:    { average: 54, top10: 80 },
    validation:  { average: 46, top10: 72 },
    product:     { average: 52, top10: 78 },
    acquisition: { average: 42, top10: 68 },
    revenue:     { average: 48, top10: 74 },
    operation:   { average: 50, top10: 76 },
    growth:      { average: 44, top10: 70 },
  },
  online: {
    customer:    { average: 50, top10: 76 },
    validation:  { average: 52, top10: 80 },
    product:     { average: 54, top10: 80 },
    acquisition: { average: 56, top10: 82 },
    revenue:     { average: 46, top10: 72 },
    operation:   { average: 44, top10: 70 },
    growth:      { average: 52, top10: 78 },
  },
  other: {
    customer:    { average: 48, top10: 74 },
    validation:  { average: 42, top10: 68 },
    product:     { average: 50, top10: 76 },
    acquisition: { average: 44, top10: 70 },
    revenue:     { average: 46, top10: 72 },
    operation:   { average: 48, top10: 74 },
    growth:      { average: 42, top10: 68 },
  },
}

export function getBenchmark(industry: IndustryId, areaId: AreaId): BenchmarkEntry {
  return INDUSTRY_BENCHMARKS[industry][areaId]
}
