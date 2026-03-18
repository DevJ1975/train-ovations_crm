import { redirect } from 'next/navigation';

import { WorkspaceAlertsClient } from '@/components/workspace/workspace-alerts-client';
import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export default async function WorkspaceAlertsPage() {
  const user = await requireAuthenticatedUser('/workspace/alerts');

  if (user.role !== 'sales_rep') {
    redirect('/workspace');
  }

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs crumbs={[{ label: 'Alert queue' }]} />
          <TVSectionHeader
            eyebrow="Rep Tools"
            title="Alert queue"
            description="Review rep-owned relationship alerts, capture next steps, and clear signals without leaving the workspace."
          />
        </div>

        <WorkspaceAlertsClient userId={user.id} />
      </div>
    </main>
  );
}
