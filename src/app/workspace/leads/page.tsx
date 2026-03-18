import Link from 'next/link';
import { redirect } from 'next/navigation';

import { WorkspaceLeadsClient } from '@/components/workspace/workspace-leads-client';
import { TVButton, TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getWorkspaceData } from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function WorkspaceLeadsPage() {
  const user = await requireAuthenticatedUser('/workspace/leads');

  if (user.role !== 'sales_rep') {
    redirect('/workspace');
  }

  const workspace = await getWorkspaceData(user.id, user.role);
  const repLocation =
    workspace?.destination === 'rep' && workspace.repProfile
      ? workspace.repProfile.location
      : null;

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs crumbs={[{ label: 'Lead inbox' }]} />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <TVSectionHeader
              eyebrow="Rep Tools"
              title="Lead inbox"
              description="Review the contacts assigned to your rep profile and use the built-in follow-up shortcuts."
            />
            <div className="flex flex-wrap items-center gap-2">
              <TVButton asChild size="sm" variant="ghost">
                <Link href="/workspace/leads/duplicates">View Duplicates</Link>
              </TVButton>
              <TVButton asChild size="sm" variant="secondary">
                <Link href="/workspace/leads/import">Import CSV</Link>
              </TVButton>
            </div>
          </div>
        </div>

        <WorkspaceLeadsClient repLocation={repLocation} userId={user.id} />
      </div>
    </main>
  );
}
