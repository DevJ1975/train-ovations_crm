'use client';

import Link from 'next/link';
import type { LeadStatus } from '@prisma/client';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';

import { LeadStageProgress } from '@/components/crm/lead-stage-progress';
import { LeadTimeContext } from '@/components/crm/lead-time-context';
import { DataTable } from '@/components/data-table/data-table';
import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVEmptyState,
} from '@/components/trainovations';
import type { RepLeadInboxItem } from '@/lib/services/workspace-service';
import { formatDate } from '@/lib/format';

export function RepLeadsTable({
  leads,
  repLocation,
}: {
  leads: RepLeadInboxItem[];
  repLocation: string | null;
}) {
  const columnHelper = createColumnHelper<RepLeadInboxItem>();
  const columns = [
    columnHelper.accessor((lead) => `${lead.firstName} ${lead.lastName}`, {
      id: 'lead',
      header: 'Lead',
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            {row.original.firstName} {row.original.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{row.original.email}</p>
          <p className="text-sm text-muted-foreground">
            {row.original.phone ?? 'Phone pending'}
          </p>
        </div>
      ),
      sortingFn: 'alphanumeric',
    }),
    columnHelper.accessor('company', {
      header: 'Company',
      cell: ({ row }) => (
        <div className="space-y-2">
          <p className="text-sm text-foreground">{row.original.company ?? 'Company pending'}</p>
          <p className="text-sm text-muted-foreground">
            {row.original.interest ?? 'Interest pending'}
          </p>
          <LeadTimeContext
            compact
            leadLocation={row.original.location}
            repLocation={repLocation}
          />
        </div>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => (
        <div className="space-y-3">
          <TVBadge variant="accent">{row.original.status.replace('_', ' ')}</TVBadge>
          <LeadStageProgress compact status={row.original.status as LeadStatus} />
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor('openAlertCount', {
      header: 'Alerts',
      cell: (info) => <TVBadge>{info.getValue()}</TVBadge>,
    }),
    columnHelper.accessor('latestMeetingSummary', {
      header: 'Latest Meeting',
      cell: (info) => (
        <p className="max-w-xs text-sm text-muted-foreground">
          {info.getValue() ?? 'No meeting summary yet'}
        </p>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex flex-col gap-2">
          <TVButton asChild className="whitespace-nowrap" size="sm">
            <Link href={`/workspace/leads/${row.original.id}`}>Open Lead</Link>
          </TVButton>
          <TVButton asChild className="whitespace-nowrap" size="sm" variant="secondary">
            <Link href={`mailto:${row.original.email}`}>Email Lead</Link>
          </TVButton>
          {row.original.landingPageSlug ? (
            <TVButton asChild className="whitespace-nowrap" size="sm" variant="secondary">
              <Link href={`/rep/${row.original.landingPageSlug}`}>View Public Page</Link>
            </TVButton>
          ) : null}
        </div>
      ),
      enableSorting: false,
    }),
  ];

  return (
    <TVCard className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <TVCardTitle>Lead inbox</TVCardTitle>
          <TVCardDescription>
            Owned contacts, alert counts, and the latest meeting context for rep follow-up.
          </TVCardDescription>
        </div>
        <TVBadge variant="primary">{leads.length}</TVBadge>
      </div>

      {leads.length ? (
        <div className="tv-stagger-fast">
          <DataTable columns={columns as ColumnDef<RepLeadInboxItem, unknown>[]} data={leads} pageSize={8} />
        </div>
      ) : (
        <TVEmptyState title="No leads are assigned to this rep yet." />
      )}
    </TVCard>
  );
}
