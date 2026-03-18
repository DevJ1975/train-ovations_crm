'use client';

import { ManualLeadDialog } from '@/components/workspace/manual-lead-dialog';
import { RepLeadsTable } from '@/components/workspace/rep-leads-table';
import { useWorkspaceLeadsQuery } from '@/lib/query/workspace-hooks';

export function WorkspaceLeadsClient({
  userId,
  repLocation,
}: {
  userId: string;
  repLocation: string | null;
}) {
  const { data, isLoading, isError, refetch } = useWorkspaceLeadsQuery(userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <ManualLeadDialog />
        </div>
        <div className="rounded-lg border bg-surface p-6 text-sm text-muted-foreground">
          Loading lead inbox...
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <ManualLeadDialog />
        </div>
        <div className="rounded-lg border border-danger/30 bg-surface p-6 text-sm text-danger">
          We couldn&apos;t load the rep lead inbox right now.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ManualLeadDialog onCreated={refetch} />
      </div>
      <RepLeadsTable
        leads={data.leads.map((lead) => ({
          ...lead,
          createdAt: new Date(lead.createdAt),
        }))}
        repLocation={repLocation}
      />
    </div>
  );
}
