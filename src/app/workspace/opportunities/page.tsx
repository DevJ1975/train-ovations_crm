import { redirect } from 'next/navigation';

import { RepOpportunitiesWorkspace } from '@/components/workspace/rep-opportunities-workspace';
import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getRepOpportunitiesWorkspace } from '@/lib/services';
import {
  moveOpportunityStageAction,
  updateOpportunityNextStepAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function WorkspaceOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const user = await requireAuthenticatedUser('/workspace/opportunities');

  if (user.role !== 'sales_rep') {
    redirect('/workspace');
  }

  const [opportunities, { account }] = await Promise.all([
    getRepOpportunitiesWorkspace(user.id),
    searchParams,
  ]);

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs
            crumbs={
              account
                ? [{ label: 'Accounts', href: '/workspace/accounts' }, { label: 'Pipeline' }]
                : [{ label: 'Pipeline' }]
            }
          />
          <TVSectionHeader
            eyebrow="Rep Tools"
            title="Pipeline"
            description="Track open deals by stage, update next steps, and move opportunities forward without leaving the rep workspace."
          />
        </div>

        <RepOpportunitiesWorkspace
          accountFilter={account ?? null}
          moveStageAction={moveOpportunityStageAction}
          opportunities={opportunities}
          updateNextStepAction={updateOpportunityNextStepAction}
        />
      </div>
    </main>
  );
}
