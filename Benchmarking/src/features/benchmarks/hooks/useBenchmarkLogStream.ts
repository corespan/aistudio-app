import { useEffect, useRef, useState } from 'react'
import { API_ORIGIN } from '@/shared/api/config'

export type LogStreamStatus = 'idle' | 'open' | 'reconnecting' | 'error' | 'closed' | 'failed'

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
    // The server sends `event: close` with data "READY" or "FAILED" when the
    // workload reaches a terminal state. Close the EventSource immediately so
    // it does not auto-reconnect.
    source.addEventListener('close', (event: MessageEvent) => {
      source.close()
      setStatus(event.data === 'FAILED' ? 'failed' : 'closed')
    })
    source.onerror = () => {
      // Only reached for actual network errors (readyState stays CONNECTING when
      // the server drops the connection without an `event: close` handshake).
      setStatus(source.readyState === EventSource.CLOSED ? 'closed' : 'error')
      source.close()
    }

    return () => source.close()
  }, [path])

  return { lines, status }
}

/** Convenience wrapper for benchmark task log streams. */
export const useBenchmarkLogStream = (taskId: string | null) =>
  useLogStream(taskId ? `${API_ORIGIN}/api/v1/benchmarks/${taskId}/logs/stream` : null)
