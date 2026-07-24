import { z } from 'zod'
import { BENCHMARK_TYPE_OPTIONS } from './constants'
import type { BenchmarkRunConfig } from './types'

/**
 * Single source of truth for the Configure Benchmark Run filter panel. Every
 * option list except Benchmark Type is populated from the backend and starts
 * blank until the user makes a selection.
 */
export const configureBenchmarkRunSchema = z.object({
  model: z.string().min(1, 'Select a model'),
  machineIp: z.string().min(1, 'Select a machine'),
  gpuType: z.string().min(1, 'Select a GPU type'),
  benchmarkType: z.string().min(1, 'Select a benchmark type'),
  concurrency: z.string().min(1, 'Select concurrency'),
  precision: z.string().min(1, 'Select a precision'),
  inputTokens: z.string().min(1, 'Select input tokens'),
  outputTokens: z.string().min(1, 'Select output tokens'),
}) satisfies z.ZodType<BenchmarkRunConfig>

// Every option list except Benchmark Type comes from the backend, so they start
// empty and are chosen by the user once loaded. Benchmark Type is still mock.
export const CONFIGURE_BENCHMARK_RUN_DEFAULTS: BenchmarkRunConfig = {
  model: '',
  machineIp: '',
  gpuType: '',
  benchmarkType: BENCHMARK_TYPE_OPTIONS[0],
  concurrency: '',
  precision: '',
  inputTokens: '',
  outputTokens: '',
}
