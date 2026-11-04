import { useAgentStore, MAX_SELECTION_CHARS } from './useAgentStore'

const runner = vi.fn(async () => 'Opened the Start Benchmark wizard.')

describe('useAgentStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useAgentStore.getState().reset()
    runner.mockClear()
  })
  afterEach(() => vi.useRealTimers())

  it('runs a mock agent end to end, executing its page action through the runner', async () => {
    const { startRun, approve } = useAgentStore.getState()
    startRun('m1', { input: 'start a benchmark', context: { page: '/' } }, runner)

    await vi.advanceTimersByTimeAsync(5_000)
    expect(useAgentStore.getState().runs.m1.status).toBe('awaiting_approval')

    approve('m1')
    await vi.runAllTimersAsync()

    const run = useAgentStore.getState().runs.m1
    expect(run.status).toBe('completed')
    expect(run.agent).toBe('analyst')
    expect(runner).toHaveBeenCalledWith('start_benchmark', {})
    expect(run.actions).toEqual([
      { tool: 'start_benchmark', text: 'Opened the Start Benchmark wizard.' },
    ])
  })

  it('cancel stops the run without reporting an error', async () => {
    const { startRun, cancel } = useAgentStore.getState()
    startRun('m1', { input: 'service status', context: { page: '/' } }, runner)
    await vi.advanceTimersByTimeAsync(600)
    cancel('m1')
    await vi.runAllTimersAsync()
    const run = useAgentStore.getState().runs.m1
    expect(run.status).toBe('cancelled')
    expect(run.error).toBeUndefined()
  })

  it('trims and caps attached selections', () => {
    useAgentStore.getState().attach(`  ${'x'.repeat(MAX_SELECTION_CHARS + 50)}  `)
    expect(useAgentStore.getState().attachment).toHaveLength(MAX_SELECTION_CHARS)
    useAgentStore.getState().attach('   ')
    expect(useAgentStore.getState().attachment).toBeNull()
  })
})
