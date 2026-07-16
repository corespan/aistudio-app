import { create } from 'zustand'
import { queryClient } from '@/shared/api/queryClient'
import { API_ORIGIN } from '@/shared/api/config'
import { benchmarkOptionKeys } from '../data/keys'
import type { LogStreamStatus } from '../hooks/useBenchmarkLogStream'

/**
 * A single benchmark run's live log stream. This is the shared, component-independent
 * state for one run — buffered lines, connection status, and the id of the last
 * delivered SSE event (used to resume after a reconnect).
 */
export type RunStream = {
  taskId: string
  model: string | null
  nodeIp: string | null
  /** ISO timestamp captured when streaming started — orders runs in the switcher. */
  startedAt: string
  lines: string[]
  status: LogStreamStatus
  lastEventId: string | null
}

type StartRunInput = { taskId: string; model?: string | null; nodeIp?: string | null }

type RunStreamsStore = {
  /** All runs being (or that have been) streamed this session, keyed by task id. */
  streams: Record<string, RunStream>
  /** Whether the progress drawer is open. */
  drawerOpen: boolean
  /** The run currently selected in the drawer, or null when none is chosen. */
  openRunId: string | null
  /** Begin streaming a run's logs. Idempotent — never restarts an active stream. */
  startRun: (input: StartRunInput) => void
  /** Ensure a run is streaming, then open the drawer focused on it. */
  viewRun: (input: StartRunInput) => void
  /** Open the drawer, defaulting the selection to the most recent run. */
  openPanel: () => void
  /** Switch the drawer to an already-streaming run without touching any stream. */
  openDrawer: (taskId: string) => void
  closeDrawer: () => void
  /** Tear down a run's stream and drop it from the store. */
  closeRun: (taskId: string) => void
}

// Most-recent run first — used to default the drawer's selection.
const byStartedDesc = (a: RunStream, b: RunStream) => b.startedAt.localeCompare(a.startedAt)

// Matches every `benchmarks(filters)` query regardless of the active filters, so a
// finished run refreshes the table into its final API row.
const BENCHMARKS_LIST_KEY = [...benchmarkOptionKeys.all, 'benchmarks'] as const

const streamPath = (taskId: string) => `${API_ORIGIN}/api/v1/benchmarks/${taskId}/logs/stream`

// Live EventSource handles are kept OUTSIDE the store: they are non-serializable
// and must not participate in React state or trigger re-renders.
const sources = new Map<string, EventSource>()

export const useRunStreamsStore = create<RunStreamsStore>((set) => {
  const patch = (taskId: string, update: Partial<RunStream>) =>
    set((state) => {
      const current = state.streams[taskId]
      if (!current) return state
      return { streams: { ...state.streams, [taskId]: { ...current, ...update } } }
    })

  const startRun: RunStreamsStore['startRun'] = ({ taskId, model = null, nodeIp = null }) => {
    // Idempotent: a run already being streamed must never be reconnected or have
    // its buffered lines cleared — that would interrupt a stream a user is watching.
    if (sources.has(taskId)) return

    set((state) => ({
      streams: {
        ...state.streams,
        [taskId]: {
          taskId,
          model,
          nodeIp,
          startedAt: new Date().toISOString(),
          lines: [],
          status: 'idle',
          lastEventId: null,
        },
      },
    }))

    const source = new EventSource(streamPath(taskId))
    sources.set(taskId, source)

    source.onopen = () => patch(taskId, { status: 'open' })

    source.onmessage = (event) =>
      set((state) => {
        const current = state.streams[taskId]
        if (!current) return state
        return {
          streams: {
            ...state.streams,
            [taskId]: {
              ...current,
              lines: [...current.lines, event.data],
              // The browser echoes this back as the `Last-Event-ID` header on the
              // next reconnect, letting the server resume from here.
              lastEventId: event.lastEventId || current.lastEventId,
              status: 'open',
            },
          },
        }
      })

    // The server sends `event: close` with data "READY" or "FAILED" when the
    // workload reaches a terminal state. We close the EventSource here so it
    // does not auto-reconnect (which would cause a perpetual RECONNECTING badge).
    // The status is set to 'failed' vs 'closed' so the drawer badge shows the
    // correct outcome without the user having to refresh the page.
    source.addEventListener('close', (event: MessageEvent) => {
      const isFailed = event.data === 'FAILED'
      source.close()
      sources.delete(taskId)
      patch(taskId, { status: isFailed ? 'failed' : 'closed' })
      void queryClient.invalidateQueries({ queryKey: BENCHMARKS_LIST_KEY })
    })

    source.onerror = () => {
      // CLOSED: stream was explicitly shut (either by the 'close' event handler
      // above, or the server dropped the connection for good). Do not reconnect.
      if (source.readyState === EventSource.CLOSED) {
        sources.delete(taskId)
        patch(taskId, { status: 'closed' })
        void queryClient.invalidateQueries({ queryKey: BENCHMARKS_LIST_KEY })
        return
      }
      // CONNECTING: a transient network drop. EventSource reconnects on its own
      // and sends the Last-Event-ID header so the server resumes without replay.
      patch(taskId, { status: 'reconnecting' })
    }
  }

  return {
    streams: {},
    drawerOpen: false,
    openRunId: null,

    startRun,

    viewRun: (input) => {
      startRun(input)
      set({ drawerOpen: true, openRunId: input.taskId })
    },

    openPanel: () =>
      set((state) => ({
        drawerOpen: true,
        // Keep the current selection if there is one; otherwise focus the newest run.
        openRunId:
          state.openRunId ?? Object.values(state.streams).sort(byStartedDesc)[0]?.taskId ?? null,
      })),

    openDrawer: (taskId) => set({ drawerOpen: true, openRunId: taskId }),

    closeDrawer: () => set({ drawerOpen: false }),

    closeRun: (taskId) => {
      sources.get(taskId)?.close()
      sources.delete(taskId)
      set((state) => {
        const { [taskId]: _removed, ...rest } = state.streams
        return {
          streams: rest,
          openRunId: state.openRunId === taskId ? null : state.openRunId,
        }
      })
    },
  }
})
