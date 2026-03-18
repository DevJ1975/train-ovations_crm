import Link from 'next/link';
import {
  Building2,
  CalendarClock,
  DollarSign,
  FileText,
  Sparkles,
  Target,
  User,
} from 'lucide-react';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
} from '@/components/trainovations';
import { formatCurrency, formatCompactCurrency, formatDate, formatEnumLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { RepOpportunityDetail } from '@/lib/services/workspace-service';

// ─── Stage / status config ────────────────────────────────────────────────────

const STAGE_BADGE: Record<string, string> = {
  prospecting: 'bg-surface-muted text-muted-foreground',
  discovery: 'bg-primary/10 text-primary',
  demo: 'bg-accent/15 text-accent',
  proposal: 'bg-accent/20 text-accent',
  negotiation: 'bg-warning/15 text-warning-foreground',
  closed_won: 'bg-success/15 text-success',
  closed_lost: 'bg-destructive/10 text-destructive',
};

const STAGE_LABELS: Record<string, string> = {
  prospecting: 'Prospecting',
  discovery: 'Discovery',
  demo: 'Demo',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

const PROPOSAL_STATUS_BADGE: Record<string, string> = {
  draft: 'bg-surface-muted text-muted-foreground',
  sent: 'bg-primary/10 text-primary',
  accepted: 'bg-success/15 text-success',
  declined: 'bg-destructive/10 text-destructive',
  expired: 'bg-border text-muted-foreground',
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  blank: 'Note',
  meeting_brief: 'Meeting Brief',
  account_brief: 'Account Brief',
  follow_up_plan: 'Follow-up Plan',
  deal_review: 'Deal Review',
  call_prep: 'Call Prep',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RepOpportunityDetail({ opp }: { opp: RepOpportunityDetail }) {
  const isClosed = opp.stage === 'closed_won' || opp.stage === 'closed_lost';

  return (
    <div className="space-y-6">

      {/* ── Deal header card ── */}
      <TVCard className="space-y-5 rounded-[2rem] border-white/60 bg-white/90">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TVBadge
                className={cn(STAGE_BADGE[opp.stage] ?? 'bg-surface-muted text-muted-foreground')}
                variant="default"
              >
                {STAGE_LABELS[opp.stage] ?? opp.stage}
              </TVBadge>
              {isClosed && opp.closeDate && (
                <span className="text-xs text-muted-foreground">
                  Closed {formatDate(opp.closeDate)}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-semibold text-foreground">{opp.name}</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <Link
                className="flex items-center gap-1.5 hover:text-foreground"
                href={`/workspace/accounts/${opp.account.id}`}
              >
                <Building2 className="h-3.5 w-3.5 text-primary" />
                {opp.account.name}
              </Link>
              {opp.primaryLead && (
                <Link
                  className="flex items-center gap-1.5 hover:text-foreground"
                  href={`/workspace/leads/${opp.primaryLead.id}`}
                >
                  <User className="h-3.5 w-3.5 text-primary" />
                  {opp.primaryLead.firstName} {opp.primaryLead.lastName}
                </Link>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TVButton asChild size="sm" variant="secondary">
              <Link href="/workspace/notes">
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Add Note
              </Link>
            </TVButton>
            <TVButton asChild size="sm" variant="ghost">
              <Link href="/workspace/proposals/new">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                New Proposal
              </Link>
            </TVButton>
          </div>
        </div>

        {/* Deal stats row */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-primary/5 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Deal value
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {opp.amountCents !== null ? formatCurrency(opp.amountCents) : '—'}
            </p>
          </div>
          <div className="rounded-xl border bg-surface-muted/60 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <Target className="h-3 w-3" />
              Target close
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {opp.targetCloseDate ? formatDate(opp.targetCloseDate) : '—'}
            </p>
          </div>
          <div className="rounded-xl border bg-surface-muted/60 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <CalendarClock className="h-3 w-3" />
              Created
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatDate(opp.createdAt)}
            </p>
          </div>
        </div>

        {/* Description / next step */}
        {opp.description && (
          <div className="rounded-xl border bg-surface-muted/60 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Next step</p>
            <p className="mt-2 text-sm text-foreground">{opp.description}</p>
          </div>
        )}
      </TVCard>

      {/* ── Notes + Proposals ── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">

        {/* Notes */}
        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div className="flex items-center justify-between gap-4">
            <div>
              <TVCardTitle>Notes</TVCardTitle>
              <TVCardDescription>Notes linked to this deal.</TVCardDescription>
            </div>
            <TVBadge className="bg-surface-muted text-muted-foreground" variant="default">
              {opp.notes.length}
            </TVBadge>
          </div>
          {opp.notes.length > 0 ? (
            <div className="space-y-2">
              {opp.notes.map((note) => (
                <div key={note.id} className="rounded-xl border bg-surface-muted/60 px-4 py-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {note.title ?? 'Untitled note'}
                    </p>
                    <TVBadge className="shrink-0 bg-surface-muted text-muted-foreground text-[10px]" variant="default">
                      {NOTE_TYPE_LABELS[note.templateType] ?? note.templateType}
                    </TVBadge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{note.body}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed bg-surface-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
              No notes yet.{' '}
              <Link className="text-primary hover:underline" href="/workspace/notes">
                Create a note
              </Link>{' '}
              and link it to this deal.
            </div>
          )}
        </TVCard>

        {/* Proposals */}
        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div className="flex items-center justify-between gap-4">
            <div>
              <TVCardTitle>Proposals</TVCardTitle>
              <TVCardDescription>Proposals created for this deal.</TVCardDescription>
            </div>
            <TVButton asChild size="sm" variant="ghost">
              <Link href="/workspace/proposals/new">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                New
              </Link>
            </TVButton>
          </div>
          {opp.proposals.length > 0 ? (
            <div className="space-y-2">
              {opp.proposals.map((proposal) => (
                <Link
                  key={proposal.id}
                  className="flex items-start justify-between gap-3 rounded-xl border bg-surface-muted/60 px-4 py-3 transition-colors hover:border-primary/20 hover:bg-white"
                  href={`/workspace/proposals/${proposal.id}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{proposal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {proposal.sentAt
                        ? `Sent ${formatDate(proposal.sentAt)}`
                        : `Created ${formatDate(proposal.createdAt)}`}
                    </p>
                  </div>
                  <div className="shrink-0 space-y-1 text-right">
                    <TVBadge
                      className={cn(
                        PROPOSAL_STATUS_BADGE[proposal.status] ?? 'bg-surface-muted text-muted-foreground',
                      )}
                      variant="default"
                    >
                      {proposal.status}
                    </TVBadge>
                    {proposal.totalValueCents !== null && (
                      <p className="text-xs font-medium text-foreground">
                        {formatCompactCurrency(proposal.totalValueCents)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed bg-surface-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
              No proposals yet.
            </div>
          )}
        </TVCard>
      </div>

      {/* ── Account context ── */}
      <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
        <div>
          <TVCardTitle>Account context</TVCardTitle>
          <TVCardDescription>Parent account details for this deal.</TVCardDescription>
        </div>
        <Link
          className="flex items-center justify-between gap-3 rounded-xl border bg-surface-muted/60 px-4 py-4 transition-colors hover:border-primary/20 hover:bg-white"
          href={`/workspace/accounts/${opp.account.id}`}
        >
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">{opp.account.name}</p>
              {opp.account.industry && (
                <p className="text-xs text-muted-foreground">{opp.account.industry}</p>
              )}
            </div>
          </div>
          <TVBadge
            className="bg-surface-muted text-muted-foreground"
            variant="default"
          >
            {formatEnumLabel(opp.account.status)}
          </TVBadge>
        </Link>
        {opp.primaryLead && (
          <Link
            className="flex items-center justify-between gap-3 rounded-xl border bg-surface-muted/60 px-4 py-4 transition-colors hover:border-primary/20 hover:bg-white"
            href={`/workspace/leads/${opp.primaryLead.id}`}
          >
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  {opp.primaryLead.firstName} {opp.primaryLead.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{opp.primaryLead.email}</p>
              </div>
            </div>
            <TVBadge className="bg-surface-muted text-muted-foreground" variant="default">
              Primary contact
            </TVBadge>
          </Link>
        )}
      </TVCard>
    </div>
  );
}
