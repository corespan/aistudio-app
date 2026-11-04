import {
  buildSystemPrompt,
  LOCAL_SAFE_TOOLS,
  localPickTool,
  MAX_CALLS,
  parseDecision,
} from './localPickTool'

// Stand-in for the WebLLM engine: replies with whatever the test queues.
const create = vi.fn()
vi.mock('./localEngine', () => ({
  getLocalEngine: async () => ({ chat: { completions: { create } } }),
}))

const replyWith = (content: string) =>
  create.mockResolvedValueOnce({ choices: [{ message: { content } }] })

const plan = (...calls: object[]) => JSON.stringify({ calls })

describe('parseDecision', () => {
  it('accepts a single safe call', () => {
    expect(parseDecision(plan({ tool: 'set_color_scheme', args: { scheme: 'dark' } }))).toEqual([
      { tool: 'set_color_scheme', args: { scheme: 'dark' } },
    ])
  })

  it('keeps several calls in order — one per field', () => {
    expect(
      parseDecision(
        plan(
          { tool: 'fill_input', args: { target: 'Concurrency', value: '64' } },
          { tool: 'fill_input', args: { target: 'Precision', value: 'fp16' } },
        ),
      ),
    ).toEqual([
      { tool: 'fill_input', args: { target: 'Concurrency', value: '64' } },
      { tool: 'fill_input', args: { target: 'Precision', value: 'fp16' } },
    ])
  })

  it('drops calls to tools the local AI may not use, keeping the safe ones', () => {
    expect(
      parseDecision(
        plan(
          { tool: 'fill_input', args: { target: 'Model', value: 'llama' } },
          { tool: 'click_element', args: { target: 'Delete run' } },
          { tool: 'delete_everything', args: {} },
        ),
      ),
    ).toEqual([{ tool: 'fill_input', args: { target: 'Model', value: 'llama' } }])
  })

  it(`never runs more than ${MAX_CALLS} steps`, () => {
    const many = Array.from({ length: 9 }, () => ({ tool: 'go_back', args: {} }))
    expect(parseDecision(plan(...many))).toHaveLength(MAX_CALLS)
  })

  it.each([
    ['an empty plan', plan()],
    ['broken JSON', '{"calls": ['],
    ['the wrong shape', '{"tool":"navigate"}'],
    ['an empty reply', ''],
    ['no reply at all', null],
  ])('gives no calls for %s', (_label, raw) => {
    expect(parseDecision(raw)).toEqual([])
  })

  it('drops args that are not non-empty strings', () => {
    expect(
      parseDecision(
        plan({ tool: 'set_theme', args: { primaryColor: 'teal', radius: 3, fontFamily: '' } }),
      ),
    ).toEqual([{ tool: 'set_theme', args: { primaryColor: 'teal' } }])
  })
})

describe('buildSystemPrompt', () => {
  it('lists every safe tool and the current page, and never the unsafe ones', () => {
    const prompt = buildSystemPrompt('/blogs')
    expect(prompt).toContain('"/blogs"')
    for (const name of LOCAL_SAFE_TOOLS) expect(prompt).toContain(`- ${name}:`)
    expect(prompt).not.toContain('- click_element:')
  })

  it('shows the model the form fields that are on screen', () => {
    const prompt = buildSystemPrompt('/', [
      'Model (dropdown: llama-3.1-8b, mistral-7b)',
      'Concurrency (text)',
    ])
    expect(prompt).toContain('- Model (dropdown: llama-3.1-8b, mistral-7b)')
    expect(prompt).toContain('- Concurrency (text)')
  })
})

describe('localPickTool', () => {
  beforeEach(() => create.mockReset())

  it('asks with a forced JSON shape and the fields on screen, and returns the plan', async () => {
    replyWith(plan({ tool: 'navigate', args: { section: 'blogs' } }))
    await expect(localPickTool('take me to the write-ups', '/', ['Model (text)'])).resolves.toEqual(
      [{ tool: 'navigate', args: { section: 'blogs' } }],
    )

    const request = create.mock.calls[0][0]
    expect(request.messages[0].content).toContain('- Model (text)')
    expect(request.messages.at(-1)).toEqual({ role: 'user', content: 'take me to the write-ups' })
    expect(request.temperature).toBe(0)
    expect(request.response_format.type).toBe('json_object')
    const schema = JSON.parse(request.response_format.schema)
    expect(schema.properties.calls.maxItems).toBe(MAX_CALLS)
    expect(schema.properties.calls.items.properties.tool.enum).not.toContain('click_element')
  })
})
