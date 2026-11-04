import type { RunEvent } from './events'
import { initialRunState, runReducer, type AgentRunState, type ClientEvent } from './runReducer'

const replay = (events: (RunEvent | ClientEvent)[], from: AgentRunState = initialRunState) =>
  events.reduce(runReducer, from)

describe('runReducer', () => {
  it('records which agent the planner picked', () => {
    const state = replay([{ type: 'run.started', runId: 'r1', agent: 'analyst' }])
    expect(state).toMatchObject({ status: 'running', runId: 'r1', agent: 'analyst' })
  })

  it('pauses on a plan until the user answers', () => {
    const steps = [
      { id: 'p1', title: 'Find runs', tool: 'aistudio/find_runs', class: 'read' as const },
    ]
    const waiting = replay([
      { type: 'run.started', runId: 'r1', agent: 'analyst' },
      { type: 'plan.proposed', steps },
    ])
    expect(waiting.status).toBe('awaiting_approval')
    expect(replay([{ type: 'client.approved' }], waiting)).toMatchObject({
      status: 'running',
      planDecision: 'approved',
    })
    expect(replay([{ type: 'client.rejected' }], waiting)).toMatchObject({
      status: 'cancelled',
      planDecision: 'rejected',
    })
  })

  it('tracks tool steps from call to result', () => {
    const state = replay([
      { type: 'run.started', runId: 'r1', agent: 'diagnostics' },
      { type: 'tool.call', id: 't1', tool: 'aistudio/task_logs', class: 'read' },
      { type: 'tool.call', id: 't2', tool: 'fabric/gpu_node_probe', class: 'read' },
      { type: 'tool.result', id: 't1', ok: true, summary: '3 warnings' },
    ])
    expect(state.steps).toEqual([
      expect.objectContaining({ id: 't1', status: 'done', summary: '3 warnings' }),
      expect.objectContaining({ id: 't2', status: 'running' }),
    ])
  })

  it('appends streamed text and keeps the latest budget', () => {
    const state = replay([
      { type: 'run.started', runId: 'r1', agent: 'assistant' },
      { type: 'token', text: 'All ' },
      { type: 'token', text: 'good.' },
      { type: 'budget', stepsUsed: 1, stepsMax: 4, elapsedS: 2, maxS: 180 },
      { type: 'budget', stepsUsed: 2, stepsMax: 4, elapsedS: 5, maxS: 180 },
    ])
    expect(state.text).toBe('All good.')
    expect(state.budget).toEqual({ stepsUsed: 2, stepsMax: 4, elapsedS: 5, maxS: 180 })
  })

  it('turns a run that fails mid-tool into a failed step, not a spinner', () => {
    const state = replay([
      { type: 'run.started', runId: 'r1', agent: 'assistant' },
      { type: 'tool.call', id: 't1', tool: 'aistudio/recent_runs', class: 'read' },
      { type: 'run.failed', code: 'budget_exceeded', message: 'Out of steps.' },
    ])
    expect(state.status).toBe('failed')
    expect(state.error).toEqual({ code: 'budget_exceeded', message: 'Out of steps.' })
    expect(state.steps[0].status).toBe('failed')
  })

  it('ignores anything that arrives after the run ended', () => {
    const stopped = replay([
      { type: 'run.started', runId: 'r1', agent: 'analyst' },
      { type: 'client.cancelled' },
    ])
    expect(replay([{ type: 'token', text: 'late' }, { type: 'run.completed' }], stopped)).toBe(
      stopped,
    )
  })

  it('records page actions the agent ran', () => {
    const state = replay([
      { type: 'run.started', runId: 'r1', agent: 'analyst' },
      { type: 'ui.action', tool: 'navigate', args: { section: 'benchmarks' } },
      { type: 'client.actionDone', tool: 'navigate', text: 'Opened Benchmarks.' },
    ])
    expect(state.actions).toEqual([{ tool: 'navigate', text: 'Opened Benchmarks.' }])
  })
})
