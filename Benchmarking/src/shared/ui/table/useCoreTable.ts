import {
  type RowData,
  type Table,
  type TableOptions,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

export type CoreTableOptions<TData extends RowData> = Omit<
  TableOptions<TData>,
  'getCoreRowModel'
> & {
  enablePagination?: boolean
  enableSorting?: boolean
  enableGlobalFilter?: boolean
}

export function useCoreTable<TData extends RowData>({
  enablePagination,
  enableSorting,
  enableGlobalFilter,
  ...options
}: CoreTableOptions<TData>): Table<TData> {
  return useReactTable<TData>({
    getCoreRowModel: getCoreRowModel(),
    ...(enablePagination && { getPaginationRowModel: getPaginationRowModel() }),
    ...(enableSorting && { getSortedRowModel: getSortedRowModel() }),
    ...(enableGlobalFilter && { getFilteredRowModel: getFilteredRowModel() }),
    ...options,
  })
}
