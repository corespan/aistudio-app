import { Badge, Group, Tooltip } from '@mantine/core'
import { CoreTable, useCoreTable } from '@/shared/ui'
import type { ColumnDef } from '@tanstack/react-table'
import type { BenchmarkRun } from '../types'
import { useBenchmarks } from '../data/queries/useBenchmarks'
import { ViewProgressButton } from './ViewProgressButton'
import { DeleteRunButton } from './DeleteRunButton'
import { BENCHMARKS_TABLE_STATUS_COLORS } from '../constants'

const formatMetric = (value: number | null) => (value == null ? '—' : value.toLocaleString())

// Same "—" placeholder convention as every other column — a blank/null string
// from the API should render as the dash, not an empty cell.
const formatText = (value: string | null | undefined) => (value ? value : '—')

// Show only month, day, and time — the year and seconds add noise without
// adding meaning for a list of recent runs. The full timestamp stays available
// on hover via a tooltip.
const formatTimestamp = (raw: string) => {
  const ms = Date.parse(raw)
  if (Number.isNaN(ms)) return '—'
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Sort by the parsed date rather than the raw string so non-ISO formats still
// order chronologically. Invalid/missing dates sink to the bottom.
const byTimestamp: ColumnDef<BenchmarkRun>['sortingFn'] = (a, b, id) =>
  (Date.parse(a.getValue<string>(id)) || 0) - (Date.parse(b.getValue<string>(id)) || 0)

// Stable empty reference — a fresh `[]` each render livelocks TanStack Table's auto-reset.
const EMPTY_ROWS: BenchmarkRun[] = []

const columns: ColumnDef<BenchmarkRun>[] = [
  { accessorKey: 'runId', header: 'Run ID' },
  {
    accessorKey: 'model',
    header: 'Model',
    cell: ({ getValue }) => formatText(getValue<string | null | undefined>()),
  },
  {
    accessorKey: 'serverName',
    header: 'Chasis',
    cell: ({ getValue }) => {
      const server = getValue<string>()
      if (!server || server === '—') return '—'
      return (
        <Badge variant="filled" color="grape" size="sm" radius="sm">
          {server}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'gpuType',
    header: 'GPU Type',
    cell: ({ getValue }) => formatText(getValue<string | null | undefined>()),
  },
  {
    accessorKey: 'precision',
    header: 'Precision',
    cell: ({ getValue }) => formatText(getValue<string | null | undefined>()),
  },
  {
    accessorKey: 'throughput',
    header: 'Throughput (tokens/s)',
    cell: ({ getValue }) => formatMetric(getValue<number | null>()),
  },
  {
    accessorKey: 'ttft',
    header: 'TTFT (ms)',
    cell: ({ getValue }) => formatMetric(getValue<number | null>()),
  },
  {
    accessorKey: 'tpot',
    header: 'TPOT (ms)',
    cell: ({ getValue }) => formatMetric(getValue<number | null>()),
  },
  {
    accessorKey: 'e2el',
    header: 'E2EL (ms)',
    cell: ({ getValue }) => formatMetric(getValue<number | null>()),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue<string>()
      if (!status) return '—'
      return (
        <Badge
          variant="light"
          color={BENCHMARKS_TABLE_STATUS_COLORS[status.toLowerCase()] ?? 'gray'}
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'timestamp',
    header: 'Time',
    sortingFn: byTimestamp,
    cell: ({ getValue }) => {
      const raw = getValue<string>()
      const short = formatTimestamp(raw)
      if (short === '—') return short
      return (
        <Tooltip label={raw} withArrow>
          <span>{short}</span>
        </Tooltip>
      )
    },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <Group gap="xs" wrap="nowrap" justify="flex-end">
        <ViewProgressButton run={row.original} />
        <DeleteRunButton run={row.original} />
      </Group>
    ),
  },
]

export const BenchmarksTable = () => {
  const { data, isFetching } = useBenchmarks()

  // Exactly what `/api/v1/benchmarks` returns, in the exact order it comes
  // back — no default sort, no locally-synthesized rows merged in. `EMPTY_ROWS`
  // is a stable reference so a fresh `[]` each render doesn't livelock
  // TanStack Table's auto-reset. Users can still click a column header to sort.
  const rows = data ?? EMPTY_ROWS

  const table = useCoreTable<BenchmarkRun>({
    data: rows,
    columns,
    enablePagination: true,
    enableSorting: true,
    enableGlobalFilter: true,
  })

  return (
    <CoreTable
      table={table}
      loading={isFetching}
      withRowBorders
      verticalSpacing="xs"
      horizontalSpacing="xs"
      enableFullscreen
      emptyState="No benchmark runs yet"
    />
  )
}
