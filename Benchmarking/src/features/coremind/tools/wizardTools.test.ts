import type { StartBenchmarkWizardBridge } from '@/features/benchmarks/types'
import type { ToolContext } from '../types'
import { getClientTool } from './clientTools'

const fakeWizard = (isOpen: boolean): StartBenchmarkWizardBridge => ({
  isOpen,
  step: 0,
  fill: vi.fn(async (field: string, value: string) =>
    field === 'nowhere' ? null : `${field} = ${value}`,
  ),
  next: vi.fn(async () => 'Moved to step 2, Configure Model.'),
  back: vi.fn(() => 'Back to step 1, Select Node.'),
})

const run = (tool: string, args: Record<string, string>, ctx: Partial<ToolContext>) =>
  getClientTool(tool)!.execute(args, ctx as ToolContext)

describe('wizard tools', () => {
  it('set_benchmark_field opens the wizard when it is closed, then fills it', async () => {
    const opened = fakeWizard(true)
    const ctx = {
      startBenchmarkWizard: () => fakeWizard(false),
      openStartBenchmarkWizard: vi.fn(async () => opened),
    }
    expect(await run('set_benchmark_field', { field: 'nodeIp', value: '10.0.0.12' }, ctx)).toBe(
      'nodeIp = 10.0.0.12',
    )
    expect(ctx.openStartBenchmarkWizard).toHaveBeenCalled()
  })

  it('set_benchmark_field reuses an open wizard', async () => {
    const wizard = fakeWizard(true)
    const ctx = { startBenchmarkWizard: () => wizard, openStartBenchmarkWizard: vi.fn() }
    await run('set_benchmark_field', { field: 'model', value: 'mistral' }, ctx)
    expect(ctx.openStartBenchmarkWizard).not.toHaveBeenCalled()
    expect(wizard.fill).toHaveBeenCalledWith('model', 'mistral')
  })

  it('set_benchmark_field reports when the wizard cannot open', async () => {
    const ctx = { startBenchmarkWizard: () => null, openStartBenchmarkWizard: async () => null }
    expect(await run('set_benchmark_field', { field: 'model', value: 'x' }, ctx)).toBe(
      "I couldn't open the Start Benchmark wizard.",
    )
  })

  it('fill_input fills the wizard first while it is open', async () => {
    const wizard = fakeWizard(true)
    expect(
      await run(
        'fill_input',
        { target: 'max tokens', value: '256' },
        {
          startBenchmarkWizard: () => wizard,
        },
      ),
    ).toBe('max tokens = 256')
  })

  it('wizard_next and go_back move the open wizard', async () => {
    const wizard = fakeWizard(true)
    const goBack = vi.fn()
    const ctx = { startBenchmarkWizard: () => wizard, goBack }
    expect(await run('wizard_next', {}, ctx)).toBe('Moved to step 2, Configure Model.')
    expect(await run('go_back', {}, ctx)).toBe('Back to step 1, Select Node.')
    expect(goBack).not.toHaveBeenCalled()
  })

  it('wizard_next explains when the wizard is closed', async () => {
    expect(await run('wizard_next', {}, { startBenchmarkWizard: () => null })).toMatch(/isn't open/)
  })
})
