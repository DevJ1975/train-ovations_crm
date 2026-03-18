'use client';

import { useState } from 'react';

import { RepInbox } from '@/components/workspace/rep-inbox';
import { useWorkspaceInboxQuery } from '@/lib/query/workspace-hooks';
import type { InboxStatusFilter } from '@/lib/services/workspace-service';

export function WorkspaceInboxClient({ userId }: { userId: string }) {
  const [statusFilter, setStatusFilter] = useState<InboxStatusFilter>('open');
  const { data, isLoading, isError } = useWorkspaceInboxQuery(userId, statusFilter);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-surface p-6 text-sm text-muted-foreground">
        Loading inbox...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-danger/30 bg-surface p-6 text-sm text-danger">
        We couldn&apos;t load the linked inbox right now.
      </div>
    );
  }

  return (
    <RepInbox
      activeFilter={statusFilter}
      canCompose={data.canCompose}
      onFilterChange={setStatusFilter}
      threads={data.threads}
    />
  );
}
