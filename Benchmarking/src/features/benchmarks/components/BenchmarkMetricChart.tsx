import { useMemo, useRef, useState } from 'react'
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
import { CoreChart, CoreIcon } from '@/shared/ui'
import type { ECharts, EChartsOption } from 'echarts'
import type { BenchmarkRun } from '../types'
import { useBenchmarks } from '../data/queries/useBenchmarks'
import { useBenchmarkFiltersStore } from '../store/useBenchmarkFiltersStore'
import { colorForGpuType, normalizeGpuType } from '../lib/gpuColors'
import { CHART_METRICS, CHART_METRIC_BY_TYPE } from '../constants'
import { APP_THEME } from '@/app/constants'

// Convert a hex color to rgba so we can build translucent gradient stops.
const rgba = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

// Blend a hex color toward black. The end-label pills fill with a darkened
// shade so white text clears the WCAG AA 4.5:1 floor on every palette color —
// at full brightness the mid-tone limes, ambers, and greens sit as low as
// 2:1 against white. At 40% this palette lands between 5.1:1 and 9.3:1.
const darken = (hex: string, amount: number) => {
  const n = parseInt(hex.slice(1), 16)
  const f = 1 - amount
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * f)
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`
}

const fmtNum = (v: number | null, unit = '') =>
  v == null ? '—' : `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit}`

// Short, readable timestamp — matches the format used in the results table.
const fmtTime = (raw: string) => {
  const ms = Date.parse(raw)
  if (Number.isNaN(ms)) return '—'
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_TOOLTIP_COLOR: Record<string, string> = {
  success: 'var(--mantine-color-teal-6)',
  completed: 'var(--mantine-color-teal-6)',
  running: 'var(--mantine-color-blue-6)',
  'in progress': 'var(--mantine-color-blue-6)',
  fail: 'var(--mantine-color-red-6)',
  failed: 'var(--mantine-color-red-6)',
  pending: 'var(--mantine-color-gray-6)',
}

// One label/value table row. A plain HTML <table> keeps label/value columns
// reliably aligned inside the tooltip's floating DOM, unlike flex in ECharts.
const row = (label: string, value: string) => `
  <tr>
    <td style="padding:1px 10px 1px 0;color:var(--mantine-color-dimmed);white-space:nowrap">${label}</td>
    <td style="padding:1px 0;font-weight:600;text-align:right;white-space:nowrap">${value}</td>
  </tr>
`

const sectionLabel = (text: string) => `
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;
              color:var(--mantine-color-dimmed);margin:8px 0 3px">${text}</div>
`

// Full record for the hovered run, grouped into Configuration / Performance /
// Details sections so every captured field is visible and easy to scan.
const runTooltipHtml = (run: BenchmarkRun, accentColor: string) => {
  const statusColor =
    STATUS_TOOLTIP_COLOR[run.status?.toLowerCase()] ?? 'var(--mantine-color-dimmed)'

  return `
    <div style="min-width:230px;font-size:12px;line-height:1.5">
      <div style="font-weight:700;font-size:13px;color:${accentColor};
                  padding-bottom:6px;border-bottom:1px solid rgba(128,128,128,.25)">
        ${run.model || 'Unknown model'}
      </div>

      ${sectionLabel('Configuration')}
      <table style="width:100%;border-collapse:collapse">
        ${row('GPU', normalizeGpuType(run.gpuType) ?? '—')}
        ${row('GPU Count', run.gpuCount != null ? String(run.gpuCount) : '—')}
        ${row('Precision', run.precision || '—')}
        ${row('Concurrency', run.concurrency != null ? String(run.concurrency) : '—')}
      </table>

      ${sectionLabel('Performance')}
      <table style="width:100%;border-collapse:collapse">
        ${row('Throughput', fmtNum(run.throughput, ' tok/s'))}
        ${row('TTFT', fmtNum(run.ttft, ' ms'))}
        ${row('TPOT', fmtNum(run.tpot, ' ms'))}
        ${row('E2EL', fmtNum(run.e2el, ' ms'))}
      </table>

      ${sectionLabel('Details')}
      <table style="width:100%;border-collapse:collapse">
        ${row('Run ID', run.runId || '—')}
        ${/* row('Node', run.machineIp || '—') */ ''}
        <tr>
          <td style="padding:1px 10px 1px 0;color:var(--mantine-color-dimmed);white-space:nowrap">Status</td>
          <td style="padding:1px 0;font-weight:600;text-align:right;color:${statusColor};white-space:nowrap">
            ${run.status || '—'}
          </td>
        </tr>
        ${row('Time', fmtTime(run.timestamp))}
      </table>
    </div>
  `
}

export const BenchmarkMetricChart = () => {
  const { data } = useBenchmarks()
  const benchmarkType = useBenchmarkFiltersStore((s) => s.benchmarkType)
  const metric = CHART_METRIC_BY_TYPE[benchmarkType] ?? 'throughput'
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  // Series-panel state: which GPUs are hidden from the chart, the search
  // filter over the GPU list, and the two display toggles.
  const [hiddenGpus, setHiddenGpus] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [showLabels, setShowLabels] = useState(true)
  // Escape hatch into the ECharts instance, so "Reset zoom" can dispatchAction
  // without CoreChart needing to expose any zoom-specific API of its own.
  const chartInstanceRef = useRef<ECharts | null>(null)
  const resetZoom = () =>
    chartInstanceRef.current?.dispatchAction({ type: 'dataZoom', start: 0, end: 100 })

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
  // Recomputed on every render (no useMemo) so it always reflects the latest
  // rows straight from the endpoint — nothing is cached between renders.
  const rowsForColors = data ?? []
  const gpuColorEntries = [
    ...new Set(
      rowsForColors.map((r) => normalizeGpuType(r.gpuType)).filter((g): g is string => !!g),
    ),
  ]
    .sort()
    .map((gpu) => ({ gpu, color: colorForGpuType(gpu) }))

  const visiblePanelEntries = gpuColorEntries.filter(({ gpu }) =>
    gpu.toLowerCase().includes(search.trim().toLowerCase()),
  )

  // Whether the *selected* metric has anything plottable. Rows can exist while the
  // chosen metric is null for all of them (e.g. TTFT when the workload didn't
  // report it) — in that case we show an empty state instead of a blank chart.
  const hasData = (() => {
    const rows = data ?? []
    const meta = CHART_METRICS.find((m) => m.key === metric)!
    return meta.kind === 'category'
      ? rows.some((r) => r.concurrency != null && r.precision)
      : rows.some((r) => r.concurrency != null && r[metric] != null)
  })()

  // Memoized so CoreChart's update effect (keyed on this object's identity)
  // only fires when something the chart actually depends on changes — the
  // chart now merges updates (see CoreChart) rather than tearing down and
  // rebuilding, so a stable identity is what lets a user's dataZoom range
  // survive unrelated re-renders (typing in the search box, etc).
  const option = useMemo((): EChartsOption => {
    const rows = data ?? []
    const meta = CHART_METRICS.find((m) => m.key === metric)!

    const axisText = isDark ? '#c1c2c5' : '#495057'
    const axisLine = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
    const splitLine = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

    // Neutral chrome — colors now vary per GPU series, so the tooltip/axis
    // pointer border stays theme-neutral rather than tied to one metric color.
    const neutralAccent = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'

    // X-axis zoom/pan. No `start`/`end` here — omitting them is what lets
    // CoreChart's merge-based update preserve whatever range the user has
    // dragged; hardcoding one would re-assert it on every render and silently
    // undo the zoom. Wheel is off (the chart sits in a page-level ScrollArea
    // and would otherwise hijack scrolling); drag-to-pan is on instead.
    const dataZoom = [
      {
        type: 'inside' as const,
        xAxisIndex: 0,
        filterMode: 'filter' as const,
        zoomOnMouseWheel: false,
        moveOnMouseWheel: false,
        moveOnMouseMove: true,
      },
      {
        type: 'slider' as const,
        xAxisIndex: 0,
        filterMode: 'filter' as const,
        height: 20,
        bottom: 10,
        borderColor: axisLine,
        fillerColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        dataBackground: {
          lineStyle: { color: axisLine },
          areaStyle: { color: axisLine },
        },
        selectedDataBackground: {
          lineStyle: { color: neutralAccent },
          areaStyle: { color: neutralAccent },
        },
        handleStyle: { color: neutralAccent, borderColor: neutralAccent },
        textStyle: { color: axisText },
        moveHandleStyle: { color: axisLine },
        emphasis: { handleStyle: { color: neutralAccent } },
      },
    ]

    const tooltip = {
      trigger: 'axis' as const,
      // Render into <body> instead of the chart's own container: the chart sits
      // inside a Card (Mantine clips Card content to its rounded corners via
      // `overflow: hidden`), which was cutting the tooltip off / letting sibling
      // panels sit on top of it whenever a point was hovered near an edge.
      appendToBody: true,
      confine: false,
      z: 10000,
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
    // toggled off in the side panel. Colors come from `colorForGpuType`, so
    // they stay consistent with the panel even if a GPU has no points for
    // this metric.
    const gpuTypesOf = (list: BenchmarkRun[]) =>
      [...new Set(list.map((r) => normalizeGpuType(r.gpuType)).filter((g): g is string => !!g))]
        .filter((gpu) => !hiddenGpus.has(gpu))
        .sort()

    const xAxis = {
      type: 'value' as const,
      name: 'Concurrency',
      nameLocation: 'middle' as const,
      nameGap: 32,
      nameTextStyle: { color: axisText, fontWeight: 500 },
      axisLine: { lineStyle: { color: axisLine } },
      axisLabel: {
        show: true,
        color: axisText,
        fontWeight: 500,
        formatter: (v: number) => String(Math.round(v)),
      },
      axisTick: { show: true },
      splitLine: { lineStyle: { color: splitLine, type: 'dashed' as const } },
    }

    const yAxisBase = {
      name: meta.label,
      // ECharts' default (15) sits the name's text box right on top of the
      // highest tick label, so the two collide. `grid.top` below is sized to
      // clear this gap — raise them together.
      nameGap: 28,
      nameTextStyle: { color: axisText, fontWeight: 500 },
      axisLine: { lineStyle: { color: axisLine } },
      axisLabel: { show: true, color: axisText, fontWeight: 500 },
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
      // Canvas-rendered text has no CSS line-height to inherit — ECharts'
      // own default line height is taller than the glyph box, which pushes
      // the label toward the top of its padded pill. lineHeight is number-only
      // (no CSS 'normal' keyword support), so this is set explicitly.
      lineHeight: 16,
      fontWeight: 500,
      backgroundColor: darken(color, 0.4),
      // Keep the pill outlined in the series' own full-brightness color: it
      // ties the label back to its line and lifts the darkened fill off the
      // dark-mode surface, which it would otherwise sit very close to.
      borderColor: color,
      borderWidth: 1,
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
        const color = colorForGpuType(gpu)
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
        // Canvas text can't inherit the page's font, so the chart is given the
        // app's own stack explicitly — otherwise ECharts falls back to its
        // default sans-serif and the chart reads as a different typeface.
        textStyle: { fontFamily: APP_THEME.fontFamily },
        animationDuration: 700,
        animationEasing: 'cubicOut',
        tooltip: categoryTooltip,
        // bottom raised from 52 to clear the dataZoom slider (height 20,
        // bottom 10) sitting below the axis name.
        grid: { left: 88, right: 28, top: 52, bottom: 96 },
        xAxis,
        yAxis: { type: 'category', data: categories, ...yAxisBase },
        series,
        dataZoom,
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
      const color = colorForGpuType(gpu)
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
          width: 2,
          color,
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
      textStyle: { fontFamily: APP_THEME.fontFamily },
      animationDuration: 800,
      animationEasing: 'cubicOut',
      tooltip: numericTooltip,
      // bottom raised from 52 to clear the dataZoom slider (height 20,
      // bottom 10) sitting below the axis name.
      grid: { left: 64, right: 72, top: 52, bottom: 96 },
      xAxis,
      yAxis: { type: 'value', ...yAxisBase },
      series,
      dataZoom,
    }
  }, [data, metric, isDark, hiddenGpus, showLabels])

  return (
    <Box h="100%" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Flex gap="md" align="stretch" wrap="nowrap" style={{ flex: '1 1 auto', minHeight: 0 }}>
        <Box style={{ flex: '1 1 auto', minWidth: 0, minHeight: 0 }}>
          {!hasData ? (
            <Center h="100%">
              <Text c="dimmed" size="sm">
                {(data ?? []).length === 0
                  ? 'No Benchmark Runs Found'
                  : `No ${CHART_METRICS.find((m) => m.key === metric)?.label ?? 'benchmark'} data to display`}
              </Text>
            </Center>
          ) : (
            <CoreChart option={option} instanceRef={chartInstanceRef} />
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
                leftSection={<CoreIcon icon={<IconSearch />} size={13} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
              />

              <Divider />

              <Box style={{ flex: '1 1 auto', minHeight: 0 }}>
                <ScrollArea h="100%" scrollbarSize={5} type="scroll" offsetScrollbars>
                  <Stack gap={6} py={2}>
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
                            background: isHidden
                              ? 'var(--mantine-color-body)'
                              : 'var(--mantine-color-default)',
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
                                {gpu.toUpperCase()}
                              </Text>
                            </Group>
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

              <Stack gap={6} pt={2}>
                <Switch
                  label="Show labels"
                  size="xs"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.currentTarget.checked)}
                />
              </Stack>

              <Group gap="md">
                {/* Unconditional — dispatching a full-range dataZoom while
                    already at full range is a harmless no-op, and tracking
                    "is currently zoomed" would mean mirroring the chart's
                    live drag state into React just to gate this button. */}
                <UnstyledButton onClick={resetZoom}>
                  <Text size="xs" c="indigo" fw={500}>
                    Reset zoom
                  </Text>
                </UnstyledButton>

                {(hiddenGpus.size > 0 || search) && (
                  <UnstyledButton onClick={resetFilters}>
                    <Text size="xs" c="indigo" fw={500}>
                      Reset filter
                    </Text>
                  </UnstyledButton>
                )}
              </Group>
            </Stack>
          </Paper>
        )}
      </Flex>
    </Box>
  )
}
