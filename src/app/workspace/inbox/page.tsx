import { redirect } from 'next/navigation';

import { WorkspaceInboxClient } from '@/components/workspace/workspace-inbox-client';
import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export default async function WorkspaceInboxPage() {
  const user = await requireAuthenticatedUser('/workspace/inbox');

  if (user.role !== 'sales_rep') {
    redirect('/workspace');
  }

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs crumbs={[{ label: 'Connected inbox' }]} />
          <TVSectionHeader
            eyebrow="Rep Tools"
            title="Connected inbox"
            description="Review CRM-linked threads, inspect recent messages, and jump directly into linked contacts and pipeline context."
          />
        </div>

        <WorkspaceInboxClient userId={user.id} />
      </div>
    </main>
  );
}
