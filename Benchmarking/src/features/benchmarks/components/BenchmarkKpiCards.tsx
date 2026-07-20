import type { ComponentType } from 'react'
import { Badge, Card, Group, SimpleGrid, Skeleton, Stack, Text, ThemeIcon } from '@mantine/core'
import {
  IconActivityHeartbeat,
  IconBolt,
  IconClockBolt,
  IconGauge,
  IconUsersGroup,
  type IconProps,
} from '@tabler/icons-react'
import { useBenchmarks } from '../data/queries/useBenchmarks'
import type { BenchmarkRun } from '../types'

const nums = (rows: BenchmarkRun[], sel: (r: BenchmarkRun) => number | null): number[] =>
  rows.map(sel).filter((n): n is number => n != null && Number.isFinite(n))

const avg = (arr: number[]): number | null =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

const fmt = (n: number | null, digits = 1): string =>
  n == null
    ? '—'
    : new Intl.NumberFormat(undefined, { maximumFractionDigits: n >= 100 ? 0 : digits }).format(n)

type Kpi = {
  key: string
  label: string
  value: string
  unit?: string
  caption?: string
  hint?: string
  /** Mantine palette color name driving the icon gradient, badge, and unit. */
  color: string
  Icon: ComponentType<IconProps>
}

/**
 * Summary stat cards derived from the (filtered) benchmark result set: best and
 * average throughput, average TTFT, lowest end-to-end latency, and average TPOT.
 * Styled entirely with Mantine components/props — no CSS module or inline styles.
 */
export const BenchmarkKpiCards = () => {
  const { data, isLoading } = useBenchmarks()
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
  const peakConcurrency = concurrencies.length ? Math.max(...concurrencies) : null

  const kpis: Kpi[] = [
    {
      key: 'throughput',
      label: 'Best Throughput',
      value: fmt(bestThroughput),
      unit: 'tok/s',
      caption: bestRow?.model ?? 'across all runs',
      hint: '↑ higher is better',
      color: 'teal',
      Icon: IconBolt,
    },
    {
      key: 'concurrency',
      label: 'Peak Concurrency',
      value: fmt(peakConcurrency, 0),
      caption: 'max concurrent requests',
      color: 'indigo',
      Icon: IconUsersGroup,
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
    },
  ]

  return (
    <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, lg: 5 }} spacing="md">
      {kpis.map((kpi) => (
        <Card key={kpi.key} withBorder radius="md" padding="lg" shadow="sm">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <ThemeIcon
              size={44}
              radius="md"
              variant="gradient"
              gradient={{ from: `${kpi.color}.7`, to: `${kpi.color}.4`, deg: 135 }}
            >
              <kpi.Icon size={22} stroke={1.9} />
            </ThemeIcon>
            {kpi.hint && (
              <Badge variant="light" color={kpi.color} size="sm" radius="sm">
                {kpi.hint}
              </Badge>
            )}
          </Group>

          <Text mt="md" size="xs" fw={700} tt="uppercase" c="dimmed">
            {kpi.label}
          </Text>

          <Group gap={6} align="baseline" wrap="nowrap" mt={2}>
            {isLoading ? (
              <Skeleton height={30} width={80} radius="sm" mt={4} />
            ) : (
              <>
                <Text fz={32} fw={800} lh={1}>
                  {kpi.value}
                </Text>
                {kpi.unit && kpi.value !== '—' && (
                  <Text component="span" c={kpi.color} fw={700} size="sm">
                    {kpi.unit}
                  </Text>
                )}
              </>
            )}
          </Group>

          {kpi.caption && (
            <Text mt={6} size="xs" c="dimmed" truncate>
              {kpi.caption}
            </Text>
          )}
        </Card>
      ))}
    </SimpleGrid>
  )
}
