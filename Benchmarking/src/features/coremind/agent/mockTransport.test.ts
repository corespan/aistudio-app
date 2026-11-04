import type { RunEvent } from './events'
import { mockTransport, pickScenario } from './mockTransport'

const request = (input: string) => ({ input, context: { page: '/' } })

describe('mock planner', () => {
  it.each([
    ['start a benchmark', 'analyst'],
    ['why is my run slow?', 'diagnostics'],
    ['service status', 'assistant'],
    ['compare the latest runs', 'analyst'],
  ])('routes "%s" to %s', (input, agent) => {
    const first = pickScenario(input)(request(input)).next().value as RunEvent
    expect(first).toMatchObject({ type: 'run.started', agent })
  })
})

describe('mockTransport', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('waits for approval, then runs the plan and opens the wizard', async () => {
    const events: RunEvent[] = []
    const handle = mockTransport.start(request('start a benchmark'), (e) => events.push(e))

    await vi.advanceTimersByTimeAsync(5_000)
    expect(events.at(-1)?.type).toBe('plan.proposed')

    await handle.approve()
    await vi.runAllTimersAsync()
    await handle.done

    expect(events).toContainEqual({ type: 'ui.action', tool: 'start_benchmark', args: {} })
    expect(events.at(-1)).toEqual({ type: 'run.completed' })
  })

  it('stops after a rejected plan', async () => {
    const events: RunEvent[] = []
    const handle = mockTransport.start(request('start a benchmark'), (e) => events.push(e))
    await vi.advanceTimersByTimeAsync(5_000)
    await handle.reject()
    await vi.runAllTimersAsync()
    await handle.done
    expect(events.at(-1)?.type).toBe('plan.proposed')
  })

  it('rejects `done` with an AbortError when cancelled', async () => {
    const handle = mockTransport.start(request('service status'), () => {})
    handle.cancel()
    await expect(handle.done).rejects.toMatchObject({ name: 'AbortError' })
  })
})
