/**
 * Minimal Server-Sent Events decoder for streamed `fetch` bodies. The
 * browser's EventSource can't send an Authorization header or a POST body,
 * so the run stream is read with fetch and decoded here.
 *
 * Feed it text chunks as they arrive; it calls `onMessage` once per complete
 * event with the joined `data:` lines. Comments (`: keep-alive`) are skipped.
 */
export const createSseDecoder = (onMessage: (data: string, event?: string) => void) => {
  let buffer = ''

  const dispatch = (block: string) => {
    const data: string[] = []
    let event: string | undefined
    for (const line of block.split('\n')) {
      if (!line || line.startsWith(':')) continue
      const colon = line.indexOf(':')
      const field = colon === -1 ? line : line.slice(0, colon)
      // One optional space after the colon is part of the syntax, not the value.
      const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '')
      if (field === 'data') data.push(value)
      else if (field === 'event') event = value
    }
    if (data.length) onMessage(data.join('\n'), event)
  }

  return {
    push(chunk: string) {
      buffer += chunk.replace(/\r\n?/g, '\n')
      let end = buffer.indexOf('\n\n')
      while (end !== -1) {
        dispatch(buffer.slice(0, end))
        buffer = buffer.slice(end + 2)
        end = buffer.indexOf('\n\n')
      }
    },
    /** Dispatch whatever is left when the stream closes without a final blank line. */
    flush() {
      if (buffer.trim()) dispatch(buffer)
      buffer = ''
    },
  }
}
