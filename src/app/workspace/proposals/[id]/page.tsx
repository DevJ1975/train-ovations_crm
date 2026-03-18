import { notFound, redirect } from 'next/navigation';

import { ProposalEditor } from '@/components/workspace/proposal-editor';
import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getRepProposalById } from '@/lib/services';
import { markProposalSentAction, saveProposalFieldAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuthenticatedUser('/workspace/proposals');

  if (user.role !== 'sales_rep') redirect('/workspace');

  const { id } = await params;
  const proposal = await getRepProposalById(user.id, id);

  if (!proposal) notFound();

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-4xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs
            crumbs={[
              { label: 'Proposals', href: '/workspace/proposals' },
              { label: proposal.title },
            ]}
          />
          <TVSectionHeader
            description="Edit each section directly or use AI to rewrite individual sections with a custom instruction."
            eyebrow="Rep Tools"
            title={proposal.title}
          />
        </div>

        <ProposalEditor
          markSentAction={markProposalSentAction}
          proposal={proposal}
          saveAction={saveProposalFieldAction}
        />
      </div>
    </main>
  );
}
