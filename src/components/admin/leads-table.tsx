'use client';

import Link from 'next/link';
import type { LeadStatus } from '@prisma/client';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';

import { LeadStageProgress } from '@/components/crm/lead-stage-progress';
import { LeadTimeContext } from '@/components/crm/lead-time-context';
import { DataTable } from '@/components/data-table/data-table';
import { TVBadge } from '@/components/trainovations';
import { formatDate } from '@/lib/format';

export function LeadsTable({
  leads,
}: {
  leads: Array<{
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
    location: string | null;
    email: string;
    phone: string | null;
    status: string;
    createdAt: Date;
    repProfile: {
      displayName: string;
      location?: string | null;
    } | null;
  }>;
}) {
  type LeadRow = (typeof leads)[number];
  const columnHelper = createColumnHelper<LeadRow>();
  const columns = [
    columnHelper.accessor((lead) => `${lead.firstName} ${lead.lastName}`, {
      id: 'lead',
      header: 'Lead',
      cell: ({ row }) => (
        <div className="min-w-0 max-w-[180px]">
          <Link
            className="block truncate font-medium text-foreground hover:text-primary"
            href={`/admin/leads/${row.original.id}`}
          >
            {row.original.firstName} {row.original.lastName}
          </Link>
        </div>
      ),
      sortingFn: 'alphanumeric',
    }),
    columnHelper.accessor('company', {
      header: 'Company',
      cell: ({ row }) => (
        <div className="space-y-2">
          <p className="max-w-[120px] truncate text-sm text-foreground">{row.original.company ?? '—'}</p>
          <LeadTimeContext
            compact
            leadLocation={row.original.location}
            repLocation={row.original.repProfile?.location ?? null}
          />
        </div>
      ),
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => (
        <span className="block max-w-[180px] truncate">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: (info) => info.getValue() ?? '—',
    }),
    columnHelper.accessor((lead) => lead.repProfile?.displayName ?? 'Unassigned', {
      id: 'assignedRep',
      header: 'Assigned Rep',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <div className="space-y-3">
          <TVBadge variant="accent">{info.getValue().replace('_', ' ')}</TVBadge>
          <LeadStageProgress compact status={info.getValue() as LeadStatus} />
        </div>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Submitted',
      cell: (info) => formatDate(info.getValue()),
      sortingFn: 'datetime',
    }),
  ];

  return (
    <DataTable columns={columns as ColumnDef<LeadRow, unknown>[]} data={leads} />
  );
}
