import { render, screen } from '@testing-library/react'
import { MantineProvider, Select, TextInput } from '@mantine/core'
import { useState } from 'react'
import type { ToolContext } from '../types'
import { runCommand } from './runCommand'

// jsdom lacks these browser APIs that Mantine's dropdowns use.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  Element.prototype.scrollIntoView ??= () => {}
})

/** A filter row like the Benchmarks page, built from real Mantine inputs. */
const FilterForm = ({ models }: { models: string[] }) => {
  const [gpu, setGpu] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const [concurrency, setConcurrency] = useState('')
  return (
    <MantineProvider>
      <Select label="GPU Type" data={['A100', 'H100', 'L40S']} value={gpu} onChange={setGpu} />
      <Select label="Model" searchable data={models} value={model} onChange={setModel} />
      <TextInput
        label="Concurrency"
        value={concurrency}
        onChange={(e) => setConcurrency(e.currentTarget.value)}
      />
      <output data-testid="state">{JSON.stringify({ gpu, model, concurrency })}</output>
    </MantineProvider>
  )
}

const state = () => JSON.parse(screen.getByTestId('state').textContent ?? '')
const ctx = { pathname: '/' } as ToolContext

describe('fill commands on real Mantine fields', () => {
  it('puts exactly the requested value into each input', async () => {
    render(<FilterForm models={['llama-3.1-8b', 'mistral-7b']} />)

    expect((await runCommand('add H100 to gpu type', ctx)).text).toBe('Selected "H100".')
    expect((await runCommand('set model to llama', ctx)).text).toBe('Selected "llama-3.1-8b".')
    expect((await runCommand('add 64 to concurrency', ctx)).text).toBe('Entered "64".')

    expect(state()).toEqual({ gpu: 'H100', model: 'llama-3.1-8b', concurrency: '64' })
  }, 20_000)

  it('asks instead of picking a random option when several match', async () => {
    render(<FilterForm models={['llama-3.1-8b', 'llama-3.1-70b', 'mistral-7b']} />)

    const reply = await runCommand('set model to llama', ctx)
    expect(reply.text).toMatch(/matches several options \(llama-3\.1-8b, llama-3\.1-70b\)/)
    expect(state().model).toBeNull()
  }, 20_000)
})
