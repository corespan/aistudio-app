import { parseCommand } from './parseCommand'

const field = (field: string, value: string) => ({
  tool: 'set_benchmark_field',
  args: { field, value },
})

describe('parseCommand — Start Benchmark wizard, step by step', () => {
  it.each([
    ['add node ip 10.0.0.12', 'nodeIp', '10.0.0.12'],
    ['add the node ip 10.0.0.12', 'nodeIp', '10.0.0.12'],
    ['add node ip: 10.0.0.12', 'nodeIp', '10.0.0.12'],
    ['add ip address 192.168.1.5', 'nodeIp', '192.168.1.5'],
    ['enter node ip as 10.0.0.12', 'nodeIp', '10.0.0.12'],
    ['add 10.0.0.12 to the node ip', 'nodeIp', '10.0.0.12'],
    ['node ip is 10.0.0.12', 'nodeIp', '10.0.0.12'],
    ['add model llama-3.1-8b', 'model', 'llama-3.1-8b'],
    ['add model llama', 'model', 'llama'],
    ['select model mistral', 'model', 'mistral'],
    ['choose the model "llama 3"', 'model', 'llama 3'],
    ['pick model name mistral-7b', 'model', 'mistral-7b'],
    ['select llama as the model', 'model', 'llama'],
    ['add llama to the model field', 'model', 'llama'],
    ['the model should be mistral', 'model', 'mistral'],
    ['slect model mistral', 'model', 'mistral'], // typo in the verb
  ])('"%s" → %s = %s', (input, name, value) => {
    expect(parseCommand(input)).toEqual(field(name, value))
  })

  it.each([
    ['add node ip', 'nodeIp'],
    ['add model', 'model'],
    ['select model', 'model'],
  ])('"%s" with no value asks for %s', (input, name) => {
    expect(parseCommand(input)).toEqual(field(name, ''))
  })

  it.each([
    'next',
    'next step',
    'Next.',
    'go to next step',
    'move to next page',
    'move to the next page',
    'go on to the next screen',
    'continue',
    'proceed',
  ])('"%s" → next wizard step', (input) => {
    expect(parseCommand(input)).toEqual({ tool: 'wizard_next', args: {} })
  })

  it.each(['previous step', 'move to the previous page', 'go back a step', 'step back', 'back'])(
    '"%s" → back (a wizard step when it is open)',
    (input) => {
      expect(parseCommand(input)).toEqual({ tool: 'go_back', args: {} })
    },
  )

  it('leaves non-wizard fields to the generic page fill', () => {
    expect(parseCommand('add 64 to concurrency')?.tool).toBe('fill_input')
    expect(parseCommand('type llama 3 in the model field')?.tool).toBe('fill_input')
    expect(parseCommand('add a new benchmark')?.tool).toBe('start_benchmark')
  })
})
