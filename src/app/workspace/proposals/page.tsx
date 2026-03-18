import Link from 'next/link';
import { redirect } from 'next/navigation';

import { RepProposalsWorkspace } from '@/components/workspace/rep-proposals-workspace';
import { TVButton, TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getRepProposals } from '@/lib/services';
import { deleteProposalAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function WorkspaceProposalsPage() {
  const user = await requireAuthenticatedUser('/workspace/proposals');

  if (user.role !== 'sales_rep') redirect('/workspace');

  const proposals = await getRepProposals(user.id);

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs crumbs={[{ label: 'Proposals' }]} />
          <div className="flex items-start justify-between gap-3">
            <TVSectionHeader
              description="Create AI-powered proposals tailored to your leads, accounts, and opportunities. Claude assembles CRM context, meeting history, and notes into a complete draft."
              eyebrow="Rep Tools"
              title="Proposals"
            />
            <TVButton asChild className="shrink-0">
              <Link href="/workspace/proposals/new">New proposal</Link>
            </TVButton>
          </div>
        </div>

        <RepProposalsWorkspace
          deleteProposalAction={deleteProposalAction}
          proposals={proposals}
        />
      </div>
    </main>
  );
}
