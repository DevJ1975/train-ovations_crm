import { notFound, redirect } from 'next/navigation';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getProposalEngine } from '@/lib/services/proposal-engine-service';
import { ProposalEngineBuilder } from '@/components/workspace/proposal-engine-builder';

export const dynamic = 'force-dynamic';

export default async function ProposalBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') redirect('/workspace');

  const { id } = await params;
  const proposal = await getProposalEngine(user.id, id);
  if (!proposal) notFound();

  // Serialize dates
  const serialized = {
    ...proposal,
    expiresAt: proposal.expiresAt?.toISOString() ?? null,
    sentAt: proposal.sentAt?.toISOString() ?? null,
    viewedAt: proposal.viewedAt?.toISOString() ?? null,
    acceptedAt: proposal.acceptedAt?.toISOString() ?? null,
    paidAt: proposal.paidAt?.toISOString() ?? null,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    blocks: proposal.blocks.map((b) => ({
      ...b,
      content: b.content as Record<string, unknown>,
    })),
    packages: proposal.packages.map((p) => ({
      ...p,
      addOns: p.addOns ?? [],
    })),
  };

  return (
    <div className="min-h-screen">
      <ProposalEngineBuilder proposal={serialized as any} proposalId={id} />
    </div>
  );
}
