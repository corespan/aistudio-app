import { parseRunEvent } from './events'

describe('parseRunEvent', () => {
  it('accepts a valid event', () => {
    expect(parseRunEvent({ type: 'run.started', runId: 'r1', agent: 'analyst' })).toEqual({
      type: 'run.started',
      runId: 'r1',
      agent: 'analyst',
    })
  })

  it('defaults missing ui.action args to an empty object', () => {
    expect(parseRunEvent({ type: 'ui.action', tool: 'start_benchmark' })).toEqual({
      type: 'ui.action',
      tool: 'start_benchmark',
      args: {},
    })
  })

  it('drops unknown or malformed events instead of throwing', () => {
    expect(parseRunEvent({ type: 'something.new' })).toBeNull()
    expect(parseRunEvent({ type: 'tool.call', id: 't1', tool: 'x', class: 'admin' })).toBeNull()
    expect(parseRunEvent('not an object')).toBeNull()
  })
})
