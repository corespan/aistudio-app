import { create } from 'zustand'
import type { StartBenchmarkModalStore } from '../types'

/**
 * Feature-scoped store for the Start Benchmark modal's open state — lets the
 * app-bar action (in AppLayout) trigger a modal rendered inside the Benchmarks page.
 */
export const useStartBenchmarkModalStore = create<StartBenchmarkModalStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
