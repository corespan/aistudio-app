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
