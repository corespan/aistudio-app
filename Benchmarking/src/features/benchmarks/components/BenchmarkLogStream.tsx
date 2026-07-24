import { useLogStream } from '../hooks/useBenchmarkLogStream'
import { LogStreamView } from './LogStreamView'
import type { BenchmarkLogStreamProps } from '../types'

/**
 * Self-contained live log stream: opens its own one-shot SSE connection and
 * renders it. Used where a stream's lifetime matches the component's (e.g. the
 * Jupyter launcher). For benchmark runs that must survive component unmounts and
 * run concurrently, stream through `useRunStreamsStore` instead.
 */
export const BenchmarkLogStream = ({ taskId, streamPath, onLine }: BenchmarkLogStreamProps) => {
  const path = streamPath ?? `/api/v1/benchmarks/${taskId}/logs/stream`
  const { lines, status } = useLogStream(path, onLine)

  return <LogStreamView taskId={taskId} lines={lines} status={status} />
}
