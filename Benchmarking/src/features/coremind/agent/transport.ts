import type { RunEvent } from './events'

/** What the panel tells the agent about the page, sent with every message. */
export type RunContext = {
  /** Current route, so "this one" can be resolved. */
  page: string
  /**
   * Text the user highlighted and attached. Untrusted page content — the
   * backend must pass it to the model as fenced data, never as instructions.
   */
  selection?: string
}

export type StartRunRequest = { input: string; context: RunContext }

/** A run in flight. */
export type RunHandle = {
  /** Answer a `plan.proposed` event. */
  approve: () => Promise<void>
  reject: () => Promise<void>
  /** Stop the run (Stop button / panel cleared). */
  cancel: () => void
  /** Settles when the stream ends, however it ends. */
  done: Promise<void>
}

/**
 * How the panel reaches the agent platform. `mockTransport` fakes it until
 * the API exists; `httpTransport` is the real one. Switch with VITE_AGENT_TRANSPORT.
 */
export type AgentTransport = {
  start: (request: StartRunRequest, onEvent: (event: RunEvent) => void) => RunHandle
}
