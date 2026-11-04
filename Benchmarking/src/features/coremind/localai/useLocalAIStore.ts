import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { canRunLocalAI } from './gpu'

export type LocalAIStatus = 'off' | 'loading' | 'ready' | 'unsupported' | 'error'

type LocalAIState = {
  /** The user's choice — remembered across reloads. */
  enabled: boolean
  status: LocalAIStatus
  /** Model download/load progress, 0 → 1. */
  progress: number
  /** Progress or error text shown under the switch. */
  message: string
  turnOn: () => Promise<void>
  turnOff: () => void
}

export const useLocalAIStore = create<LocalAIState>()(
  persist(
    (set, get) => ({
      enabled: false,
      status: 'off',
      progress: 0,
      message: '',
      turnOn: async () => {
        if (get().status === 'loading' || get().status === 'ready') return
        if (!(await canRunLocalAI())) {
          set({
            enabled: false,
            status: 'unsupported',
            message: 'This browser or computer cannot run local AI (WebGPU is unavailable).',
          })
          return
        }
        set({ enabled: true, status: 'loading', progress: 0, message: 'Starting…' })
        try {
          // Imported on demand: the WebLLM library only loads once Local AI is switched on.
          const { getLocalEngine } = await import('./localEngine')
          await getLocalEngine((report) => set({ progress: report.progress, message: report.text }))
          set({ status: 'ready', progress: 1, message: 'Local AI is ready.' })
        } catch (error) {
          set({ enabled: false, status: 'error', message: (error as Error).message })
        }
      },
      // The model stays in memory; switching back on is instant.
      turnOff: () => set({ enabled: false, status: 'off', message: '' }),
    }),
    {
      name: 'coremind-local-ai',
      partialize: (state) => ({ enabled: state.enabled }),
    },
  ),
)
