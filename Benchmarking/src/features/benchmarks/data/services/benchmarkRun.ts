import { AiClient } from '@/shared/api/baseClient'
import type { StartBenchmarkPayload } from '../../types'

export const startBenchmark = (payload: StartBenchmarkPayload) =>
  AiClient.post<unknown>('benchmarks/start', payload)

export const deleteBenchmark = (runId: string) =>
  AiClient.delete<unknown>(`benchmarks/${encodeURIComponent(runId)}`)
