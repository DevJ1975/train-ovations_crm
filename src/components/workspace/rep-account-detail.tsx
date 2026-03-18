import Link from 'next/link';
import {
  Building2,
  ExternalLink,
  FileText,
  Globe,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
} from '@/components/trainovations';
import { formatCompactCurrency, formatDate, formatEnumLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { RepAccountDetail } from '@/lib/services/workspace-service';

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  prospecting: 'Prospecting',
  discovery: 'Discovery',
  demo: 'Demo',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Won',
  closed_lost: 'Lost',
};

const STAGE_BADGE: Record<string, string> = {
  closed_won: 'bg-success/15 text-success',
  closed_lost: 'bg-destructive/10 text-destructive',
  negotiation: 'bg-primary/10 text-primary',
  proposal: 'bg-accent/15 text-accent',
};

const STATUS_BADGE: Record<string, string> = {
  active_customer: 'bg-success/15 text-success',
  prospect: 'bg-primary/10 text-primary',
  inactive_customer: 'bg-muted-foreground/15 text-muted-foreground',
  partner: 'bg-accent/15 text-accent',
  archived: 'bg-border text-muted-foreground',
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  blank: 'Note',
  meeting_brief: 'Meeting Brief',
  account_brief: 'Account Brief',
  follow_up_plan: 'Follow-up Plan',
  deal_review: 'Deal Review',
  call_prep: 'Call Prep',
};

const PROPOSAL_STATUS_BADGE: Record<string, string> = {
  draft: 'bg-surface-muted text-muted-foreground',
  sent: 'bg-primary/10 text-primary',
  accepted: 'bg-success/15 text-success',
  declined: 'bg-destructive/10 text-destructive',
  expired: 'bg-border text-muted-foreground',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RepAccountDetail({ account }: { account: RepAccountDetail }) {
  const openOpps = account.opportunities.filter(
    (o) => !['closed_won', 'closed_lost'].includes(o.stage),
  );
  const closedOpps = account.opportunities.filter((o) =>
    ['closed_won', 'closed_lost'].includes(o.stage),
  );

  return (
    <div className="space-y-6">

      {/* ── Account header card ── */}
      <TVCard className="space-y-5 rounded-[2rem] border-white/60 bg-white/90">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TVBadge
                className={cn(STATUS_BADGE[account.status] ?? 'bg-surface-muted text-muted-foreground')}
                variant="default"
              >
                {formatEnumLabel(account.status)}
              </TVBadge>
              {account.industry && (
                <TVBadge className="bg-surface-muted text-muted-foreground" variant="default">
                  {account.industry}
                </TVBadge>
              )}
            </div>
            <h2 className="text-2xl font-semibold text-foreground">{account.name}</h2>
            {account.description && (
              <p className="max-w-2xl text-sm text-muted-foreground">{account.description}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {account.domain && (
              <TVButton asChild size="sm" variant="secondary">
                <a href={`https://${account.domain}`} rel="noopener noreferrer" target="_blank">
                  <Globe className="mr-1.5 h-3.5 w-3.5" />
                  {account.domain}
                  <ExternalLink className="ml-1.5 h-3 w-3" />
                </a>
              </TVButton>
            )}
            <TVButton asChild size="sm" variant="secondary">
              <Link href={`/workspace/notes?account=${account.id}`}>
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Add Note
              </Link>
            </TVButton>
          </div>
        </div>

        {account.hqLocation && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            {account.hqLocation}
          </p>
        )}

        {/* Stats row */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-primary/5 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Open pipeline</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {formatCompactCurrency(account.openPipelineValueCents)}
            </p>
            <p className="text-xs text-muted-foreground">{account.openDealCount} open {account.openDealCount === 1 ? 'deal' : 'deals'}</p>
          </div>
          <div className="rounded-xl border bg-success/5 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Closed won</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {formatCompactCurrency(account.closedWonValueCents)}
            </p>
            <p className="text-xs text-muted-foreground">{closedOpps.filter(o => o.stage === 'closed_won').length} won deals</p>
          </div>
          <div className="rounded-xl border bg-surface-muted/60 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Contacts</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{account.contacts.length}</p>
            <p className="text-xs text-muted-foreground">
              {account.proposals.length} {account.proposals.length === 1 ? 'proposal' : 'proposals'}
            </p>
          </div>
        </div>
      </TVCard>

      {/* ── Main content grid ── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">

        {/* Contacts */}
        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div className="flex items-center justify-between gap-3">
            <div>
              <TVCardTitle>Contacts</TVCardTitle>
              <TVCardDescription>Leads linked to this account.</TVCardDescription>
            </div>
            <TVBadge className="bg-primary/10 text-primary" variant="default">
              <Users className="mr-1 h-3 w-3" />
              {account.contacts.length}
            </TVBadge>
          </div>
          {account.contacts.length > 0 ? (
            <div className="space-y-2">
              {account.contacts.map((contact) => (
                <Link
                  key={contact.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-surface-muted/60 px-4 py-3 transition-colors hover:border-primary/20 hover:bg-white"
                  href={`/workspace/leads/${contact.leadId}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {contact.firstName} {contact.lastName}
                      {contact.isPrimary && (
                        <span className="ml-2 text-xs font-normal text-primary">Primary</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{contact.email}</p>
                  </div>
                  {contact.relationshipLabel && (
                    <TVBadge className="shrink-0 bg-surface-muted text-muted-foreground text-xs" variant="default">
                      {contact.relationshipLabel}
                    </TVBadge>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed bg-surface-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
              No contacts linked yet.
            </div>
          )}
        </TVCard>

        {/* Open Opportunities */}
        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div className="flex items-center justify-between gap-3">
            <div>
              <TVCardTitle>Open deals</TVCardTitle>
              <TVCardDescription>Active pipeline for this account.</TVCardDescription>
            </div>
            <TVBadge className="bg-success/15 text-success" variant="default">
              <TrendingUp className="mr-1 h-3 w-3" />
              {openOpps.length}
            </TVBadge>
          </div>
          {openOpps.length > 0 ? (
            <div className="space-y-2">
              {openOpps.map((opp) => (
                <Link
                  key={opp.id}
                  className="flex items-start justify-between gap-3 rounded-xl border bg-surface-muted/60 px-4 py-3 transition-colors hover:border-primary/20 hover:bg-white"
                  href={`/workspace/opportunities?account=${account.id}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{opp.name}</p>
                    {opp.primaryLead && (
                      <p className="text-xs text-muted-foreground">
                        {opp.primaryLead.firstName} {opp.primaryLead.lastName}
                      </p>
                    )}
                    {opp.targetCloseDate && (
                      <p className="text-xs text-muted-foreground">
                        Target: {formatDate(opp.targetCloseDate)}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 space-y-1 text-right">
                    <TVBadge
                      className={cn(STAGE_BADGE[opp.stage] ?? 'bg-surface-muted text-muted-foreground')}
                      variant="default"
                    >
                      {STAGE_LABELS[opp.stage] ?? opp.stage}
                    </TVBadge>
                    {opp.amountCents !== null && (
                      <p className="text-xs font-medium text-foreground">
                        {formatCompactCurrency(opp.amountCents)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed bg-surface-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
              No open deals. Create one from the{' '}
              <Link className="text-primary hover:underline" href="/workspace/opportunities">
                Pipeline workspace
              </Link>
              .
            </div>
          )}
        </TVCard>
      </div>

      {/* ── Notes + Proposals ── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">

        {/* Recent notes */}
        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div className="flex items-center justify-between gap-4">
            <div>
              <TVCardTitle>Notes</TVCardTitle>
              <TVCardDescription>Recent notes linked to this account.</TVCardDescription>
            </div>
            <TVButton asChild size="sm" variant="secondary">
              <Link href="/workspace/notes">View all</Link>
            </TVButton>
          </div>
          {account.notes.length > 0 ? (
            <div className="space-y-2">
              {account.notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border bg-surface-muted/60 px-4 py-3 space-y-1.5"
                >
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
              and link it to this account.
            </div>
          )}
        </TVCard>

        {/* Proposals */}
        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div className="flex items-center justify-between gap-4">
            <div>
              <TVCardTitle>Proposals</TVCardTitle>
              <TVCardDescription>All proposals created for this account.</TVCardDescription>
            </div>
            <TVButton asChild size="sm" variant="ghost">
              <Link href="/workspace/proposals/new">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                New proposal
              </Link>
            </TVButton>
          </div>
          {account.proposals.length > 0 ? (
            <div className="space-y-2">
              {account.proposals.map((proposal) => (
                <Link
                  key={proposal.id}
                  className="flex items-start justify-between gap-3 rounded-xl border bg-surface-muted/60 px-4 py-3 transition-colors hover:border-primary/20 hover:bg-white"
                  href={`/workspace/proposals/${proposal.id}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{proposal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {proposal.sentAt ? `Sent ${formatDate(proposal.sentAt)}` : `Created ${formatDate(proposal.createdAt)}`}
                    </p>
                  </div>
                  <div className="shrink-0 space-y-1 text-right">
                    <TVBadge
                      className={cn(PROPOSAL_STATUS_BADGE[proposal.status] ?? 'bg-surface-muted text-muted-foreground')}
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

      {/* ── Closed deals (collapsed) ── */}
      {closedOpps.length > 0 && (
        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div>
            <TVCardTitle>Closed deals</TVCardTitle>
            <TVCardDescription>Won and lost opportunities for this account.</TVCardDescription>
          </div>
          <div className="space-y-2">
            {closedOpps.map((opp) => (
              <div
                key={opp.id}
                className="flex items-center justify-between gap-3 rounded-xl border bg-surface-muted/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{opp.name}</p>
                  {opp.closeDate && (
                    <p className="text-xs text-muted-foreground">Closed {formatDate(opp.closeDate)}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {opp.amountCents !== null && (
                    <span className="text-sm font-medium text-foreground">
                      {formatCompactCurrency(opp.amountCents)}
                    </span>
                  )}
                  <TVBadge
                    className={cn(STAGE_BADGE[opp.stage] ?? 'bg-surface-muted text-muted-foreground')}
                    variant="default"
                  >
                    {STAGE_LABELS[opp.stage] ?? opp.stage}
                  </TVBadge>
                </div>
              </div>
            ))}
          </div>
        </TVCard>
      )}
    </div>
  );
}
