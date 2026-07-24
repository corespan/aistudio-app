import { create } from 'zustand'
import { BENCHMARK_TYPE_OPTIONS } from '../constants'
import type { BenchmarkFiltersStore } from '../types'

/** Feature-scoped store bridging the Configure dropdowns, the chart, and the runs table. */
export const useBenchmarkFiltersStore = create<BenchmarkFiltersStore>((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
  benchmarkType: BENCHMARK_TYPE_OPTIONS[0],
  setBenchmarkType: (benchmarkType) => set({ benchmarkType }),
}))
