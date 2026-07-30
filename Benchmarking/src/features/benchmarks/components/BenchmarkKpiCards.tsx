import {
  Badge,
  Card,
  Flex,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core'
import {
  IconActivityHeartbeat,
  IconBolt,
  IconClockBolt,
  IconGauge,
  IconUsersGroup,
} from '@tabler/icons-react'
import { CoreIcon } from '@/shared/ui'
import { useBenchmarks } from '../data/queries/useBenchmarks'
import type { BenchmarkRun, BenchmarkKpi } from '../types'

const nums = (rows: BenchmarkRun[], sel: (r: BenchmarkRun) => number | null): number[] =>
  rows.map(sel).filter((n): n is number => n != null && Number.isFinite(n))

const avg = (arr: number[]): number | null =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

const fmt = (n: number | null, digits = 1): string =>
  n == null
    ? '—'
    : new Intl.NumberFormat(undefined, { maximumFractionDigits: n >= 100 ? 0 : digits }).format(n)

// The row whose value for `sel` is nearest an average/aggregate — used so an
// "Avg" card can still point at one concrete run in its hover tooltip.
const closestTo = (
  rows: BenchmarkRun[],
  sel: (r: BenchmarkRun) => number | null,
  target: number | null,
): BenchmarkRun | undefined => {
  if (target == null) return undefined
  return rows
    .filter((r) => sel(r) != null)
    .sort((a, b) => Math.abs((sel(a) ?? 0) - target) - Math.abs((sel(b) ?? 0) - target))[0]
}

// Same neutral chrome as the results chart's hover tooltip (BenchmarkMetricChart's
// `tooltip`/`runTooltipHtml`) — background/border adapt to the color scheme, body
// text uses the same muted foreground, and labels use Mantine's `dimmed` color.
const tooltipChrome = (isDark: boolean) => ({
  bg: isDark ? 'rgba(26,27,30,0.95)' : 'rgba(255,255,255,0.95)',
  border: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
  text: isDark ? '#c1c2c5' : '#495057',
})

// Every metric for the single run behind a card's number, shown on hover so
// the other three metrics for that run are one glance away.
const RunTooltip = ({
  run,
  accentColor,
  textColor,
}: {
  run: BenchmarkRun
  accentColor: string
  textColor: string
}) => (
  <div style={{ fontSize: 12, lineHeight: 1.5, color: textColor }}>
    <div
      style={{
        fontWeight: 700,
        fontSize: 13,
        color: accentColor,
        paddingBottom: 6,
        marginBottom: 4,
        borderBottom: '1px solid rgba(128,128,128,.25)',
      }}
    >
      {run.model || 'Unknown model'}
    </div>
    {(
      [
        ['Throughput', fmt(run.throughput), 'tok/s'],
        ['TTFT', fmt(run.ttft, 2), 'ms'],
        ['TPOT', fmt(run.tpot), 'ms'],
        ['Latency (E2EL)', fmt(run.e2el, 2), 'ms'],
        ['Concurrency', fmt(run.concurrency, 0), ''],
        ['GPU', run.gpuType || '—', ''],
        ['GPU Count', fmt(run.gpuCount, 0), ''],
        ['Precision', run.precision || '—', ''],
        ['Chasis', run.serverName || '—', ''],
        ['Run ID', run.runId || '—', ''],
        // ['Node', run.machineIp || '—', ''],
      ] as const
    ).map(([label, value, unit]) => (
      <div
        key={label}
        style={{ display: 'flex', justifyContent: 'space-between', gap: 16, whiteSpace: 'nowrap' }}
      >
        <span style={{ color: 'var(--mantine-color-dimmed)' }}>{label}</span>
        <span style={{ fontWeight: 600 }}>
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
    ))}
  </div>
)

/**
 * Summary stat cards derived from the (filtered) benchmark result set: best and
 * average throughput, average TTFT, lowest end-to-end latency, and average TPOT.
 * Styled entirely with Mantine components/props — no CSS module or inline styles.
 */
export const BenchmarkKpiCards = () => {
  const { data, isLoading } = useBenchmarks()
  const { colorScheme } = useMantineColorScheme()
  const chrome = tooltipChrome(colorScheme === 'dark')
  const rows = data ?? []

  const throughputs = nums(rows, (r) => r.throughput)
  const ttfts = nums(rows, (r) => r.ttft)
  const e2els = nums(rows, (r) => r.e2el)
  const tpots = nums(rows, (r) => r.tpot)
  const concurrencies = nums(rows, (r) => r.concurrency)

  const bestThroughput = throughputs.length ? Math.max(...throughputs) : null
  const bestRow = rows
    .filter((r) => r.throughput != null)
    .sort((a, b) => (b.throughput ?? 0) - (a.throughput ?? 0))[0]
  const lowestLatency = e2els.length ? Math.min(...e2els) : null
  const lowestLatencyRow = rows
    .filter((r) => r.e2el != null)
    .sort((a, b) => (a.e2el ?? 0) - (b.e2el ?? 0))[0]
  const peakConcurrency = concurrencies.length ? Math.max(...concurrencies) : null
  const peakConcurrencyRow = rows
    .filter((r) => r.concurrency != null)
    .sort((a, b) => (b.concurrency ?? 0) - (a.concurrency ?? 0))[0]
  const avgTtftRow = closestTo(rows, (r) => r.ttft, avg(ttfts))
  const avgTpotRow = closestTo(rows, (r) => r.tpot, avg(tpots))

  const kpis: BenchmarkKpi[] = [
    {
      key: 'throughput',
      label: 'Best Throughput',
      value: fmt(bestThroughput),
      unit: 'tok/s',
      caption: bestRow?.model ?? 'across all runs',
      hint: '↑ higher is better',
      color: 'teal',
      Icon: IconBolt,
      sourceRow: bestRow,
    },
    {
      key: 'concurrency',
      label: 'Peak Concurrency',
      value: fmt(peakConcurrency, 0),
      caption: 'max concurrent requests',
      color: 'indigo',
      Icon: IconUsersGroup,
      sourceRow: peakConcurrencyRow,
    },
    {
      key: 'ttft',
      label: 'Avg TTFT',
      value: fmt(avg(ttfts)),
      unit: 'ms',
      caption: `across ${ttfts.length} run${ttfts.length === 1 ? '' : 's'}`,
      hint: '↓ lower is better',
      color: 'blue',
      Icon: IconClockBolt,
      sourceRow: avgTtftRow,
    },
    {
      key: 'latency',
      label: 'Lowest Latency',
      value: fmt(lowestLatency),
      unit: 'ms',
      caption: 'end-to-end (E2EL)',
      hint: '↓ lower is better',
      color: 'grape',
      Icon: IconActivityHeartbeat,
      sourceRow: lowestLatencyRow,
    },
    {
      key: 'tpot',
      label: 'Avg TPOT',
      value: fmt(avg(tpots)),
      unit: 'ms',
      caption: 'per output token',
      hint: '↓ lower is better',
      color: 'cyan',
      Icon: IconGauge,
      sourceRow: avgTpotRow,
    },
  ]

  return (
    <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, lg: 5 }} spacing="md">
      {kpis.map((kpi) => {
        const card = (
          <Card key={kpi.key} withBorder radius="md" padding="lg" shadow="sm" h={155}>
            <Flex justify="space-between" align="stretch" gap="sm" wrap="nowrap" h="100%">
              {/* Left half: value, eyebrow, caption — kept close together
                  and vertically centered. */}
              <Stack gap={14} justify="center" style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6} align="baseline" wrap="nowrap">
                  {isLoading ? (
                    <Skeleton height={30} width={80} radius="sm" />
                  ) : (
                    <>
                      <Text fz={38} fw={800} lh={1}>
                        {kpi.value}
                      </Text>
                      {kpi.unit && kpi.value !== '—' && (
                        <Text component="span" fw={700} size="sm">
                          {kpi.unit}
                        </Text>
                      )}
                    </>
                  )}
                </Group>

                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  {kpi.label}
                </Text>

                {kpi.caption && (
                  <Text size="xs" c="dimmed" truncate>
                    {kpi.caption}
                  </Text>
                )}
              </Stack>

              {/* Right half: icon pinned top-right, badge pinned bottom-right —
                  `justify="space-between"` on a single-icon column with no
                  badge still lands the icon at the top, so this holds up for
                  the one KPI (Peak Concurrency) that has no hint. */}
              <Stack gap="sm" justify="space-between" align="flex-end">
                {/* Bare accent glyph — no container. Routed through CoreIcon
                    so the stroke is pinned to 1.5, matching every other icon. */}
                <CoreIcon
                  icon={<kpi.Icon />}
                  size={26}
                  color={`var(--mantine-color-${kpi.color}-6)`}
                />
                {kpi.hint && (
                  <Badge variant="light" color={kpi.color} size="xs" radius="sm">
                    {kpi.hint}
                  </Badge>
                )}
              </Stack>
            </Flex>
          </Card>
        )

        if (!kpi.sourceRow) return card

        return (
          <Tooltip
            key={kpi.key}
            label={
              <RunTooltip
                run={kpi.sourceRow}
                accentColor={`var(--mantine-color-${kpi.color}-6)`}
                textColor={chrome.text}
              />
            }
            position="bottom"
            withArrow
            color={chrome.bg}
            events={{ hover: true, focus: true, touch: true }}
            styles={{ tooltip: { border: `1px solid ${chrome.border}`, padding: '8px 12px' } }}
          >
            {card}
          </Tooltip>
        )
      })}
    </SimpleGrid>
  )
}
