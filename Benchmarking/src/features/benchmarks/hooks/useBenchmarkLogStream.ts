import { useEffect, useRef, useState } from 'react'

export type LogStreamStatus = 'idle' | 'open' | 'error' | 'closed'

/**
 * Generic SSE log-stream hook. Pass the full API path (e.g.
 * `/api/v1/benchmarks/<id>/logs/stream`). Pass null to stay idle.
 * Reconnects are disabled — the stream closes on error so a finished/failed
 * run doesn't reconnect forever.
 *
 * `onLine` fires for each streamed line (kept in a ref so passing an inline
 * callback doesn't re-subscribe the stream).
 */
export const useLogStream = (path: string | null, onLine?: (line: string) => void) => {
  const [lines, setLines] = useState<string[]>([])
  const [status, setStatus] = useState<LogStreamStatus>('idle')

  const onLineRef = useRef(onLine)
  onLineRef.current = onLine

  useEffect(() => {
    if (!path) return

    setLines([])
    setStatus('idle')

    const source = new EventSource(path)

    source.onopen = () => setStatus('open')
    source.onmessage = (event) => {
      setLines((prev) => [...prev, event.data])
      onLineRef.current?.(event.data)
    }
    source.onerror = () => {
      setStatus(source.readyState === EventSource.CLOSED ? 'closed' : 'error')
      source.close()
    }

    return () => source.close()
  }, [path])

  return { lines, status }
}

/** Convenience wrapper for benchmark task log streams. */
export const useBenchmarkLogStream = (taskId: string | null) =>
  useLogStream(taskId ? `/api/v1/benchmarks/${taskId}/logs/stream` : null)
