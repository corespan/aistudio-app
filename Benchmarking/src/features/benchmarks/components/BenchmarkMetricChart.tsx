import { useMemo, useState } from 'react'
import {
  Box,
  Center,
  Divider,
  Flex,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Switch,
  Text,
  TextInput,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { CoreChart } from '@/shared/ui'
import type { EChartsOption } from 'echarts'
import type { BenchmarkRun } from '../types'
import { useBenchmarks } from '../data/queries/useBenchmarks'
import { useBenchmarkFiltersStore } from '../store/useBenchmarkFiltersStore'
import { colorForGpuType, normalizeGpuType } from '../lib/gpuColors'

// Y-axis choices. `key` is a field on BenchmarkRun; `kind` decides the Y axis
// type — numeric metrics get a value axis, precision gets a category axis since
// its values are labels (fp16, fp8, …), not numbers.
const METRICS = [
  { key: 'throughput', label: 'Throughput (tokens/s)', kind: 'number' },
  { key: 'ttft', label: 'TTFT (ms)', kind: 'number' },
  { key: 'tpot', label: 'TPOT (ms)', kind: 'number' },
  { key: 'e2el', label: 'E2EL (ms)', kind: 'number' },
  { key: 'precision', label: 'Precision', kind: 'category' },
] as const satisfies ReadonlyArray<{
  key: keyof BenchmarkRun
  label: string
  kind: 'number' | 'category'
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

const fmtNum = (v: number | null, unit = '') =>
  v == null ? '—' : `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit}`

const runTooltipHtml = (run: BenchmarkRun, accentColor: string) => `
  <div style="min-width:190px">
    <div style="font-weight:700;color:${accentColor};margin-bottom:4px">${run.model || '—'}</div>
    <div>GPU: <b>${normalizeGpuType(run.gpuType) ?? '—'}</b></div>
    <div>Precision: <b>${run.precision || '—'}</b></div>
    <div>Concurrency: <b>${run.concurrency ?? '—'}</b></div>
    <div style="margin-top:6px">Throughput: <b>${fmtNum(run.throughput, ' tok/s')}</b></div>
    <div>TTFT: <b>${fmtNum(run.ttft, ' ms')}</b></div>
    <div>TPOT: <b>${fmtNum(run.tpot, ' ms')}</b></div>
    <div>E2EL: <b>${fmtNum(run.e2el, ' ms')}</b></div>
  </div>
`

export const BenchmarkMetricChart = () => {
  const { data } = useBenchmarks()
  const benchmarkType = useBenchmarkFiltersStore((s) => s.benchmarkType)
  const metric = METRIC_BY_TYPE[benchmarkType] ?? 'throughput'
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  // Series-panel state: which GPUs are hidden from the chart, the search
  // filter over the GPU list, and the two display toggles.
  const [hiddenGpus, setHiddenGpus] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [showLabels, setShowLabels] = useState(true)

  const toggleGpu = (gpu: string) =>
    setHiddenGpus((prev) => {
      const next = new Set(prev)
      if (next.has(gpu)) next.delete(gpu)
      else next.add(gpu)
      return next
    })

  const resetFilters = () => {
    setHiddenGpus(new Set())
    setSearch('')
  }

  // Stable GPU → color assignment computed from *all* rows (not just the ones
  // plottable for the current metric), so a given GPU keeps the same color no
  // matter which metric tab is selected. Doubles as the series panel's list.
  const gpuColorEntries = useMemo(() => {
    const rows = data ?? []
    const gpuTypes = [...new Set(rows.map((r) => normalizeGpuType(r.gpuType)).filter((g): g is string => !!g))].sort()
    return gpuTypes.map((gpu) => ({ gpu, color: colorForGpuType(gpu) }))
  }, [data])
  const colorForGpu = (gpu: string) => colorForGpuType(gpu)

  const visiblePanelEntries = gpuColorEntries.filter(({ gpu }) =>
    gpu.toLowerCase().includes(search.trim().toLowerCase()),
  )

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

  // Rebuild the ECharts option whenever the rows, metric, theme, or panel
  // controls change. CoreChart's effect calls setOption on every new `option`,
  // so this is the single source that drives the redraw.
  const option = useMemo<EChartsOption>(() => {
    const rows = data ?? []
    const meta = METRICS.find((m) => m.key === metric)!

    const axisText = isDark ? '#c1c2c5' : '#495057'
    const axisLine = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
    const splitLine = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

    // Neutral chrome — colors now vary per GPU series, so the tooltip/axis
    // pointer border stays theme-neutral rather than tied to one metric color.
    const neutralAccent = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'

    const tooltip = {
      trigger: 'axis' as const,
      backgroundColor: isDark ? 'rgba(26,27,30,0.95)' : 'rgba(255,255,255,0.95)',
      borderColor: neutralAccent,
      borderWidth: 1,
      padding: [8, 12] as [number, number],
      textStyle: { color: axisText, fontSize: 12 },
      axisPointer: {
        type: 'line' as const,
        lineStyle: { color: neutralAccent, width: 1, type: 'dashed' as const },
      },
    }

    // Every run's GPU type (falling back to "Unknown" when unset), minus any
    // toggled off in the side panel. Colors come from `colorForGpu`, so they
    // stay consistent with the panel even if a GPU has no points for this metric.
    const gpuTypesOf = (list: BenchmarkRun[]) =>
      [...new Set(list.map((r) => normalizeGpuType(r.gpuType)).filter((g): g is string => !!g))]
        .filter((gpu) => !hiddenGpus.has(gpu))
        .sort()

    const xAxis = {
      type: 'value' as const,
      name: 'Concurrency',
      nameLocation: 'middle' as const,
      nameGap: 32,
      nameTextStyle: { color: axisText, fontWeight: 600 },
      axisLine: { lineStyle: { color: axisLine } },
      axisLabel: { show: true, color: axisText, formatter: (v: number) => String(Math.round(v)) },
      axisTick: { show: true },
      splitLine: { lineStyle: { color: splitLine, type: 'dashed' as const } },
    }

    const yAxisBase = {
      name: meta.label,
      nameTextStyle: { color: axisText, fontWeight: 600 },
      axisLine: { lineStyle: { color: axisLine } },
      axisLabel: { show: true, color: axisText },
      axisTick: { show: true },
      splitLine: { lineStyle: { color: splitLine, type: 'dashed' as const } },
    }

    // Colored end-of-line label naming the GPU, matching each series' color —
    // an on-chart key instead of relying solely on the side panel.
    const endLabel = (color: string) => ({
      show: showLabels,
      formatter: '{a}',
      color: '#fff',
      fontSize: 10,
      fontWeight: 600,
      backgroundColor: color,
      padding: [2, 6] as [number, number],
      borderRadius: 4,
      distance: 8,
    })

    // Categorical Y (precision): coloured glowing scatter, one series per GPU
    // type so hardware is distinguishable by color — distinct labels on the Y
    // axis, each point mapped to its band. A line across categories is misleading.
    if (meta.kind === 'category') {
      const plottable = rows.filter((r) => r.concurrency != null && r.precision)
      const categories = [...new Set(plottable.map((r) => r.precision).filter(Boolean))]
      const gpuTypes = gpuTypesOf(plottable)

      const series = gpuTypes.map((gpu) => {
        const color = colorForGpu(gpu)
        const points = plottable
          .filter((r) => normalizeGpuType(r.gpuType) === gpu)
          .map((r) => ({ value: [r.concurrency as number, r.precision], run: r }))
          .sort((a, b) => (a.value[0] as number) - (b.value[0] as number))

        return {
          type: 'scatter' as const,
          name: gpu,
          data: points,
          symbolSize: 16,
          itemStyle: {
            color,
            borderColor: isDark ? '#1a1b1e' : '#fff',
            borderWidth: 2,
            shadowBlur: 12,
            shadowColor: rgba(color, 0.6),
          },
          emphasis: { scale: 1.4 },
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const categoryTooltip: any = {
        ...tooltip,
        trigger: 'item' as const,
        formatter: (p: any) => runTooltipHtml(p.data.run, p.color),
      }

      return {
        backgroundColor: 'transparent',
        animationDuration: 700,
        animationEasing: 'cubicOut',
        tooltip: categoryTooltip,
        grid: { left: 88, right: 28, top: 28, bottom: 52 },
        xAxis,
        yAxis: { type: 'category', data: categories, ...yAxisBase },
        series,
      }
    }

    // Numeric Y: one line per GPU type, each its own color, so hardware is
    // visually separable at a glance. Every individual run is plotted (no
    // averaging), sorted by concurrency (ties broken by value) — so two runs
    // at the same concurrency both stay visible and the line still visibly
    // connects to every dot rather than sitting apart from it.
    const plottable = rows.filter((r) => r.concurrency != null && r[metric] != null)
    const gpuTypes = gpuTypesOf(plottable)

    const byConcurrency = new Map<number, number[]>()
    for (const r of plottable) {
      const arr = byConcurrency.get(r.concurrency as number) ?? []
      arr.push(r[metric] as number)
      byConcurrency.set(r.concurrency as number, arr)
    }

    const series = gpuTypes.map((gpu) => {
      const color = colorForGpu(gpu)
      const points = plottable
        .filter((r) => normalizeGpuType(r.gpuType) === gpu)
        .map((r) => ({ value: [r.concurrency as number, r[metric] as number], run: r }))
        .sort(
          (a, b) =>
            (a.value[0] as number) - (b.value[0] as number) ||
            (a.value[1] as number) - (b.value[1] as number),
        )

      return {
        type: 'line' as const,
        name: gpu,
        data: points,
        smooth: true,
        symbol: 'circle',
        symbolSize: 9,
        showSymbol: true,
        endLabel: endLabel(color),
        lineStyle: {
          width: 3.5,
          color,
          shadowBlur: 12,
          shadowColor: rgba(color, 0.5),
          shadowOffsetY: 4,
        },
        itemStyle: {
          color,
          borderColor: isDark ? '#1a1b1e' : '#fff',
          borderWidth: 2,
        },
        // Vertical gradient fill fading to transparent under the line.
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: rgba(color, 0.35) },
              { offset: 1, color: rgba(color, 0.02) },
            ],
          },
        },
        emphasis: { focus: 'series' as const, scale: 1.3 },
      }
    })

    // Item trigger: every point gets its own tooltip on hover (matching its own
    // on-chart label), rather than lumping every run at that concurrency into one
    // axis-wide tooltip. The tooltip lists every field captured for that run, not
    // just the metric currently plotted.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const numericTooltip: any = {
      ...tooltip,
      trigger: 'item' as const,
      formatter: (p: any) => {
        return runTooltipHtml(p.data.run, p.color)
      },
    }

    return {
      backgroundColor: 'transparent',
      animationDuration: 800,
      animationEasing: 'cubicOut',
      tooltip: numericTooltip,
      grid: { left: 64, right: 72, top: 28, bottom: 52 },
      xAxis,
      yAxis: { type: 'value', ...yAxisBase },
      series,
    }
  }, [data, metric, isDark, hiddenGpus, showLabels])

  return (
    <Box h="100%" mih={860} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Metric vs Concurrency</Text>
        <Text size="sm" c="dimmed">
          {METRICS.find((m) => m.key === metric)?.label}
        </Text>
      </Group>

      <Flex gap="md" align="stretch" wrap="nowrap" style={{ flex: '1 1 auto', minHeight: 0 }}>
        <Box style={{ flex: '1 1 auto', minWidth: 0, minHeight: 0 }}>
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

        {gpuColorEntries.length > 0 && (
          <Paper
            withBorder
            radius="lg"
            p="md"
            w={280}
            h="100%"
            style={{ flex: '0 0 280px', minHeight: 0 }}
            mih={860}
          >
            <Stack gap="sm" h="100%" style={{ minHeight: 0 }}>
              <Box>
                <Text fw={600} size="sm">
                  GPU Series
                </Text>
                <Text size="xs" c="dimmed">
                  Toggle hardware lines and search available GPUs.
                </Text>
              </Box>

              <TextInput
                placeholder="Search GPU"
                size="sm"
                leftSection={<IconSearch size={13} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
              />

              <Box
                p={6}
                style={{
                  flex: '1 1 auto',
                  minHeight: 0,
                  borderRadius: 12,
                  border: '1px solid var(--app-shell-border-color)',
                  background: 'var(--core-surface-1)',
                }}
              >
                <ScrollArea h="100%" scrollbarSize={5} type="scroll">
                  <Stack gap={6}>
                    {visiblePanelEntries.map(({ gpu, color }) => {
                      const isHidden = hiddenGpus.has(gpu)
                      return (
                        <UnstyledButton
                          key={gpu}
                          onClick={() => toggleGpu(gpu)}
                          px="sm"
                          py={10}
                          style={{
                            display: 'block',
                            width: '100%',
                            borderRadius: 10,
                            border: '1px solid var(--app-shell-border-color)',
                            background: isHidden ? 'var(--mantine-color-body)' : 'var(--mantine-color-default)',
                            opacity: isHidden ? 0.72 : 1,
                          }}
                        >
                          <Group justify="space-between" gap="sm" wrap="nowrap">
                            <Group gap="sm" wrap="nowrap">
                              <Box
                                w={10}
                                h={10}
                                bg={isHidden ? 'var(--mantine-color-gray-6)' : color}
                                style={{ borderRadius: '50%', flexShrink: 0 }}
                              />
                              <Text
                                size="sm"
                                fw={500}
                                c={isHidden ? 'dimmed' : undefined}
                                td={isHidden ? 'line-through' : undefined}
                                style={{ whiteSpace: 'nowrap' }}
                              >
                                {gpu}
                              </Text>
                            </Group>
                            <Text size="xs" c={isHidden ? 'dimmed' : color}>
                              {isHidden ? 'Hidden' : 'Visible'}
                            </Text>
                          </Group>
                        </UnstyledButton>
                      )
                    })}
                    {visiblePanelEntries.length === 0 && (
                      <Text size="xs" c="dimmed" ta="center" py="md">
                        No GPUs match "{search}"
                      </Text>
                    )}
                  </Stack>
                </ScrollArea>
              </Box>

              <Divider />

              <Stack gap={6}>
                <Switch
                  label="Show labels"
                  size="xs"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.currentTarget.checked)}
                />
              </Stack>

              {(hiddenGpus.size > 0 || search) && (
                <UnstyledButton onClick={resetFilters}>
                  <Text size="xs" c="indigo" fw={500}>
                    Reset filter
                  </Text>
                </UnstyledButton>
              )}
            </Stack>
          </Paper>
        )}
      </Flex>
    </Box>
  )
}
