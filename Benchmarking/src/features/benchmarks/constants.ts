import { IconCpu, IconGauge, IconServer, IconSettings } from '@tabler/icons-react'
import type {
  MetricKey,
  HealthTone,
  LogStreamStatus,
  LaunchJupyterForm,
  StartBenchmarkFormValues,
} from './types'

// Mock option set for the one dropdown without a backend endpoint yet.
// Model, Machine IP, GPU Type, and Concurrency now come from the API.
// Each value also names the chart's Y-axis metric (see BenchmarkMetricChart).
export const BENCHMARK_TYPE_OPTIONS = ['Throughput', 'TTFT', 'TPOT']

// BenchmarksTable
export const BENCHMARKS_TABLE_STATUS_COLORS: Record<string, string> = {
  success: 'green',
  completed: 'green',
  running: 'blue',
  'in progress': 'blue',
  fail: 'red',
  failed: 'red',
  pending: 'gray',
}

// BenchmarkMetricChart
// Y-axis choices. `key` is a field on BenchmarkRun; `kind` decides the Y axis
// type — numeric metrics get a value axis, precision gets a category axis since
// its values are labels (fp16, fp8, …), not numbers.
export const CHART_METRICS = [
  { key: 'throughput', label: 'Throughput (tokens/s)', kind: 'number' },
  { key: 'ttft', label: 'TTFT (ms)', kind: 'number' },
  { key: 'tpot', label: 'TPOT (ms)', kind: 'number' },
  { key: 'e2el', label: 'E2EL (ms)', kind: 'number' },
  { key: 'precision', label: 'Precision', kind: 'category' },
] as const satisfies ReadonlyArray<{
  key: MetricKey
  label: string
  kind: 'number' | 'category'
}>

// The Benchmark Type dropdown (Configure panel) names which metric the Y axis
// plots. Values mirror BENCHMARK_TYPE_OPTIONS; this maps each to a CHART_METRICS key.
export const CHART_METRIC_BY_TYPE: Record<string, MetricKey> = {
  Throughput: 'throughput',
  TTFT: 'ttft',
  TPOT: 'tpot',
}

// DbHealthIndicator
export const HEALTH_TONE_COLOR: Record<HealthTone, string> = {
  ok: 'teal',
  bad: 'red',
  idle: 'gray',
}

// LogStreamView
export const LOG_STREAM_STATUS_COLOR: Record<LogStreamStatus, string> = {
  idle: 'gray',
  open: 'teal',
  reconnecting: 'yellow',
  error: 'orange',
  closed: 'green',
  failed: 'red',
}

export const LOG_STREAM_STATUS_LABEL: Record<LogStreamStatus, string> = {
  idle: 'Connecting…',
  open: 'Streaming',
  reconnecting: 'Reconnecting…',
  error: 'Disconnected',
  closed: 'Completed',
  failed: 'Failed',
}

// RunProgressDrawer
export const RUN_SWITCHER_STATUS_COLOR: Record<LogStreamStatus, string> = {
  idle: 'gray',
  open: 'teal',
  reconnecting: 'yellow',
  error: 'red',
  closed: 'gray',
  failed: 'red',
}

// LaunchJupyter
export const LAUNCH_JUPYTER_DEFAULTS: LaunchJupyterForm = { nodeIp: '' }

// StartBenchmarkModal
export const START_BENCHMARK_STEPS = [
  {
    title: 'Select Node',
    description: 'Choose the machine where the benchmark will run.',
    icon: IconServer,
  },
  {
    title: 'Configure Model',
    description: 'Select the model to benchmark.',
    icon: IconCpu,
  },
  {
    title: 'Model Configuration',
    description: 'Configuration fetched for the selected model.',
    icon: IconSettings,
  },
  {
    title: 'Review & Confirm',
    description: 'Please review your configuration before starting.',
    icon: IconGauge,
  },
] as const

export const START_BENCHMARK_EMPTY_VALUES: StartBenchmarkFormValues = {
  nodeIp: '',
  model: '',
  config: {},
}

export const START_BENCHMARK_GRADIENT = { from: 'cyan', to: 'indigo', deg: 135 } as const

export const CONFIG_INCOMPLETE_MESSAGE =
  'Configuration is incomplete. Please ensure all fields are present.'
export const CONFIG_UNAVAILABLE_MESSAGE =
  "This model's configuration could not be loaded correctly. Please try again or select a different model."
