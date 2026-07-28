import type { BenchmarkRun } from '../../types'

// Coerce to a finite number, or null when the field is missing/non-numeric so
// the table renders an em dash instead of "NaN".
const toNum = (value: unknown): number | null => {
  if (value == null) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

// Coerce to a string, falling back when the field is missing/null/empty so the
// table renders a placeholder instead of the literal text "undefined"/"null"
// or a blank cell. (String(undefined) === "undefined", a truthy string, so a
// bare `|| fallback` does NOT catch null — the check has to happen first; it
// does catch '""', which is why failed runs with `gpu_type: ""` show '—'.)
// Also catches a literal NaN value (e.g. a bad/unparseable numeric field) —
// otherwise `String(NaN)` silently becomes the text "NaN" and shows up as a
// real-looking GPU/model/etc. entry in tables, filters, and the chart's GPU
// series panel.
const toStr = (value: unknown, fallback = '—'): string => {
  if (value == null || value === '') return fallback
  if (typeof value === 'number' && Number.isNaN(value)) return fallback
  return String(value)
}

const firstDefined = (...values: unknown[]) => values.find((v) => v != null)

/** Normalize a single raw benchmark record from the API into a BenchmarkRun. */
export const normalizeBenchmarkRun = (item: Record<string, unknown>): BenchmarkRun => ({
  // Empty (not '—'): downstream code keys/dedupes/deletes by runId, so a
  // missing id should be falsy rather than a plausible-looking placeholder.
  runId: toStr(item.run_id, ''),
  model: toStr(item.model_name),
  machineIp: Array.isArray(item.node_ips) ? item.node_ips.join(', ') : '',
  serverName: toStr(item.server_name),
  gpuType: toStr(item.gpu_type),
  gpuCount: toNum(
    firstDefined(
      item.gpu_count,
      item.gpuCount,
      item.num_gpus,
      item.numGpus,
      item.gpu_num,
      item.gpuNum,
    ),
  ),
  benchmarkType: toStr(item.workload_type),
  precision: toStr(item.precision),
  concurrency: toNum(item.concurrency),
  throughput: toNum(item.total_token_throughput),
  ttft: toNum(item.mean_ttft_ms),
  tpot: toNum(item.mean_tpot_ms),
  e2el: toNum(item.mean_e2el_ms),
  memory: null,
  status: toStr(item.status, 'unknown'),
  // `created_at` is when the record was written to the DB, not when the
  // benchmark actually ran — for imported/backfilled runs those can be months
  // apart. `completed_at`/`started_at` reflect the real run time.
  timestamp: toStr(firstDefined(item.completed_at, item.started_at, item.created_at), ''),
})

export const toBenchmarkRows = (raw: unknown): BenchmarkRun[] => {
  // The API returns a top-level array; tolerate a { data: [...] } envelope too.
  const items: Record<string, unknown>[] = Array.isArray(raw)
    ? (raw as Record<string, unknown>[])
    : ((raw as { data?: Record<string, unknown>[] })?.data ?? [])

  return items.map(normalizeBenchmarkRun)
}
