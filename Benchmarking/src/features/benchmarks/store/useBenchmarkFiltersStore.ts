import { create } from 'zustand'
import { BENCHMARK_TYPE_OPTIONS } from '../constants'

/**
 * Active table filters, keyed by the exact `/api/v1/benchmarks` query-param names
 * the backend honors. Undefined/empty values are omitted from the request.
 */
export type BenchmarkFilters = {
  model?: string
  node_ip?: string
  gpu_type?: string
  precision?: string
  input_tokens?: string
  output_tokens?: string
  concurrency?: string
}

type BenchmarkFiltersStore = {
  filters: BenchmarkFilters
  setFilters: (filters: BenchmarkFilters) => void
  /** Selected Benchmark Type — names the chart's Y-axis metric. */
  benchmarkType: string
  setBenchmarkType: (benchmarkType: string) => void
}

/** Feature-scoped store bridging the Configure dropdowns, the chart, and the runs table. */
export const useBenchmarkFiltersStore = create<BenchmarkFiltersStore>((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
  benchmarkType: BENCHMARK_TYPE_OPTIONS[0],
  setBenchmarkType: (benchmarkType) => set({ benchmarkType }),
}))
