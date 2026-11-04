import { create } from 'zustand'
import { agentTransport } from './index'
import type { RunEvent } from './events'
import {
  initialRunState,
  isRunActive,
  runReducer,
  type AgentRunState,
  type ClientEvent,
} from './runReducer'
import type { RunHandle, StartRunRequest } from './transport'

/** Longest selection attached to a message; the rest is cut off. */
export const MAX_SELECTION_CHARS = 2000

/** Runs a client tool in the page for a `ui.action` event and returns its reply. */
export type UiActionRunner = (tool: string, args: Record<string, string>) => Promise<string>

type AgentStore = {
  /** Run state per chat message id. */
  runs: Record<string, AgentRunState>
  /** Highlighted page text waiting to be sent with the next message. */
  attachment: string | null
  attach: (text: string) => void
  clearAttachment: () => void
  startRun: (messageId: string, request: StartRunRequest, runUiAction: UiActionRunner) => void
  approve: (messageId: string) => void
  reject: (messageId: string) => void
  cancel: (messageId: string) => void
  /** Stop every run and forget them (chat cleared). */
  reset: () => void
}

/** Live handles stay outside the store: they aren't state anyone renders. */
const handles = new Map<string, RunHandle>()

const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

export const useAgentStore = create<AgentStore>((set, get) => {
  const dispatch = (messageId: string, event: RunEvent | ClientEvent) =>
    set((s) => ({
      runs: { ...s.runs, [messageId]: runReducer(s.runs[messageId] ?? initialRunState, event) },
    }))

  const answerPlan = (messageId: string, approved: boolean) => {
    const handle = handles.get(messageId)
    if (!handle || get().runs[messageId]?.status !== 'awaiting_approval') return
    dispatch(messageId, { type: approved ? 'client.approved' : 'client.rejected' })
    const reply = approved ? handle.approve() : handle.reject()
    reply.catch((error: Error) =>
      dispatch(messageId, { type: 'client.error', message: error.message }),
    )
  }

  return {
    runs: {},
    attachment: null,
    attach: (text) => set({ attachment: text.trim().slice(0, MAX_SELECTION_CHARS) || null }),
    clearAttachment: () => set({ attachment: null }),

    startRun: (messageId, request, runUiAction) => {
      set((s) => ({ runs: { ...s.runs, [messageId]: initialRunState } }))
      const handle = agentTransport.start(request, (event) => {
        dispatch(messageId, event)
        if (event.type === 'ui.action') {
          runUiAction(event.tool, event.args)
            .catch((error: Error) => `That didn't work: ${error.message}`)
            .then((text) =>
              dispatch(messageId, { type: 'client.actionDone', tool: event.tool, text }),
            )
        }
      })
      handles.set(messageId, handle)

      handle.done
        .then(() => {
          // The stream closed without saying how the run ended.
          const run = get().runs[messageId]
          if (run && isRunActive(run.status)) {
            dispatch(messageId, {
              type: 'client.error',
              message: 'The connection closed before the answer finished.',
            })
          }
        })
        .catch((error: unknown) => {
          if (!isAbort(error)) {
            dispatch(messageId, {
              type: 'client.error',
              message: error instanceof Error ? error.message : 'Something went wrong.',
            })
          }
        })
        .finally(() => handles.delete(messageId))
    },

    approve: (messageId) => answerPlan(messageId, true),
    reject: (messageId) => answerPlan(messageId, false),

    cancel: (messageId) => {
      handles.get(messageId)?.cancel()
      dispatch(messageId, { type: 'client.cancelled' })
    },

    reset: () => {
      handles.forEach((handle) => handle.cancel())
      handles.clear()
      set({ runs: {}, attachment: null })
    },
  }
})
