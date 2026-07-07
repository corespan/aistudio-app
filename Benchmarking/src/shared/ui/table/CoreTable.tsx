import {
  ActionIcon,
  Box,
  Group,
  Pagination,
  Table as MantineTable,
  Paper,
  Select,
  Skeleton,
  Text,
  TextInput,
} from '@mantine/core'
import type { PaperProps, TableProps as MantineTableProps } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { type RowData, type Table, flexRender } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    valign?: 'top' | 'middle' | 'bottom'
  }
}
import { ChevronDown, ChevronUp, ChevronsUpDown, Maximize, Minimize } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import classes from './core-table.module.css'
import { IconSearchOff, IconSearch } from '@tabler/icons-react'
import { CoreIcon } from '../CoreIcon'
export type CoreTableProps<TData extends RowData> = Omit<MantineTableProps, 'data' | 'children'> & {
  table: Table<TData>
  emptyState?: ReactNode
  pageSizeOptions?: number[]
  loading?: boolean
  enableFullscreen?: boolean
  toolbarRight?: ReactNode
  paperProps?: PaperProps
  onRowClick?: (row: TData) => void
}

const DEFAULT_PAGE_SIZES = [5, 10, 20, 50]

const concatenate = (...values: Array<string | undefined>) => values.filter(Boolean).join(' ')

function mergeFoundationClasses(
  override: MantineTableProps['classNames'],
): MantineTableProps['classNames'] {
  if (typeof override === 'function') return override
  return {
    ...override,
    table: concatenate(classes.table, override?.table),
    th: concatenate(classes.th, override?.th),
    td: concatenate(classes.td, override?.td),
  }
}

export const CoreTable = <TData extends RowData>({
  table,
  emptyState = 'No data',
  verticalSpacing = 'xs',
  horizontalSpacing = 'xs',
  withRowBorders = false,
  classNames,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  loading = false,
  enableFullscreen = false,
  toolbarRight,
  paperProps,
  onRowClick,
  ...rest
}: CoreTableProps<TData>) => {
  const [fullscreen, setFullscreen] = useState(false)
  const toggleFullscreen = () => setFullscreen((value) => !value)

  const rows = table.getRowModel().rows
  const visibleColumns = table.getVisibleLeafColumns()
  const colSpan = visibleColumns.length
  const isPaginated = Boolean(table.options.getPaginationRowModel)
  const isSortable = Boolean(table.options.getSortedRowModel)
  const isSearchable = Boolean(table.options.getFilteredRowModel)
  const showToolbar = isSearchable || enableFullscreen || Boolean(toolbarRight)
  const skeletonRowCount = isPaginated ? table.getState().pagination.pageSize : 5
  return (
    <Paper
      radius="sm"
      p={0}
      bg="var(--mantine-color-default)"
      {...paperProps}
      className={concatenate(fullscreen ? classes.fullscreen : undefined, paperProps?.className)}
    >
      {showToolbar && (
        <Group className={classes.headerBox}>
          {isSearchable && <GlobalSearch table={table} />}
          {toolbarRight}
          {enableFullscreen && (
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              onClick={toggleFullscreen}
            >
              {fullscreen ? <CoreIcon icon={<Minimize />} /> : <CoreIcon icon={<Maximize />} />}
            </ActionIcon>
          )}
        </Group>
      )}

      <Box className={classes.tableScroll} data-fullscreen={fullscreen || undefined}>
        <MantineTable
          withRowBorders={withRowBorders}
          verticalSpacing={verticalSpacing}
          horizontalSpacing={horizontalSpacing}
          classNames={mergeFoundationClasses(classNames)}
          {...rest}
        >
          <MantineTable.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <MantineTable.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = isSortable && header.column.getCanSort()
                  return (
                    // Width applies only when the column def declares `size`;
                    // unsized columns share the remaining space (auto layout).
                    <MantineTable.Th
                      key={header.id}
                      colSpan={header.colSpan}
                      w={header.column.columnDef.size}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <Group
                          gap={4}
                          wrap="nowrap"
                          className={classes.sortable}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIndicator direction={header.column.getIsSorted()} />
                        </Group>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </MantineTable.Th>
                  )
                })}
              </MantineTable.Tr>
            ))}
          </MantineTable.Thead>

          <MantineTable.Tbody>
            {loading ? (
              Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
                <MantineTable.Tr key={`skeleton-${rowIndex}`}>
                  {visibleColumns.map((column) => (
                    <MantineTable.Td key={column.id}>
                      <Skeleton height="1lh" />
                    </MantineTable.Td>
                  ))}
                </MantineTable.Tr>
              ))
            ) : rows.length === 0 ? (
              <MantineTable.Tr>
                <MantineTable.Td colSpan={colSpan}>
                  {typeof emptyState === 'string' ? (
                    <Text c="dimmed" size="sm" ta="center" py="md">
                      {emptyState}
                    </Text>
                  ) : (
                    // Rich nodes render block elements — keep them out of <Text>'s <p>
                    <Box ta="center" py="md">
                      {emptyState}
                    </Box>
                  )}
                </MantineTable.Td>
              </MantineTable.Tr>
            ) : (
              rows.map((row) => (
                <MantineTable.Tr
                  key={row.id}
                  className={onRowClick ? classes.clickableRow : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <MantineTable.Td
                      key={cell.id}
                      style={
                        cell.column.columnDef.meta?.valign
                          ? { verticalAlign: cell.column.columnDef.meta.valign }
                          : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </MantineTable.Td>
                  ))}
                </MantineTable.Tr>
              ))
            )}
          </MantineTable.Tbody>
        </MantineTable>
      </Box>

      {isPaginated &&
        (loading ? (
          <PaginationSkeleton />
        ) : rows.length > 0 ? (
          <TablePagination table={table} pageSizeOptions={pageSizeOptions} />
        ) : null)}
    </Paper>
  )
}

const SortIndicator = ({ direction }: { direction: false | 'asc' | 'desc' }) => {
  if (direction === 'asc') return <CoreIcon icon={<ChevronUp size={14} />} />
  if (direction === 'desc') return <CoreIcon icon={<ChevronDown size={14} />} />
}

const GlobalSearch = <TData extends RowData>({ table }: { table: Table<TData> }) => {
  const [value, setValue] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [debounced] = useDebouncedValue(value, 250)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    table.setGlobalFilter(debounced)
  }, [debounced, table])

  const toggle = () => {
    if (expanded) {
      setValue('')
      setExpanded(false)
    } else {
      setExpanded(true)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  return (
    <Group gap="xs" wrap="nowrap">
      {expanded && (
        <TextInput
          leftSection={<CoreIcon icon={<IconSearch />} />}
          ref={inputRef}
          size="xs"
          placeholder="Search"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
        />
      )}
      <ActionIcon
        variant="subtle"
        color="gray"
        aria-label={expanded ? 'Hide search' : 'Show search'}
        onClick={toggle}
      >
        {expanded ? <CoreIcon icon={<IconSearchOff />} /> : <CoreIcon icon={<IconSearch />} />}
      </ActionIcon>
    </Group>
  )
}

const PaginationSkeleton = () => {
  return (
    <Group justify="center" gap="xl" px="sm" py="xs">
      <Group gap="xs">
        <Skeleton height={14} width={80} />
        <Skeleton height={28} width={80} />
      </Group>
      <Skeleton height={28} width={280} />
    </Group>
  )
}

const TablePagination = <TData extends RowData>({
  table,
  pageSizeOptions,
}: {
  table: Table<TData>
  pageSizeOptions: number[]
}) => {
  const pageCount = table.getPageCount()
  const { pageIndex, pageSize } = table.getState().pagination

  return (
    <Group justify="center" gap="xl" px="sm" py="xs">
      <Group gap="xs">
        <Text size="xs" c="dimmed">
          Rows per page
        </Text>
        <Select
          size="xs"
          w={80}
          allowDeselect={false}
          data={pageSizeOptions.map(String)}
          value={String(pageSize)}
          onChange={(value) => value && table.setPageSize(Number(value))}
          comboboxProps={{ withinPortal: false }}
        />
      </Group>
      {/* Mantine uses 1-based indexing */}
      <Pagination.Root
        size="sm"
        total={pageCount}
        value={pageIndex + 1}
        onChange={(page) => table.setPageIndex(page - 1)}
      >
        <Group gap={5} justify="center">
          <Pagination.First />
          <Pagination.Previous />
          <Pagination.Items />
          <Pagination.Next />
          <Pagination.Last />
        </Group>
      </Pagination.Root>
    </Group>
  )
}
