import { useLocalAIStore } from '../localai/useLocalAIStore'
import type { ToolContext } from '../types'
import { runCommand } from './runCommand'

const localPickTool = vi.fn()
vi.mock('../localai/localPickTool', () => ({
  localPickTool: (...args: unknown[]) => localPickTool(...args),
}))
const localAnswer = vi.fn()
vi.mock('../localai/localAnswer', () => ({
  localAnswer: (...args: unknown[]) => localAnswer(...args),
}))

const stubContext = (): ToolContext => ({
  pathname: '/',
  navigateTo: vi.fn(),
  navigatePath: vi.fn(),
  goBack: vi.fn(),
  openStartBenchmark: vi.fn(),
  setBenchmarkType: vi.fn(),
  resetFilters: vi.fn(),
  setColorScheme: vi.fn(),
  theme: {},
  setTheme: vi.fn(),
  resetTheme: vi.fn(),
})

const setLocalAI = (enabled: boolean, status: 'off' | 'ready' | 'loading') =>
  useLocalAIStore.setState({ enabled, status })

describe('runCommand — rules first, then local AI', () => {
  beforeEach(() => {
    localPickTool.mockReset()
    localAnswer.mockReset()
    setLocalAI(false, 'off')
  })

  it('uses the rules and never wakes the local AI when they understand', async () => {
    setLocalAI(true, 'ready')
    const ctx = stubContext()
    const reply = await runCommand('dark mode', ctx)
    expect(reply.tool).toBe('set_color_scheme')
    expect(reply.source).toBeUndefined()
    expect(ctx.setColorScheme).toHaveBeenCalledWith('dark')
    expect(localPickTool).not.toHaveBeenCalled()
  })

  it('asks the local AI when the rules fail and runs the tool it picks', async () => {
    setLocalAI(true, 'ready')
    localPickTool.mockResolvedValueOnce([{ tool: 'set_color_scheme', args: { scheme: 'dark' } }])
    const ctx = stubContext()
    const reply = await runCommand('ugh my eyes hurt from all this glare', ctx)
    expect(localPickTool).toHaveBeenCalledWith(
      'ugh my eyes hurt from all this glare',
      '/',
      expect.any(Array),
    )
    expect(reply).toMatchObject({ tool: 'set_color_scheme', source: 'local-ai' })
    expect(ctx.setColorScheme).toHaveBeenCalledWith('dark')
  })

  it('runs a multi-step plan in order and joins the replies', async () => {
    setLocalAI(true, 'ready')
    localPickTool.mockResolvedValueOnce([
      { tool: 'set_color_scheme', args: { scheme: 'dark' } },
      { tool: 'set_benchmark_type', args: { type: 'TTFT' } },
    ])
    const ctx = stubContext()
    const reply = await runCommand('do my usual setup', ctx)
    expect(ctx.setColorScheme).toHaveBeenCalledWith('dark')
    expect(ctx.setBenchmarkType).toHaveBeenCalledWith('TTFT')
    expect(reply.tool).toBe('set_color_scheme → set_benchmark_type')
    expect(reply.text).toBe('Switched to dark mode.\nChart now shows TTFT.')
  })

  it('stops the plan at the first step that fails', async () => {
    setLocalAI(true, 'ready')
    localPickTool.mockResolvedValueOnce([
      { tool: 'set_color_scheme', args: { scheme: 'dark' } },
      { tool: 'set_benchmark_type', args: { type: 'TTFT' } },
    ])
    const ctx = stubContext()
    vi.mocked(ctx.setColorScheme).mockImplementation(() => {
      throw new Error('theme is locked')
    })
    const reply = await runCommand('do my usual setup', ctx)
    expect(reply.text).toBe("That didn't work: theme is locked")
    expect(ctx.setBenchmarkType).not.toHaveBeenCalled()
  })

  it('answers as a question when no tool fits, streaming the reply', async () => {
    setLocalAI(true, 'ready')
    localPickTool.mockResolvedValueOnce([])
    localAnswer.mockResolvedValueOnce('A GPU is a chip built for doing many calculations at once.')
    const onPartial = vi.fn()
    const reply = await runCommand('what is gpu', stubContext(), { onPartial })

    expect(localAnswer).toHaveBeenCalledWith('what is gpu', '/', onPartial)
    expect(reply).toEqual({
      text: 'A GPU is a chip built for doing many calculations at once.',
      source: 'local-ai',
    })
  })

  it('says sorry instead of crashing when the local AI throws', async () => {
    setLocalAI(true, 'ready')
    localPickTool.mockRejectedValueOnce(new Error('GPU device lost'))
    localAnswer.mockRejectedValueOnce(new Error('GPU device lost'))
    const reply = await runCommand('blah blah blah', stubContext())
    expect(reply.text).toMatch(/didn't understand/)
    expect(reply.source).toBeUndefined()
  })

  it('says sorry when the answer comes back empty', async () => {
    setLocalAI(true, 'ready')
    localPickTool.mockResolvedValueOnce([])
    localAnswer.mockResolvedValueOnce('')
    expect((await runCommand('hmm', stubContext())).text).toMatch(/didn't understand/)
  })

  it('does not invent a written answer for an instruction it could not map', async () => {
    setLocalAI(true, 'ready')
    localPickTool.mockResolvedValueOnce([])
    const reply = await runCommand('set the gizmo', stubContext())
    expect(reply.text).toMatch(/couldn't work out which field or action/)
    expect(localAnswer).not.toHaveBeenCalled()
  })

  it('suggests switching on Local AI for questions while it is off', async () => {
    const reply = await runCommand('what is gpu', stubContext())
    expect(reply.text).toMatch(/didn't understand/)
    expect(reply.text).toMatch(/switch on Local AI/)
    expect(localAnswer).not.toHaveBeenCalled()
  })

  it.each([
    ['switched off', false, 'off'],
    ['still downloading', true, 'loading'],
  ] as const)('skips the local AI while it is %s', async (_label, enabled, status) => {
    setLocalAI(enabled, status)
    await runCommand('ugh my eyes hurt from all this glare', stubContext())
    expect(localPickTool).not.toHaveBeenCalled()
    expect(localAnswer).not.toHaveBeenCalled()
  })
})
