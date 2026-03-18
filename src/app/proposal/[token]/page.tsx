import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PenLine, Sparkles } from 'lucide-react';

import { TVBadge, TVButton, TVSectionHeader } from '@/components/trainovations';
import { formatDate, formatCurrency } from '@/lib/format';
import { getProposalByShareToken } from '@/lib/services';
import { getProposalByToken } from '@/lib/services/proposal-engine-service';
import { PublicProposalViewer } from '@/components/proposal/public-proposal-viewer';

export const dynamic = 'force-dynamic';

const SECTION_ORDER = [
  { key: 'executiveSummary', label: 'Executive Summary' },
  { key: 'aboutUs', label: 'About Us' },
  { key: 'scopeOfWork', label: 'Scope of Work' },
  { key: 'deliverables', label: 'Deliverables' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'terms', label: 'Terms & Conditions' },
  { key: 'nextSteps', label: 'Next Steps' },
] as const;

export default async function PublicProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { token } = await params;
  const { payment } = await searchParams;

  // Try block-engine proposal first
  const blockProposal = await getProposalByToken(token);

  // Block engine path
  if (blockProposal?.useBlockEngine) {
    if (blockProposal.expiresAt && blockProposal.expiresAt < new Date()) {
      return <ExpiredNotice repName={blockProposal.repProfile?.displayName} />;
    }

    const serialized = {
      ...blockProposal,
      expiresAt: blockProposal.expiresAt?.toISOString() ?? null,
      sentAt: blockProposal.sentAt?.toISOString() ?? null,
      viewedAt: blockProposal.viewedAt?.toISOString() ?? null,
      signedAt: blockProposal.signedAt?.toISOString() ?? null,
      paidAt: blockProposal.paidAt?.toISOString() ?? null,
      createdAt: blockProposal.createdAt.toISOString(),
      updatedAt: blockProposal.updatedAt.toISOString(),
      blocks: (blockProposal.blocks ?? []).map((b) => ({
        ...b,
        content: b.content as Record<string, unknown>,
      })),
      packages: (blockProposal.packages ?? []).map((p) => ({
        ...p,
        addOns: (p.addOns ?? []),
      })),
    };

    return (
      <PublicProposalViewer
        initialPaymentState={payment as 'success' | 'cancelled' | undefined}
        proposal={serialized as never}
        token={token}
      />
    );
  }

  // Legacy flat-text path
  const proposal = await getProposalByShareToken(token);
  if (!proposal || proposal.status === 'draft') notFound();

  const rep = (proposal as typeof proposal & {
    repProfile?: {
      displayName: string;
      title: string;
      email: string;
      phone: string | null;
      signatureProfile: { companyName: string; website: string | null; address: string | null } | null;
    };
  }).repProfile;

  return (
    <div className="tv-shell min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 py-12 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl space-y-10 print:space-y-8">
        <div className="space-y-4 border-b border-border/60 pb-8 print:pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {rep?.signatureProfile?.companyName && (
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {rep.signatureProfile.companyName}
                </p>
              )}
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{proposal.title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <TVBadge className="bg-success/10 text-success" variant="default">
                {proposal.status === 'accepted' ? 'Accepted' : 'Proposal'}
              </TVBadge>
              {proposal.aiGeneratedAt && (
                <TVBadge className="bg-primary/10 text-primary" variant="default">
                  <Sparkles className="mr-1 h-3 w-3" /> AI-assisted
                </TVBadge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            {proposal.sentAt && <span>Issued: {formatDate(proposal.sentAt)}</span>}
            {proposal.expiresAt && <span>Valid until: {formatDate(proposal.expiresAt)}</span>}
            {proposal.totalValueCents != null && (
              <span className="font-semibold text-foreground">Total: {formatCurrency(proposal.totalValueCents)}</span>
            )}
          </div>
        </div>

        {(proposal.lead || proposal.account || proposal.opportunity) && (
          <div className="flex flex-wrap gap-3">
            {proposal.lead && <TVBadge variant="default">For: {proposal.lead.firstName} {proposal.lead.lastName}</TVBadge>}
            {proposal.account && <TVBadge variant="default">{proposal.account.name}</TVBadge>}
            {proposal.opportunity && <TVBadge variant="default">{proposal.opportunity.name}</TVBadge>}
          </div>
        )}

        {proposal.status !== 'signed' && proposal.status !== 'declined' && (
          <div className="flex justify-center print:hidden">
            <TVButton asChild size="lg">
              <Link href={`/proposal/${token}/sign`}><PenLine className="h-4 w-4" /> Sign this proposal</Link>
            </TVButton>
          </div>
        )}

        {SECTION_ORDER.map(({ key, label }) => {
          const content = proposal[key as keyof typeof proposal] as string | null;
          if (!content?.trim()) return null;
          return (
            <section key={key} className="space-y-3">
              <h2 className="text-lg font-semibold">{label}</h2>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>
            </section>
          );
        })}

        {rep && (
          <div className="border-t border-border/60 pt-8">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Prepared by</p>
            <div className="mt-3 space-y-1">
              <p className="font-semibold">{rep.displayName}</p>
              <p className="text-sm text-muted-foreground">{rep.title}</p>
              {rep.signatureProfile?.companyName && <p className="text-sm text-muted-foreground">{rep.signatureProfile.companyName}</p>}
              <p className="text-sm text-muted-foreground">{rep.email}</p>
              {rep.phone && <p className="text-sm text-muted-foreground">{rep.phone}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExpiredNotice({ repName }: { repName?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted p-6">
      <div className="max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-lg">
        <p className="mb-2 text-4xl">⏰</p>
        <h1 className="mb-2 text-xl font-bold">This proposal has expired</h1>
        <p className="text-muted-foreground">
          Please contact {repName ?? 'the sender'} to request a new proposal.
        </p>
      </div>
    </div>
  );
}
