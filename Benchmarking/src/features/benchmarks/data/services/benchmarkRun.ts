import { AiClient } from '@/shared/api/baseClient'

export type StartBenchmarkPayload = {
  model_name: string
  node_ips: string[]
  config: unknown
}

// POST /api/v1/benchmarks/start (proxied to VITE_API_URL).
export const startBenchmark = (payload: StartBenchmarkPayload) =>
  AiClient.post<unknown>('benchmarks/start', payload)

// DELETE /api/v1/benchmarks/:runId — removes a single benchmark run.
export const deleteBenchmark = (runId: string) =>
  AiClient.delete<unknown>(`benchmarks/${encodeURIComponent(runId)}`)
