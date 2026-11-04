import { parseCommand } from './parseCommand'
import { runCommand } from './runCommand'
import type { ToolContext } from '../types'

const stubContext = (pathname = '/'): ToolContext => ({
  pathname,
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

describe('parseCommand', () => {
  it.each([
    ['go to benchmarks', 'benchmarks'],
    ['Benchmarks', 'benchmarks'],
    ['take me home', 'benchmarks'],
    ['open blogs', 'blogs'],
    ['about us', 'about'],
    ['launch jupyter', 'jupyter'],
    ['show me the notebooks page', 'jupyter'],
  ])('"%s" navigates to %s', (input, section) => {
    expect(parseCommand(input)).toEqual({ tool: 'navigate', args: { section } })
  })

  it.each([
    ['start a benchmark', 'start_benchmark'],
    ['run new benchmark', 'start_benchmark'],
    ['reset filters', 'reset_filters'],
    ['go back', 'go_back'],
    ['help', 'help'],
  ])('"%s" calls %s', (input, tool) => {
    expect(parseCommand(input)?.tool).toBe(tool)
  })

  it('extracts the benchmark metric', () => {
    expect(parseCommand('show TTFT chart')).toEqual({
      tool: 'set_benchmark_type',
      args: { type: 'ttft' },
    })
  })

  it('parses color scheme commands', () => {
    expect(parseCommand('dark mode')?.args).toEqual({ scheme: 'dark' })
    expect(parseCommand('switch to light theme')?.args).toEqual({ scheme: 'light' })
    expect(parseCommand('toggle theme')?.args).toEqual({ scheme: 'toggle' })
  })

  it('treats words after "post" as a blog topic', () => {
    expect(parseCommand('read the post about pcie topology')).toEqual({
      tool: 'open_blog_post',
      args: { query: 'pcie topology' },
    })
  })

  it.each([
    ['navigate to the dashboard', 'benchmarks'],
    ['head over to the performance page', 'benchmarks'],
    ['bring me to the articles', 'blogs'],
    ['where is the news', 'blogs'],
    ['who are you', 'about'],
    ['take me to the company page', 'about'],
    ['fire up a notebook', 'jupyter'],
  ])('synonym "%s" navigates to %s', (input, section) => {
    expect(parseCommand(input)).toEqual({ tool: 'navigate', args: { section } })
  })

  it.each([
    ['go to benchmrks', 'navigate'],
    ['opne the blgos', 'navigate'],
    ['strat a benchmark', 'start_benchmark'],
    ['kick off a new benchmark', 'start_benchmark'],
    ['wipe all the filters', 'reset_filters'],
    ['clear filtres', 'reset_filters'],
    ['what can you do', 'help'],
    ['return to the previous page', 'go_back'],
    ['night mode', 'set_color_scheme'],
    ['change the appearance', 'set_color_scheme'],
    ['show time to first token', 'set_benchmark_type'],
  ])('synonym/typo "%s" calls %s', (input, tool) => {
    expect(parseCommand(input)?.tool).toBe(tool)
  })

  it('returns null for gibberish', () => {
    expect(parseCommand('asdf qwer zxcv uiop')).toBeNull()
    expect(parseCommand('   ')).toBeNull()
  })
})

describe('runCommand', () => {
  it('navigates when asked to go to benchmarks', async () => {
    const ctx = stubContext('/blogs')
    expect(await runCommand('go to benchmarks', ctx)).toEqual({
      text: 'Opened Benchmarks.',
      tool: 'navigate',
    })
    expect(ctx.navigateTo).toHaveBeenCalledWith('benchmarks')
  })

  it('moves to benchmarks before opening the start wizard', async () => {
    const ctx = stubContext('/about')
    await runCommand('start a benchmark', ctx)
    expect(ctx.navigateTo).toHaveBeenCalledWith('benchmarks')
    expect(ctx.openStartBenchmark).toHaveBeenCalled()
  })

  it('opens the best-matching blog post', async () => {
    const ctx = stubContext()
    await runCommand('read the post about pcie topology', ctx)
    expect(ctx.navigatePath).toHaveBeenCalledWith('/blogs/pcie-topology-in-practice')
  })

  it('normalises the metric to the option label', async () => {
    const ctx = stubContext()
    await runCommand('switch to throughput', ctx)
    expect(ctx.setBenchmarkType).toHaveBeenCalledWith('Throughput')
  })

  it('replies with a hint when nothing matches', async () => {
    expect((await runCommand('asdf qwer zxcv uiop', stubContext())).tool).toBeUndefined()
  })
})
