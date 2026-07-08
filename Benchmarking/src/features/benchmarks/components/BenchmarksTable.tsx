import { useMemo } from 'react'
import { ActionIcon, Badge, Button, Group, Tooltip } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconActivity, IconTrash } from '@tabler/icons-react'
import { CoreIcon, CoreTable, useCoreTable } from '@/shared/ui'
import type { ColumnDef } from '@tanstack/react-table'
import type { BenchmarkRun } from '../types'
import { useBenchmarks } from '../data/queries/useBenchmarks'
import { useDeleteBenchmark } from '../data/queries/useDeleteBenchmark'
import { useRunStreamsStore } from '../store/useRunStreamsStore'
import { toRunStreamRow } from '../data/selectors/toRunStreamRow'

const STATUS_COLORS: Record<string, string> = {
  success: 'green',
  completed: 'green',
  running: 'blue',
  'in progress': 'blue',
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

/**
 * Opens the progress drawer for a run, starting its log stream if it isn't already
 * streaming. Reads the store directly rather than being prop-drilled.
 */
const ViewProgressButton = ({ run }: { run: BenchmarkRun }) => {
  const viewRun = useRunStreamsStore((s) => s.viewRun)
  return (
    <Button
      size="compact-xs"
      variant="light"
      leftSection={<CoreIcon icon={<IconActivity stroke={1.8} />} size={14} />}
      onClick={() => viewRun({ taskId: run.runId, model: run.model, nodeIp: run.machineIp })}
    >
      View Progress
    </Button>
  )
}

/**
 * Deletes a single run after a confirmation prompt. Reads the mutation directly
 * so the column definition stays free of prop drilling.
 */
const DeleteRunButton = ({ run }: { run: BenchmarkRun }) => {
  const { mutate, isPending } = useDeleteBenchmark()
  const closeRun = useRunStreamsStore((s) => s.closeRun)

  const confirmDelete = () =>
    modals.openConfirmModal({
      title: 'Delete this run?',
      children: (
        <>
          Run <strong>{run.runId}</strong>
          {run.model ? ` (${run.model})` : ''} will be permanently deleted. This
          cannot be undone.
        </>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      // On success, also drop the run's live stream from the store so it can't
      // reappear as a synthetic pending row (or linger in the progress drawer).
      onConfirm: () => mutate(run.runId, { onSuccess: () => closeRun(run.runId) }),
    })

  return (
    <Tooltip label="Delete run" withArrow>
      <ActionIcon
        color="red"
        variant="subtle"
        loading={isPending}
        onClick={confirmDelete}
        aria-label={`Delete run ${run.runId}`}
      >
        <CoreIcon icon={<IconTrash stroke={1.8} />} size={16} />
      </ActionIcon>
    </Tooltip>
  )
}

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
  const streams = useRunStreamsStore((s) => s.streams)

  // Show runs started this session immediately — even before `/api/v1/benchmarks`
  // returns them. The API record is authoritative (it carries metrics and the real
  // status), so when a run appears in both, the API row wins and the synthetic
  // in-progress row is dropped.
  const rows = useMemo(() => {
    const apiRows = data ?? EMPTY_ROWS
    const knownIds = new Set(apiRows.map((row) => row.runId))
    const pendingRows = Object.values(streams)
      .filter((stream) => !knownIds.has(stream.taskId))
      .map(toRunStreamRow)
    return pendingRows.length ? [...pendingRows, ...apiRows] : apiRows
  }, [data, streams])

  const table = useCoreTable<BenchmarkRun>({
    data: rows,
    columns,
    enablePagination: true,
    enableSorting: true,
    enableGlobalFilter: true,
    // Default to most-recent-first; users can still re-sort any column.
    initialState: { sorting: [{ id: 'timestamp', desc: true }] },
  })

  return <CoreTable table={table} loading={isFetching} emptyState="No benchmark runs yet" />
}
