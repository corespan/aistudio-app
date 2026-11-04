import { localAnswer } from './localAnswer'

const create = vi.fn()
vi.mock('./localEngine', () => ({
  getLocalEngine: async () => ({ chat: { completions: { create } } }),
}))

/** Fake a streamed reply that arrives in pieces, like the real model. */
const streamOf = (...pieces: string[]) =>
  (async function* () {
    for (const content of pieces) yield { choices: [{ delta: { content } }] }
  })()

describe('localAnswer', () => {
  beforeEach(() => create.mockReset())

  it('streams the answer piece by piece and returns the whole thing', async () => {
    create.mockResolvedValueOnce(streamOf('A GPU ', 'is a chip ', 'that does maths fast. '))
    const partials: string[] = []
    const answer = await localAnswer('what is a gpu', '/', (text) => partials.push(text))

    expect(answer).toBe('A GPU is a chip that does maths fast.')
    expect(partials).toEqual([
      'A GPU ',
      'A GPU is a chip ',
      'A GPU is a chip that does maths fast. ',
    ])
  })

  it('sends the app context, a word limit and streaming', async () => {
    create.mockResolvedValueOnce(streamOf('ok'))
    await localAnswer('what is ttft', '/blogs')

    const request = create.mock.calls[0][0]
    expect(request.stream).toBe(true)
    expect(request.max_tokens).toBeGreaterThan(0)
    expect(request.messages[0].role).toBe('system')
    expect(request.messages[0].content).toContain('AI Studio')
    expect(request.messages[0].content).toContain('"/blogs"')
    expect(request.messages.at(-1)).toEqual({ role: 'user', content: 'what is ttft' })
  })
})
