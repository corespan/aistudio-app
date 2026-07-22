import type { BenchmarkRun } from '../../types'
import type { RunStream } from '../../store/useRunStreamsStore'

/** Map the SSE stream status to a human-readable table status. */
const streamStatusToDisplay = (status: RunStream['status']): string => {
  if (status === 'failed') return 'Failed'
  if (status === 'closed') return 'Success'
  return 'In Progress'
}

/**
 * Project a live run stream into a table row. Used only for runs not yet returned
 * by `/api/v1/benchmarks` (a just-started run). Metrics are unknown until the API
 * record appears; status reflects the live stream state so failed runs show "Failed"
 * immediately rather than staying stuck on "In Progress".
 * Once the API returns the real record (on success), that row takes over.
 */
export const toRunStreamRow = (stream: RunStream): BenchmarkRun => ({
  runId: stream.taskId,
  model: stream.model ?? '—',
  machineIp: stream.nodeIp ?? '',
  gpuType: '—',
  gpuCount: null,
  benchmarkType: '—',
  precision: '—',
  concurrency: null,
  throughput: null,
  ttft: null,
  tpot: null,
  e2el: null,
  memory: null,
  status: streamStatusToDisplay(stream.status),
  timestamp: stream.startedAt,
})
