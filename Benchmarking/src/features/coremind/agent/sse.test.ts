import { createSseDecoder } from './sse'

const decode = (chunks: string[]) => {
  const messages: { data: string; event?: string }[] = []
  const decoder = createSseDecoder((data, event) => messages.push({ data, event }))
  chunks.forEach((chunk) => decoder.push(chunk))
  decoder.flush()
  return messages
}

describe('createSseDecoder', () => {
  it('emits one message per blank-line-terminated block', () => {
    expect(decode(['data: {"a":1}\n\ndata: {"b":2}\n\n'])).toEqual([
      { data: '{"a":1}', event: undefined },
      { data: '{"b":2}', event: undefined },
    ])
  })

  it('reassembles events split across network chunks', () => {
    expect(decode(['da', 'ta: hel', 'lo\n', '\n'])).toEqual([{ data: 'hello', event: undefined }])
  })

  it('joins multi-line data, reads the event name and handles CRLF', () => {
    expect(decode(['event: token\r\ndata: one\r\ndata: two\r\n\r\n'])).toEqual([
      { data: 'one\ntwo', event: 'token' },
    ])
  })

  it('skips keep-alive comments and flushes a final event without a blank line', () => {
    expect(decode([': ping\n\n', 'data: last'])).toEqual([{ data: 'last', event: undefined }])
  })
})
