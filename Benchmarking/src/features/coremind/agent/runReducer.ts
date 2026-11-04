import type { PlanStep, RunEvent, ToolClass } from './events'

export type RunStatus =
  'connecting' | 'awaiting_approval' | 'running' | 'completed' | 'failed' | 'cancelled'

export type ToolStep = {
  id: string
  tool: string
  title?: string
  class: ToolClass
  status: 'running' | 'done' | 'failed'
  summary?: string
}

export type Budget = { stepsUsed: number; stepsMax: number; elapsedS: number; maxS: number }

/** Everything the panel shows for one agent reply. */
export type AgentRunState = {
  status: RunStatus
  runId?: string
  /** Agent the planner picked — shown as the reply's label. */
  agent?: string
  plan?: PlanStep[]
  /** Set once the user answers the plan. */
  planDecision?: 'approved' | 'rejected'
  steps: ToolStep[]
  /** Answer text so far. */
  text: string
  budget?: Budget
  /** Replies from client tools the agent ran in the page ("Opened Benchmarks."). */
  actions: { tool: string; text: string }[]
  error?: { code: string; message: string }
}

/** Events that come from the user or the browser, not the stream. */
export type ClientEvent =
  | { type: 'client.approved' }
  | { type: 'client.rejected' }
  | { type: 'client.cancelled' }
  | { type: 'client.actionDone'; tool: string; text: string }
  | { type: 'client.error'; message: string }

export const initialRunState: AgentRunState = {
  status: 'connecting',
  steps: [],
  text: '',
  actions: [],
}

export const isRunActive = (status: RunStatus) =>
  status === 'connecting' || status === 'awaiting_approval' || status === 'running'

/**
 * Fold one event into the run state. Pure, so a saved event log can be
 * replayed into the same view. Events after the run has ended are ignored.
 */
export const runReducer = (state: AgentRunState, event: RunEvent | ClientEvent): AgentRunState => {
  if (!isRunActive(state.status)) return state

  switch (event.type) {
    case 'run.started':
      return { ...state, status: 'running', runId: event.runId, agent: event.agent }
    case 'plan.proposed':
      return { ...state, status: 'awaiting_approval', plan: event.steps }
    case 'client.approved':
      return { ...state, status: 'running', planDecision: 'approved' }
    case 'client.rejected':
      return { ...state, status: 'cancelled', planDecision: 'rejected' }
    case 'tool.call':
      return {
        ...state,
        steps: [
          ...state.steps,
          {
            id: event.id,
            tool: event.tool,
            title: event.title,
            class: event.class,
            status: 'running',
          },
        ],
      }
    case 'tool.result':
      return {
        ...state,
        steps: state.steps.map((step) =>
          step.id === event.id
            ? { ...step, status: event.ok ? 'done' : 'failed', summary: event.summary }
            : step,
        ),
      }
    case 'token':
      return { ...state, text: state.text + event.text }
    case 'client.actionDone':
      return { ...state, actions: [...state.actions, { tool: event.tool, text: event.text }] }
    case 'budget':
      return {
        ...state,
        budget: {
          stepsUsed: event.stepsUsed,
          stepsMax: event.stepsMax,
          elapsedS: event.elapsedS,
          maxS: event.maxS,
        },
      }
    case 'run.completed':
      return { ...state, status: 'completed', steps: settleSteps(state.steps) }
    case 'run.failed':
      return {
        ...state,
        status: 'failed',
        steps: settleSteps(state.steps),
        error: { code: event.code, message: event.message },
      }
    case 'client.error':
      return {
        ...state,
        status: 'failed',
        steps: settleSteps(state.steps),
        error: { code: 'network', message: event.message },
      }
    case 'client.cancelled':
      return { ...state, status: 'cancelled', steps: settleSteps(state.steps) }
    case 'ui.action':
      // Executed by the store (it needs the browser); the outcome arrives as client.actionDone.
      return state
  }
}

/** A run that ends mid-tool leaves no spinner behind. */
const settleSteps = (steps: ToolStep[]): ToolStep[] =>
  steps.map((step) => (step.status === 'running' ? { ...step, status: 'failed' } : step))
