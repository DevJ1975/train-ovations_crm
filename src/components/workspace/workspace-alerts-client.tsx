'use client';

import { RepAlerts } from '@/components/workspace/rep-alerts';
import { useWorkspaceAlertsQuery } from '@/lib/query/workspace-hooks';

export function WorkspaceAlertsClient({ userId }: { userId: string }) {
  const { data, isLoading, isError, refetch } = useWorkspaceAlertsQuery(userId);

  async function handleStatusChange(alertId: string, status: 'dismissed' | 'resolved') {
    const response = await fetch(`/api/workspace/alerts/${alertId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to update alert');
    }

    await refetch();
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-surface p-6 text-sm text-muted-foreground">
        Loading alert queue...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-danger/30 bg-surface p-6 text-sm text-danger">
        We couldn&apos;t load the rep alert queue right now.
      </div>
    );
  }

  return <RepAlerts alerts={data.alerts} onStatusChange={handleStatusChange} />;
}
