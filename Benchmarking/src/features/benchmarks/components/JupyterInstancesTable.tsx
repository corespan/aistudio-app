import { Badge, Group, Tooltip } from '@mantine/core'
import { CoreTable, useCoreTable } from '@/shared/ui'
import type { ColumnDef } from '@tanstack/react-table'
import type { JupyterInstance } from '../types'
import { useJupyterInstances } from '../data/queries/useJupyterInstances'
import { JUPYTER_INSTANCE_STATE_COLORS } from '../constants'
import { maskIp } from '../lib/maskIp'
import { DeleteJupyterInstanceButton } from './DeleteJupyterInstanceButton'

// Show only month, day, and time — full timestamp stays available on hover.
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

// Stable empty reference — a fresh `[]` each render livelocks TanStack Table's auto-reset.
const EMPTY_ROWS: JupyterInstance[] = []

const columns: ColumnDef<JupyterInstance>[] = [
  { accessorKey: 'taskId', header: 'Task ID' },
  // {
  //   accessorKey: 'nodeIp',
  //   header: 'Node IP',
  //   cell: ({ getValue }) => {
  //     const ip = getValue<string>()
  //     if (!ip) return '—'
  //     return (
  //       <Tooltip label={ip} withArrow>
  //         <span>{maskIp(ip)}</span>
  //       </Tooltip>
  //     )
  //   },
  // },
  {
    accessorKey: 'state',
    header: 'State',
    cell: ({ getValue }) => {
      const state = getValue<string>()
      if (!state) return '—'
      return (
        <Badge variant="light" color={JUPYTER_INSTANCE_STATE_COLORS[state.toLowerCase()] ?? 'gray'}>
          {state}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
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
    accessorKey: 'updatedAt',
    header: 'Updated',
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
        <DeleteJupyterInstanceButton instance={row.original} />
      </Group>
    ),
  },
]

/**
 * Every Jupyter notebook server the backend knows about (GET /jupyter/instances) —
 * a history/roster view sitting below the single-instance Launch Jupyter form and
 * its log stream. Each row's "Open" button opens that instance's notebook URL
 * directly, independent of the launch flow's own Open button.
 */
export const JupyterInstancesTable = () => {
  const { data, isFetching } = useJupyterInstances()
  const rows = data ?? EMPTY_ROWS

  const table = useCoreTable<JupyterInstance>({
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
      emptyState="No Jupyter instances yet"
    />
  )
}
