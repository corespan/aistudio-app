import { Badge, Tooltip } from '@mantine/core'
import { CoreTable, useCoreTable } from '@/shared/ui'
import type { ColumnDef } from '@tanstack/react-table'
import type { BenchmarkRun } from '../types'
import { useBenchmarks } from '../data/queries/useBenchmarks'

const STATUS_COLORS: Record<string, string> = {
  success: 'green',
  completed: 'green',
  running: 'blue',
  fail: 'red',
  failed: 'red',
  pending: 'gray',
}

const formatMetric = (value: number | null) => (value == null ? '—' : value.toLocaleString())

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
  { accessorKey: 'model', header: 'Model' },
  { accessorKey: 'gpuType', header: 'GPU Type' },
  { accessorKey: 'precision', header: 'Precision' },
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
        <Badge variant="light" color={STATUS_COLORS[status.toLowerCase()] ?? 'gray'}>
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
]

export const BenchmarksTable = () => {
  const { data, isFetching } = useBenchmarks()

  const table = useCoreTable<BenchmarkRun>({
    data: data ?? EMPTY_ROWS,
    columns,
    enablePagination: true,
    enableSorting: true,
    enableGlobalFilter: true,
    // Default to most-recent-first; users can still re-sort any column.
    initialState: { sorting: [{ id: 'timestamp', desc: true }] },
  })

  return <CoreTable table={table} loading={isFetching} emptyState="No benchmark runs yet" />
}
