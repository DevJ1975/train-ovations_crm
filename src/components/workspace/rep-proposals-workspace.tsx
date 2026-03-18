'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Search, Sparkles, Trash2 } from 'lucide-react';

import { TVBadge, TVButton, TVEmptyState } from '@/components/trainovations';
import { ToastForm } from '@/components/ui/toast-form';
import { formatDate, formatCompactCurrency } from '@/lib/format';
import type { ProposalListItem } from '@/lib/services/proposal-service';

const statusTone: Record<string, string> = {
  draft: '',
  sent: 'bg-primary/10 text-primary',
  accepted: 'bg-success/15 text-success',
  declined: 'bg-destructive/10 text-destructive',
  expired: 'bg-muted text-muted-foreground',
};

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};

const STATUS_FILTERS = ['all', 'draft', 'sent', 'accepted', 'declined', 'expired'] as const;
const STATUS_FILTER_LABELS: Record<string, string> = {
  all: 'All',
  draft: 'Drafts',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};

export function RepProposalsWorkspace({
  proposals,
  deleteProposalAction,
}: {
  proposals: ProposalListItem[];
  deleteProposalAction: (formData: FormData) => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = proposals.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.lead ? `${p.lead.firstName} ${p.lead.lastName}`.toLowerCase().includes(q) : false) ||
      (p.account ? p.account.name.toLowerCase().includes(q) : false) ||
      (p.opportunity ? p.opportunity.name.toLowerCase().includes(q) : false);
    return matchesStatus && matchesQuery;
  });

  if (proposals.length === 0) {
    return (
      <TVEmptyState
        description="Create your first proposal using the button above. Claude will generate tailored content from your CRM context."
        icon={<FileText className="h-6 w-6" />}
        title="No proposals yet"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="tv-form-input pl-9"
            placeholder="Search proposals…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/60 bg-surface-muted/40 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
              type="button"
              onClick={() => setStatusFilter(s)}
            >
              {STATUS_FILTER_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <TVEmptyState title="No proposals match your search." />
      ) : (
        <div className="space-y-3">
          {filtered.map((proposal) => (
            <ProposalRow
              deleteProposalAction={deleteProposalAction}
              key={proposal.id}
              proposal={proposal}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalRow({
  proposal,
  deleteProposalAction,
}: {
  proposal: ProposalListItem;
  deleteProposalAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-surface-muted/60 px-5 py-4">
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="truncate text-sm font-semibold text-foreground hover:text-primary hover:underline"
            href={`/workspace/proposals/${proposal.id}`}
          >
            {proposal.title}
          </Link>
          <TVBadge className={statusTone[proposal.status] ?? ''} variant="default">
            {statusLabel[proposal.status] ?? proposal.status}
          </TVBadge>
          {proposal.aiGeneratedAt && (
            <TVBadge className="bg-success/10 text-success" variant="default">
              <Sparkles className="mr-1 h-3 w-3" />
              AI
            </TVBadge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {proposal.totalValueCents != null && (
            <span className="font-medium text-foreground">
              {formatCompactCurrency(proposal.totalValueCents)}
            </span>
          )}
          {proposal.lead && (
            <span>
              {proposal.lead.firstName} {proposal.lead.lastName}
            </span>
          )}
          {proposal.account && <span>{proposal.account.name}</span>}
          {proposal.opportunity && <span>{proposal.opportunity.name}</span>}
          <span>Updated {formatDate(proposal.updatedAt)}</span>
          {proposal.sentAt && <span>Sent {formatDate(proposal.sentAt)}</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <TVButton asChild size="sm" variant="secondary">
          <Link href={`/workspace/proposals/${proposal.id}`}>Edit</Link>
        </TVButton>
        <ToastForm action={deleteProposalAction} successMessage="Proposal deleted">
          <input name="proposalId" type="hidden" value={proposal.id} />
          <TVButton size="sm" type="submit" variant="ghost">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Delete</span>
          </TVButton>
        </ToastForm>
      </div>
    </div>
  );
}
