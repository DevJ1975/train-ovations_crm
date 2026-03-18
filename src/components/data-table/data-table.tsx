'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import { TVButton } from '@/components/trainovations';
import {
  TVTable,
  TVTableBody,
  TVTableCell,
  TVTableHead,
  TVTableHeader,
  TVTableRow,
} from '@/components/trainovations';

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  emptyState?: ReactNode;
  pageSize?: number;
};

export function DataTable<TData>({
  columns,
  data,
  emptyState = 'No records found.',
  pageSize = 10,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    columns,
    data,
    initialState: {
      pagination: {
        pageSize,
      },
    },
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <TVTable>
        <TVTableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TVTableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortState = header.column.getIsSorted();

                return (
                  <TVTableHead key={header.id}>
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        className="inline-flex items-center gap-1.5 text-left transition-colors hover:text-foreground"
                        onClick={header.column.getToggleSortingHandler()}
                        type="button"
                      >
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </span>
                        {sortState === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5 text-primary" />
                        ) : sortState === 'desc' ? (
                          <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground opacity-50" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TVTableHead>
                );
              })}
            </TVTableRow>
          ))}
        </TVTableHeader>
        <TVTableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TVTableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TVTableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TVTableCell>
                ))}
              </TVTableRow>
            ))
          ) : (
            <TVTableRow>
              <TVTableCell className="py-10 text-center text-muted-foreground" colSpan={columns.length}>
                {emptyState}
              </TVTableCell>
            </TVTableRow>
          )}
        </TVTableBody>
      </TVTable>

      {table.getPageCount() > 1 ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <div className="flex items-center gap-2">
            <TVButton
              onClick={() => table.previousPage()}
              size="sm"
              type="button"
              variant="secondary"
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </TVButton>
            <TVButton
              onClick={() => table.nextPage()}
              size="sm"
              type="button"
              variant="secondary"
              disabled={!table.getCanNextPage()}
            >
              Next
            </TVButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
