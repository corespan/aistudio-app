import { create } from 'zustand'
import type { LogStreamStatus } from '../hooks/useBenchmarkLogStream'

/**
 * The single active Jupyter launch and its live log stream. Kept in a store (not
 * component state) so the run survives navigating away from the Launch Jupyter
 * panel and back — mirroring how benchmark runs persist in `useRunStreamsStore`.
 */
export type JupyterRun = {
  taskId: string
  nodeIp: string | null
  /** Notebook URL parsed out of the log stream once the server reports ready. */
  url: string | null
  /** True once the user has opened the notebook via the button. Persisted here so
   *  the button stays disabled after navigating away and back. */
  opened: boolean
  lines: string[]
  status: LogStreamStatus
}

type JupyterRunStore = {
  run: JupyterRun | null
  /** Begin streaming a launch's logs. Idempotent for the same task id. */
  startRun: (input: { taskId: string; nodeIp?: string | null }) => void
  /** Mark that the notebook tab has been opened (disables the Open button). */
  markOpened: () => void
  /** Tear down the stream and clear the run. */
  reset: () => void
}

// The notebook URL isn't in the launch response — it arrives later in the log
// stream on the definitive ready line, e.g.
// "✓ Jupyter Lab running at: http://10.6.12.22:8899/lab". Match only that line
// (not any stray "running at" log) so the URL — and the Open button — surface
// exactly when Jupyter is actually ready.
const extractUrlFromLog = (line: string): string | null => {
  const match = line.match(/jupyter\s*lab\s+running at:?\s*(https?:\/\/\S+)/i)
  return match ? match[1].replace(/[.,)]+$/, '') : null
}

const streamPath = (taskId: string) => `/api/v1/jupyter/${taskId}/logs/stream`

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
        patch({ status: event.data === 'FAILED' ? 'failed' : 'closed' })
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
