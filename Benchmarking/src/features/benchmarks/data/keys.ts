/** Query key factory for the Configure Benchmark Run option lists. */
export const benchmarkOptionKeys = {
  all: ['benchmark-options'] as const,
  benchmarks: (filters?: Record<string, unknown>) =>
    [...benchmarkOptionKeys.all, 'benchmarks', filters ?? {}] as const,
  nodes: () => [...benchmarkOptionKeys.all, 'nodes'] as const,
  models: () => [...benchmarkOptionKeys.all, 'models'] as const,
  modelConfig: (nodeIp: string, model: string) =>
    [...benchmarkOptionKeys.all, 'model-config', nodeIp, model] as const,
  gpuTypes: () => [...benchmarkOptionKeys.all, 'gpu-types'] as const,
  concurrencies: () => [...benchmarkOptionKeys.all, 'concurrencies'] as const,
  precisions: () => [...benchmarkOptionKeys.all, 'precisions'] as const,
  outputTokens: () => [...benchmarkOptionKeys.all, 'output-tokens'] as const,
  inputTokens: () => [...benchmarkOptionKeys.all, 'input-tokens'] as const,
}
