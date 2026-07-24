import { useEffect } from 'react'
import { useWatch } from 'react-hook-form'
import { useBenchmarkFiltersStore } from '../store/useBenchmarkFiltersStore'
import type { BenchmarkRunConfig } from '../types'

/**
 * Watches the dropdown selections and mirrors them into the filter store using
 * the exact `/api/v1/benchmarks` query-param names. Empty selections are dropped
 * so they aren't sent. Renders nothing — must live inside the CoreForm provider.
 */
export const BenchmarkFilterSync = () => {
  const values = useWatch<BenchmarkRunConfig>()
  const setFilters = useBenchmarkFiltersStore((s) => s.setFilters)
  const setBenchmarkType = useBenchmarkFiltersStore((s) => s.setBenchmarkType)

  useEffect(() => {
    const blank = (v?: string) => (v ? v : undefined)
    setFilters({
      model: blank(values.model),
      node_ip: blank(values.machineIp),
      gpu_type: blank(values.gpuType),
      precision: blank(values.precision),
      input_tokens: blank(values.inputTokens),
      output_tokens: blank(values.outputTokens),
      concurrency: blank(values.concurrency),
    })
  }, [
    values.model,
    values.machineIp,
    values.gpuType,
    values.precision,
    values.inputTokens,
    values.outputTokens,
    values.concurrency,
    setFilters,
  ])

  // Benchmark Type drives the chart's Y axis, not the table filters.
  useEffect(() => {
    if (values.benchmarkType) setBenchmarkType(values.benchmarkType)
  }, [values.benchmarkType, setBenchmarkType])

  return null
}
