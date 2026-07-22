import type { BenchmarkRun } from '../../types'

// Coerce to a finite number, or null when the field is missing/non-numeric so
// the table renders an em dash instead of "NaN".
const toNum = (value: unknown): number | null => {
  if (value == null) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

const firstDefined = (...values: unknown[]) => values.find((v) => v != null)

/** Normalize a single raw benchmark record from the API into a BenchmarkRun. */
export const normalizeBenchmarkRun = (item: Record<string, unknown>): BenchmarkRun => ({
  runId: String(item.run_id),
  model: String(item.model_name),
  machineIp: Array.isArray(item.node_ips) ? item.node_ips.join(', ') : '',
  gpuType: String(item.gpu_type),
  gpuCount: toNum(
    firstDefined(item.gpu_count, item.gpuCount, item.num_gpus, item.numGpus, item.gpu_num, item.gpuNum),
  ),
  benchmarkType: String(item.precision),
  precision: String(item.precision),
  concurrency: toNum(item.concurrency),
  throughput: toNum(item.total_token_throughput),
  ttft: toNum(item.mean_ttft_ms),
  tpot: toNum(item.mean_tpot_ms),
  e2el: toNum(item.mean_e2el_ms),
  memory: null,
  status: String(item.status),
  timestamp: String(item.created_at),
})

export const toBenchmarkRows = (raw: unknown): BenchmarkRun[] => {
  // The API returns a top-level array; tolerate a { data: [...] } envelope too.
  const items: Record<string, unknown>[] = Array.isArray(raw)
    ? (raw as Record<string, unknown>[])
    : ((raw as { data?: Record<string, unknown>[] })?.data ?? [])

  return items.map(normalizeBenchmarkRun)
}
