import { useMemo } from 'react'
import { Box, Center, Group, Text, useMantineColorScheme } from '@mantine/core'
import { CoreChart } from '@/shared/ui'
import type { EChartsOption } from 'echarts'
import type { BenchmarkRun } from '../types'
import { useBenchmarks } from '../data/queries/useBenchmarks'
import { useBenchmarkFiltersStore } from '../store/useBenchmarkFiltersStore'

// Y-axis choices. `key` is a field on BenchmarkRun; `kind` decides the Y axis
// type — numeric metrics get a value axis, precision gets a category axis since
// its values are labels (fp16, fp8, …), not numbers. `color` drives the line,
// gradient fill, and glow so each metric has its own identity.
const METRICS = [
  { key: 'throughput', label: 'Throughput (tokens/s)', kind: 'number', color: '#4f8cff' },
  { key: 'ttft', label: 'TTFT (ms)', kind: 'number', color: '#22c55e' },
  { key: 'tpot', label: 'TPOT (ms)', kind: 'number', color: '#f59e0b' },
  { key: 'e2el', label: 'E2EL (ms)', kind: 'number', color: '#a855f7' },
  { key: 'precision', label: 'Precision', kind: 'category', color: '#ec4899' },
] as const satisfies ReadonlyArray<{
  key: keyof BenchmarkRun
  label: string
  kind: 'number' | 'category'
  color: string
}>

type MetricKey = (typeof METRICS)[number]['key']

// The Benchmark Type dropdown (Configure panel) names which metric the Y axis
// plots. Values mirror BENCHMARK_TYPE_OPTIONS; this maps each to a METRICS key.
const METRIC_BY_TYPE: Record<string, MetricKey> = {
  Throughput: 'throughput',
  TTFT: 'ttft',
  TPOT: 'tpot',
}

// Convert a hex color to rgba so we can build translucent gradient stops.
const rgba = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export const BenchmarkMetricChart = () => {
  const { data } = useBenchmarks()
  const benchmarkType = useBenchmarkFiltersStore((s) => s.benchmarkType)
  const metric = METRIC_BY_TYPE[benchmarkType] ?? 'throughput'
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  // Whether the *selected* metric has anything plottable. Rows can exist while the
  // chosen metric is null for all of them (e.g. TTFT when the workload didn't
  // report it) — in that case we show an empty state instead of a blank chart.
  const hasData = useMemo(() => {
    const rows = data ?? []
    const meta = METRICS.find((m) => m.key === metric)!
    return meta.kind === 'category'
      ? rows.some((r) => r.concurrency != null && r.precision)
      : rows.some((r) => r.concurrency != null && r[metric] != null)
  }, [data, metric])

  // Rebuild the ECharts option whenever the rows, metric, or theme change.
  // CoreChart's effect calls setOption on every new `option`, so this is the
  // single source that drives the redraw — no imperative chart calls needed.
  const option = useMemo<EChartsOption>(() => {
    const rows = data ?? []
    const meta = METRICS.find((m) => m.key === metric)!

    const axisText = isDark ? '#c1c2c5' : '#495057'
    const axisLine = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
    const splitLine = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

    const tooltip = {
      trigger: 'axis' as const,
      backgroundColor: isDark ? 'rgba(26,27,30,0.95)' : 'rgba(255,255,255,0.95)',
      borderColor: rgba(meta.color, 0.5),
      borderWidth: 1,
      padding: [8, 12] as [number, number],
      textStyle: { color: axisText, fontSize: 12 },
      axisPointer: {
        type: 'line' as const,
        lineStyle: { color: rgba(meta.color, 0.5), width: 1, type: 'dashed' as const },
      },
    }

    const xAxis = {
      type: 'value' as const,
      name: 'Concurrency',
      nameLocation: 'middle' as const,
      nameGap: 32,
      nameTextStyle: { color: axisText, fontWeight: 600 },
      axisLine: { lineStyle: { color: axisLine } },
      axisLabel: { color: axisText },
      splitLine: { lineStyle: { color: splitLine, type: 'dashed' as const } },
    }

    const yAxisBase = {
      name: meta.label,
      nameTextStyle: { color: axisText, fontWeight: 600 },
      axisLine: { lineStyle: { color: axisLine } },
      axisLabel: { color: axisText },
      splitLine: { lineStyle: { color: splitLine, type: 'dashed' as const } },
    }

    // Categorical Y (precision): coloured glowing scatter — distinct labels on the
    // Y axis, each point mapped to its band. A line across categories is misleading.
    if (meta.kind === 'category') {
      const categories = [...new Set(rows.map((r) => r.precision).filter(Boolean))]
      const points = rows
        .filter((r) => r.concurrency != null && r.precision)
        .map((r) => [r.concurrency as number, r.precision])
        .sort((a, b) => (a[0] as number) - (b[0] as number))

      return {
        backgroundColor: 'transparent',
        animationDuration: 700,
        animationEasing: 'cubicOut',
        tooltip,
        grid: { left: 88, right: 28, top: 28, bottom: 52 },
        xAxis,
        yAxis: { type: 'category', data: categories, ...yAxisBase },
        series: [
          {
            type: 'scatter',
            name: meta.label,
            data: points,
            symbolSize: 16,
            itemStyle: {
              color: meta.color,
              borderColor: isDark ? '#1a1b1e' : '#fff',
              borderWidth: 2,
              shadowBlur: 12,
              shadowColor: rgba(meta.color, 0.6),
            },
            emphasis: { scale: 1.4 },
          },
        ],
      }
    }

    // Numeric Y: aggregate by concurrency so each concurrency level is a single
    // point (the mean of all runs at that level). Without this, multiple runs at
    // the same concurrency — or a lone run at one level like 16 — make the line
    // zigzag or spike instead of reading as a clean left-to-right curve.
    // Collect every run's value at each concurrency. The point sits at the mean
    // (so the trend line stays clean), but we keep the individual values so we can
    // label and list them — otherwise runs with near-identical values overlap into
    // one indistinguishable dot.
    const byConcurrency = new Map<number, number[]>()
    for (const r of rows) {
      const value = r[metric]
      if (r.concurrency == null || value == null) continue
      const arr = byConcurrency.get(r.concurrency) ?? []
      arr.push(value as number)
      byConcurrency.set(r.concurrency, arr)
    }
    const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })
    const points = [...byConcurrency.entries()]
      .map(([concurrency, vals]) => ({
        value: [concurrency, vals.reduce((a, b) => a + b, 0) / vals.length],
        runs: vals,
      }))
      .sort((a, b) => (a.value[0] as number) - (b.value[0] as number))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const numericTooltip: any = {
      ...tooltip,
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        const x = (p.value as [number, number])[0]
        const runs: number[] = p.data?.runs ?? []
        const list =
          runs.length > 1
            ? runs.map((v) => `<br/>&nbsp;&nbsp;• <b>${fmt(v)}</b>`).join('')
            : `: <b>${fmt(runs[0] ?? 0)}</b>`
        const header =
          runs.length > 1
            ? `${meta.label} — Concurrency ${x} (${runs.length} runs)`
            : `${meta.label}<br/>Concurrency ${x}`
        return `${header}${list}`
      },
    }

    return {
      backgroundColor: 'transparent',
      animationDuration: 800,
      animationEasing: 'cubicOut',
      tooltip: numericTooltip,
      grid: { left: 64, right: 28, top: 28, bottom: 52 },
      xAxis,
      yAxis: { type: 'value', ...yAxisBase },
      series: [
        {
          type: 'line',
          name: meta.label,
          data: points,
          smooth: true,
          symbol: 'circle',
          // Enlarge points that aggregate more than one run so overlaps stand out;
          // the individual values are shown in the tooltip on hover.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          symbolSize: (_value: any, params: any) => ((params.data?.runs?.length ?? 1) > 1 ? 14 : 9),
          showSymbol: true,
          lineStyle: {
            width: 3.5,
            color: meta.color,
            shadowBlur: 12,
            shadowColor: rgba(meta.color, 0.5),
            shadowOffsetY: 4,
          },
          itemStyle: {
            color: meta.color,
            borderColor: isDark ? '#1a1b1e' : '#fff',
            borderWidth: 2,
          },
          // Vertical gradient fill fading to transparent under the line.
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: rgba(meta.color, 0.35) },
                { offset: 1, color: rgba(meta.color, 0.02) },
              ],
            },
          },
          emphasis: { focus: 'series', scale: 1.3 },
        },
      ],
    }
  }, [data, metric, isDark])

  return (
    <Box>
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Metric vs Concurrency</Text>
        <Text size="sm" c="dimmed">
          {METRICS.find((m) => m.key === metric)?.label}
        </Text>
      </Group>
      {/* CoreChart fills its parent (width/height 100%), so the height lives here. */}
      <Box h={340}>
        {!hasData ? (
          <Center h="100%">
            <Text c="dimmed" size="sm">
              {(data ?? []).length === 0
                ? 'No Benchmark Runs Found'
                : `No ${METRICS.find((m) => m.key === metric)?.label ?? 'benchmark'} data to display`}
            </Text>
          </Center>
        ) : (
          <CoreChart option={option} />
        )}
      </Box>
    </Box>
  )
}
