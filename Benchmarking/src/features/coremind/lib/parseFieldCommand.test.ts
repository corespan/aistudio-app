import type { CoreMindField } from '@/shared/coremind/fieldRegistry'
import { parseFieldCommand } from './parseFieldCommand'

const field = (label: string, aliases: string[] = []): CoreMindField => ({
  id: label,
  name: label,
  label,
  aliases,
  kind: 'text',
  options: [],
  disabled: false,
  getValue: () => '',
  setValue: () => {},
  element: () => null,
})

const FIELDS = [
  field('Concurrency'),
  field('max_tokens', ['max tokens']),
  field('Input Tokens'),
  field('Node IP', ['ip', 'machine']),
]
const fill = (target: string, value: string) => ({ tool: 'fill_input', args: { target, value } })

describe('parseFieldCommand — any field on screen', () => {
  it.each([
    ['add concurrency 64', 'Concurrency', '64'],
    ['set concurrency to 128', 'Concurrency', '128'],
    ['set the max tokens 256', 'max_tokens', '256'],
    ['set max_tokens = 512', 'max_tokens', '512'],
    ['add input tokens: 1024', 'Input Tokens', '1024'],
    ['enter machine 10.0.0.12', 'Node IP', '10.0.0.12'],
    ['concurrency is 32', 'Concurrency', '32'],
    ['input tokens should be 2048', 'Input Tokens', '2048'],
    ['select concurrency "16"', 'Concurrency', '16'],
    ['set concurrency', 'Concurrency', ''],
  ])('"%s" → %s = %s', (input, target, value) => {
    expect(parseFieldCommand(input, FIELDS)).toEqual(fill(target, value))
  })

  it('prefers the longest field name ("input tokens" over a field called "input")', () => {
    expect(
      parseFieldCommand('add input tokens 10', [field('Input'), field('Input Tokens')]),
    ).toEqual(fill('Input Tokens', '10'))
  })

  it.each([
    'concurrency comparison', // no verb and no "is" — not a command
    'add a new benchmark', // no field by that name
    'dark mode',
  ])('ignores "%s"', (input) => {
    expect(parseFieldCommand(input, FIELDS)).toBeNull()
  })

  it('does nothing when no fields are on screen', () => {
    expect(parseFieldCommand('add concurrency 64', [])).toBeNull()
  })
})
