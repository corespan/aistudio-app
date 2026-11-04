import { act, render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { runCommand } from '@/features/coremind/lib/runCommand'
import type { ToolContext } from '@/features/coremind/types'
import { useStartBenchmarkModalStore } from '../store/useStartBenchmarkModalStore'
import { StartBenchmarkModal } from './StartBenchmarkModal'

// The wizard's data comes from the API — stand in for it with stable objects,
// like React Query's cache (a fresh object per render would re-seed the
// config form on every render).
const api = vi.hoisted(() => ({
  models: {
    data: ['llama-3.1-8b', 'llama-3.1-70b', 'mistral-7b'],
    isPending: false,
    isError: false,
  },
  nodes: { data: [], isPending: false, isError: false },
  configLoaded: {
    isSuccess: true,
    isFetching: false,
    isError: false,
    data: { max_tokens: 128, precision: 'fp16' },
  },
  configIdle: { isSuccess: false, isFetching: false, isError: false, data: undefined },
}))
vi.mock('../data/queries/useBenchmarkOptions', () => ({
  useNodes: () => api.nodes,
  useModels: () => api.models,
}))
vi.mock('../data/queries/useModelConfig', () => ({
  useModelConfig: (nodeIp: string | null, model: string | null) =>
    nodeIp && model ? api.configLoaded : api.configIdle,
}))
const mutate = vi.fn()
vi.mock('../data/queries/useStartBenchmark', () => ({
  useStartBenchmark: () => ({ mutate, reset: vi.fn(), isPending: false }),
}))

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  Element.prototype.scrollIntoView ??= () => {}
})

const ctx = {
  pathname: '/',
  startBenchmarkWizard: () => useStartBenchmarkModalStore.getState().wizard,
} as ToolContext

/** Send a chat message to CoreMind and return its reply text. */
const say = async (message: string) => {
  let text = ''
  await act(async () => {
    text = (await runCommand(message, ctx)).text
  })
  return text
}

const nodeIpInput = () => screen.getByPlaceholderText(/machine IP/)

const renderWizard = () =>
  render(
    <MantineProvider>
      <StartBenchmarkModal opened onClose={() => {}} />
    </MantineProvider>,
  )

describe('CoreMind fills the Start Benchmark wizard step by step', () => {
  beforeEach(() => mutate.mockReset())

  it('shows each value in its input and moves between steps', async () => {
    renderWizard()

    // Step 1 — node
    expect(await say('add node ip 10.0.0.12')).toBe(
      'Node IP set to 10.0.0.12. Next: "add model <name>".',
    )
    expect(nodeIpInput()).toHaveValue('10.0.0.12')

    // Step 2 — model (jumps to the model step on its own)
    expect(await say('add model llama')).toBe(
      'Several models match "llama": llama-3.1-8b, llama-3.1-70b. Which one?',
    )
    expect(await say('select model mistral')).toBe(
      'Model set to mistral-7b. Say "next" to load its configuration.',
    )
    // The visible Model input (not just the hidden form value) shows the selection.
    const shown = screen
      .getAllByDisplayValue('mistral-7b')
      .filter((el) => el.getAttribute('type') !== 'hidden')
    expect(shown).toHaveLength(1)

    // Step 3 — configuration
    expect(await say('move to next page')).toBe('Moved to step 3, Model Configuration.')
    expect(screen.getByLabelText('max_tokens')).toHaveValue('128')
    expect(await say('set max tokens to 256')).toBe('max_tokens set to 256.')
    expect(screen.getByLabelText('max_tokens')).toHaveValue('256')

    // Step 4 — review, and it never starts the run by itself
    expect(await say('next')).toBe('Moved to step 4, Review & Confirm.')
    expect(await say('next')).toBe(
      'This is the last step. Review everything, then click "Start Benchmark" to run it.',
    )
    expect(mutate).not.toHaveBeenCalled()

    expect(await say('previous step')).toBe('Back to step 3, Model Configuration.')
  })

  it('refuses text that is not a machine address', async () => {
    renderWizard()
    expect(await say('add node ip hello world')).toMatch(/doesn't look like a machine IP/)
    expect(nodeIpInput()).toHaveValue('')
  })

  it('asks for the node first, and lists models when no name is given', async () => {
    renderWizard()
    expect(await say('add model mistral')).toBe(
      'Add the node IP first. For example: "add node ip 10.0.0.12".',
    )
    await say('add node ip 10.0.0.12')
    expect(await say('add model')).toBe(
      'Which model? Available: llama-3.1-8b, llama-3.1-70b, mistral-7b.',
    )
  })

  it('will not skip ahead past an empty step', async () => {
    renderWizard()
    expect(await say('next')).toBe('Node IP is required')
  })
})
