import type { BenchmarkRun } from '../../types'
import type { RunStream } from '../../store/useRunStreamsStore'

/**
 * Project a live run stream into a table row. Used only for runs not yet returned
 * by `/api/v1/benchmarks` (a just-started run), so metrics are unknown and the
 * status is always "In Progress" — once the API returns the real record, that row
 * takes over (see BenchmarksTable's merge).
 */
export const toRunStreamRow = (stream: RunStream): BenchmarkRun => ({
  runId: stream.taskId,
  model: stream.model ?? '—',
  machineIp: stream.nodeIp ?? '',
  gpuType: '—',
  benchmarkType: '—',
  precision: '—',
  concurrency: null,
  throughput: null,
  ttft: null,
  tpot: null,
  e2el: null,
  memory: null,
  status: 'In Progress',
  timestamp: stream.startedAt,
})
