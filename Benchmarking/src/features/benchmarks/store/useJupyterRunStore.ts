import { create } from 'zustand'
import { API_ORIGIN } from '@/shared/api/config'
import { queryClient } from '@/shared/api/queryClient'
import { jupyterKeys } from '../data/keys'
import type { JupyterRun, JupyterRunStore } from '../types'

// The notebook URL isn't in the launch response — it arrives later in the log
// stream on the definitive ready line, e.g.
// "✓ Jupyter Lab running at: http://192.0.2.22:8899/lab" (a RFC 5737
// documentation address, not a real host). Match only that line — not any
// stray "running at" log — so the URL, and the Open button, surface exactly
// when Jupyter is actually ready.
const extractUrlFromLog = (line: string): string | null => {
  const match = line.match(/jupyter\s*lab\s+running at:?\s*(https?:\/\/\S+)/i)
  return match ? match[1].replace(/[.,)]+$/, '') : null
}

const streamPath = (taskId: string) =>
  `${API_ORIGIN}/api/v1/jupyter/instances/${taskId}/logs/stream`

// Live EventSource is kept OUTSIDE the store: it is non-serializable and must not
// participate in React state or trigger re-renders.
let source: EventSource | null = null

export const useJupyterRunStore = create<JupyterRunStore>((set, get) => {
  const patch = (update: Partial<JupyterRun>) =>
    set((state) => (state.run ? { run: { ...state.run, ...update } } : state))

  return {
    run: null,

    startRun: ({ taskId, nodeIp = null }) => {
      // Idempotent: never reconnect a stream we're already running for this task.
      if (get().run?.taskId === taskId && source) return

      // Replace any previous launch's stream.
      source?.close()
      source = null

      set({ run: { taskId, nodeIp, url: null, opened: false, lines: [], status: 'idle' } })

      const s = new EventSource(streamPath(taskId))
      source = s

      s.onopen = () => patch({ status: 'open' })

      s.onmessage = (event) =>
        set((state) => {
          // Guard against a line arriving for a run that has since been replaced.
          if (!state.run || state.run.taskId !== taskId) return state
          return {
            run: {
              ...state.run,
              lines: [...state.run.lines, event.data],
              url: state.run.url ?? extractUrlFromLog(event.data),
              status: 'open',
            },
          }
        })

      // Server sends `event: close` with "READY"/"FAILED" at a terminal state.
      // Close here so the EventSource doesn't auto-reconnect.
      s.addEventListener('close', (event: MessageEvent) => {
        s.close()
        if (source === s) source = null
        const isFailed = event.data === 'FAILED'
        patch({ status: isFailed ? 'failed' : 'closed' })
        // Only refetch the instances list once the stream itself reports success
        // (not on a failed launch) — that's when the new instance actually exists
        // for GET /jupyter/instances to return.
        if (!isFailed) {
          void queryClient.invalidateQueries({ queryKey: jupyterKeys.instances() })
        }
      })

      s.onerror = () => {
        if (s.readyState === EventSource.CLOSED) {
          if (source === s) source = null
          patch({ status: 'closed' })
          return
        }
        // Transient drop — EventSource reconnects on its own.
        patch({ status: 'reconnecting' })
      }
    },

    markOpened: () => patch({ opened: true }),

    reset: () => {
      source?.close()
      source = null
      set({ run: null })
    },
  }
})
