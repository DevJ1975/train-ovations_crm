import { redirect } from 'next/navigation';

import { RepAccountsWorkspace } from '@/components/workspace/rep-accounts-workspace';
import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getRepAccountsWorkspace } from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function WorkspaceAccountsPage() {
  const user = await requireAuthenticatedUser('/workspace/accounts');

  if (user.role !== 'sales_rep') {
    redirect('/workspace');
  }

  const accounts = await getRepAccountsWorkspace(user.id);

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs crumbs={[{ label: 'Accounts' }]} />
          <TVSectionHeader
            eyebrow="Rep Tools"
            title="Accounts"
            description="Review the accounts assigned to your rep profile. See contacts, open deals, and pipeline value at a glance."
          />
        </div>

        <RepAccountsWorkspace accounts={accounts} />
      </div>
    </main>
  );
}
