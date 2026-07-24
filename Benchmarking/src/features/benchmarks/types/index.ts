import type { ComponentType } from 'react'
import type { ComboboxData } from '@mantine/core'
import type { IconProps } from '@tabler/icons-react'

// Raw API response shapes for the Configure Benchmark Run option endpoints.
// NOTE: these mirror an assumed backend contract ({ id, name } objects;
// concurrencies as numbers). Adjust once the real contract is confirmed.

export type BenchmarkModel = {
  id: string
  name: string
}

export type GpuType = {
  id: string
  name: string
}

export type Concurrency = number

/** A single benchmark run row, normalized from /api/v1/benchmarks. */
export type BenchmarkRun = {
  runId: string
  model: string
  machineIp: string
  gpuType: string
  gpuCount: number | null
  benchmarkType: string
  precision: string
  concurrency: number | null
  throughput: number | null
  ttft: number | null
  tpot: number | null
  e2el: number | null
  memory: number | null
  status: string
  timestamp: string
}

// configureBenchmarkRun.schema — kept in sync with configureBenchmarkRunSchema
// via `satisfies z.ZodType<BenchmarkRunConfig>` in that file.
export type BenchmarkRunConfig = {
  model: string
  machineIp: string
  gpuType: string
  benchmarkType: string
  concurrency: string
  precision: string
  inputTokens: string
  outputTokens: string
}

// startBenchmark.schema — kept in sync with startBenchmarkSchema via
// `satisfies z.ZodType<StartBenchmarkFormValues>` in that file.
export type StartBenchmarkFormValues = {
  nodeIp: string
  model: string
  config: Record<string, string>
}

// data/services
export type StartBenchmarkPayload = {
  model_name: string
  node_ips: string[]
  config: unknown
}

export type HealthStatus = {
  /** Overall service status, e.g. "healthy". */
  status: string
  /** Database connectivity, e.g. "ok". */
  database: string
}

export type LaunchJupyterPayload = {
  node_ip: string
}

// hooks/useBenchmarkLogStream
export type LogStreamStatus = 'idle' | 'open' | 'reconnecting' | 'error' | 'closed' | 'failed'

// store/useRunStreamsStore
/**
 * A single benchmark run's live log stream. This is the shared, component-independent
 * state for one run — buffered lines, connection status, and the id of the last
 * delivered SSE event (used to resume after a reconnect).
 */
export type RunStream = {
  taskId: string
  model: string | null
  nodeIp: string | null
  /** ISO timestamp captured when streaming started — orders runs in the switcher. */
  startedAt: string
  lines: string[]
  status: LogStreamStatus
  lastEventId: string | null
}

export type StartRunInput = { taskId: string; model?: string | null; nodeIp?: string | null }

export type RunStreamsStore = {
  /** All runs being (or that have been) streamed this session, keyed by task id. */
  streams: Record<string, RunStream>
  /** Whether the progress drawer is open. */
  drawerOpen: boolean
  /** The run currently selected in the drawer, or null when none is chosen. */
  openRunId: string | null
  /** Begin streaming a run's logs. Idempotent — never restarts an active stream. */
  startRun: (input: StartRunInput) => void
  /** Ensure a run is streaming, then open the drawer focused on it. */
  viewRun: (input: StartRunInput) => void
  /** Open the drawer, defaulting the selection to the most recent run. */
  openPanel: () => void
  /** Switch the drawer to an already-streaming run without touching any stream. */
  openDrawer: (taskId: string) => void
  closeDrawer: () => void
  /** Tear down a run's stream and drop it from the store. */
  closeRun: (taskId: string) => void
}

// store/useJupyterRunStore
/**
 * The single active Jupyter launch and its live log stream. Kept in a store (not
 * component state) so the run survives navigating away from the Launch Jupyter
 * panel and back — mirroring how benchmark runs persist in `useRunStreamsStore`.
 */
export type JupyterRun = {
  taskId: string
  nodeIp: string | null
  /** Notebook URL parsed out of the log stream once the server reports ready. */
  url: string | null
  /** True once the user has opened the notebook via the button. Persisted here so
   *  the button stays disabled after navigating away and back. */
  opened: boolean
  lines: string[]
  status: LogStreamStatus
}

export type JupyterRunStore = {
  run: JupyterRun | null
  /** Begin streaming a launch's logs. Idempotent for the same task id. */
  startRun: (input: { taskId: string; nodeIp?: string | null }) => void
  /** Mark that the notebook tab has been opened (disables the Open button). */
  markOpened: () => void
  /** Tear down the stream and clear the run. */
  reset: () => void
}

// store/useBenchmarkFiltersStore
/**
 * Active table filters, keyed by the exact `/api/v1/benchmarks` query-param names
 * the backend honors. Undefined/empty values are omitted from the request.
 */
export type BenchmarkFilters = {
  model?: string
  node_ip?: string
  gpu_type?: string
  precision?: string
  input_tokens?: string
  output_tokens?: string
  concurrency?: string
}

export type BenchmarkFiltersStore = {
  filters: BenchmarkFilters
  setFilters: (filters: BenchmarkFilters) => void
  /** Selected Benchmark Type — names the chart's Y-axis metric. */
  benchmarkType: string
  setBenchmarkType: (benchmarkType: string) => void
}

// store/useStartBenchmarkModalStore
export type StartBenchmarkModalStore = {
  /** Whether the Start Benchmark wizard modal is open. */
  isOpen: boolean
  open: () => void
  close: () => void
}

// components/BenchmarksHeader
export type BenchmarksHeaderProps = {
  /** Whether the runs list is currently refetching. */
  isRefreshing?: boolean
  onRefresh?: () => void
  /** Whether the start-benchmark mutation is in flight. */
  isStarting?: boolean
  onStartBenchmark?: () => void
}

// components/StartBenchmarkModal
export type StartBenchmarkModalProps = {
  opened: boolean
  onClose: () => void
}

export type ReviewRowProps = {
  label: string
  value: string
}

// components/BenchmarkLogStream
export type BenchmarkLogStreamProps = {
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

// components/BenchmarkMetricChart
export type MetricKey = 'throughput' | 'ttft' | 'tpot' | 'e2el' | 'precision'

// components/RunProgressDrawer
export type RunSwitcherItemProps = {
  run: RunStream
  active: boolean
  onSelect: (taskId: string) => void
}

// components/DbHealthIndicator
export type HealthTone = 'ok' | 'bad' | 'idle'

// components/ModelConfigFields
export type ModelConfigFieldsProps = {
  /** Raw /models/config response — keys become editable fields. */
  config: unknown
}

// components/BenchmarkKpiCards
export type BenchmarkKpi = {
  key: string
  label: string
  value: string
  unit?: string
  caption?: string
  hint?: string
  /** Mantine palette color name driving the icon gradient, badge, and unit. */
  color: string
  Icon: ComponentType<IconProps>
}

// components/LogStreamView
export type LogStreamViewProps = {
  /** Task id shown in the log header. */
  taskId: string
  lines: string[]
  status: LogStreamStatus
}

// components/BenchmarksTable
export type RunActionProps = {
  run: BenchmarkRun
}

// components/GpuTypeSelect
export type GpuTypeSelectProps = {
  data: ComboboxData
  disabled: boolean
}

// components/LaunchJupyter
export type LaunchJupyterForm = {
  nodeIp: string
}

// components/ResultsPanel
export type ResultsView = 'chart' | 'table'
