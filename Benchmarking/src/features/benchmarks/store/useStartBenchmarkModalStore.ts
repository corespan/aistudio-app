import { create } from 'zustand'

type StartBenchmarkModalStore = {
  /** Whether the Start Benchmark wizard modal is open. */
  isOpen: boolean
  open: () => void
  close: () => void
}

/**
 * Feature-scoped store for the Start Benchmark modal's open state — lets the
 * app-bar action (in AppLayout) trigger a modal rendered inside the Benchmarks page.
 */
export const useStartBenchmarkModalStore = create<StartBenchmarkModalStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
