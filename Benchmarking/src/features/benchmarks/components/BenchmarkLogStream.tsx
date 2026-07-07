import { useLogStream } from '../hooks/useBenchmarkLogStream'
import { LogStreamView } from './LogStreamView'

type Props = {
  /** Task id shown in the log header. */
  taskId: string
  /**
   * Full SSE path to subscribe to. Defaults to the benchmark stream path
   * `/api/v1/benchmarks/<taskId>/logs/stream` when omitted.
   */
  streamPath?: string
  /** Called for each streamed log line (e.g. to detect a ready URL). */
  onLine?: (line: string) => void
}

/**
 * Self-contained live log stream: opens its own one-shot SSE connection and
 * renders it. Used where a stream's lifetime matches the component's (e.g. the
 * Jupyter launcher). For benchmark runs that must survive component unmounts and
 * run concurrently, stream through `useRunStreamsStore` instead.
 */
export const BenchmarkLogStream = ({ taskId, streamPath, onLine }: Props) => {
  const path = streamPath ?? `/api/v1/benchmarks/${taskId}/logs/stream`
  const { lines, status } = useLogStream(path, onLine)

  return <LogStreamView taskId={taskId} lines={lines} status={status} />
}
