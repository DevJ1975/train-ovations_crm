import Link from 'next/link';
import {
  Building2,
  DollarSign,
  FileText,
  Globe,
  MapPin,
  Target,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';

import { TVBadge, TVCard, TVCardDescription, TVCardTitle } from '@/components/trainovations';
import { formatCompactCurrency, formatDate, formatEnumLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AdminAccountDetail } from '@/lib/services/admin-service';

// ─── Stage badge colours ───────────────────────────────────────────────────────

const STAGE_BADGE: Record<string, string> = {
  prospecting: 'bg-surface-muted text-muted-foreground',
  discovery: 'bg-primary/10 text-primary',
  demo: 'bg-accent/15 text-accent',
  proposal: 'bg-accent/20 text-accent',
  negotiation: 'bg-warning/15 text-warning-foreground',
  closed_won: 'bg-success/15 text-success',
  closed_lost: 'bg-destructive/10 text-destructive',
};

const LEAD_STATUS_BADGE: Record<string, string> = {
  new: 'bg-surface-muted text-muted-foreground',
  contacted: 'bg-primary/10 text-primary',
  qualified: 'bg-accent/15 text-accent',
  proposal: 'bg-accent/20 text-accent',
  won: 'bg-success/15 text-success',
  lost: 'bg-destructive/10 text-destructive',
};

const ACCOUNT_STATUS_BADGE: Record<string, string> = {
  prospect: 'bg-surface-muted text-muted-foreground',
  active_customer: 'bg-success/15 text-success',
  churned: 'bg-destructive/10 text-destructive',
  at_risk: 'bg-warning/15 text-warning-foreground',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function AdminAccountDetail({ account }: { account: AdminAccountDetail }) {
  return (
    <div className="space-y-6">

      {/* ── Account header ── */}
      <TVCard className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TVBadge
                className={cn(ACCOUNT_STATUS_BADGE[account.status] ?? 'bg-surface-muted text-muted-foreground')}
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
            {account.domain && (
              <p className="text-sm text-muted-foreground">{account.domain}</p>
            )}
          </div>
          {account.ownerRepProfile && (
            <Link
              className="flex items-center gap-1.5 rounded-lg border bg-surface-muted/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/20 hover:text-foreground"
              href={`/admin/reps/${account.ownerRepProfile.id}`}
            >
              <User className="h-3 w-3" />
              {account.ownerRepProfile.displayName}
            </Link>
          )}
        </div>

        {/* Location / domain info row */}
        {(account.hqLocation || account.domain) && (
          <div className="flex flex-wrap gap-3">
            {account.hqLocation && (
              <div className="flex items-center gap-2 rounded-xl border bg-surface-muted/60 px-4 py-3">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm text-foreground">{account.hqLocation}</span>
              </div>
            )}
            {account.domain && (
              <div className="flex items-center gap-2 rounded-xl border bg-surface-muted/60 px-4 py-3">
                <Globe className="h-4 w-4 shrink-0 text-primary" />
                <Link
                  className="min-w-0 truncate text-sm text-primary hover:underline"
                  href={`https://${account.domain}`}
                  target="_blank"
                >
                  {account.domain}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {account.description && (
          <p className="rounded-xl border bg-surface-muted/60 px-4 py-3 text-sm text-muted-foreground">
            {account.description}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Created {formatDate(account.createdAt)} · Last updated {formatDate(account.updatedAt)}
        </p>
      </TVCard>

      {/* ── Pipeline KPIs ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-primary/5 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Open pipeline</p>
            <TrendingUp className="h-4 w-4 text-primary opacity-50" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">
            {formatCompactCurrency(account.pipelineValueCents)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {account.opportunities.filter((o) => o.stage !== 'closed_won' && o.stage !== 'closed_lost').length} open deals
          </p>
        </div>
        <div className="rounded-xl border bg-success/5 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Closed won</p>
            <DollarSign className="h-4 w-4 text-success opacity-50" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">
            {formatCompactCurrency(account.closedWonValueCents)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {account.opportunities.filter((o) => o.stage === 'closed_won').length} won deals
          </p>
        </div>
        <div className="rounded-xl border bg-surface-muted/60 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Contacts</p>
            <Users className="h-4 w-4 opacity-50" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">{account.contactCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">linked leads</p>
        </div>
        <div className="rounded-xl border bg-surface-muted/60 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Opportunities</p>
            <Target className="h-4 w-4 opacity-50" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">{account.opportunityCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">total deals</p>
        </div>
      </div>

      {/* ── Contacts + Opportunities ── */}
      <div className="grid gap-6 xl:grid-cols-2">

        {/* Contacts */}
        <TVCard className="space-y-4">
          <div>
            <TVCardTitle>Contacts</TVCardTitle>
            <TVCardDescription>All leads linked to this account.</TVCardDescription>
          </div>
          {account.contacts.length > 0 ? (
            <div className="space-y-2">
              {account.contacts.map((contact) => (
                <Link
                  key={contact.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-surface-muted/60 px-4 py-3 transition-colors hover:border-primary/20 hover:bg-surface"
                  href={`/admin/leads/${contact.lead.id}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {contact.lead.firstName} {contact.lead.lastName}
                      </p>
                      {contact.isPrimary && (
                        <TVBadge className="bg-primary/10 text-primary shrink-0" variant="default">
                          Primary
                        </TVBadge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {contact.lead.email}
                      {contact.relationshipLabel ? ` · ${contact.relationshipLabel}` : ''}
                    </p>
                  </div>
                  <TVBadge
                    className={cn(LEAD_STATUS_BADGE[contact.lead.status] ?? 'bg-surface-muted text-muted-foreground', 'shrink-0')}
                    variant="default"
                  >
                    {formatEnumLabel(contact.lead.status)}
                  </TVBadge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No contacts linked to this account.</p>
          )}
        </TVCard>

        {/* Opportunities */}
        <TVCard className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <TVCardTitle>Opportunities</TVCardTitle>
              <TVCardDescription>All deals tied to this account.</TVCardDescription>
            </div>
            <Link
              className="text-xs text-primary hover:underline"
              href={`/admin/opportunities`}
            >
              View all
            </Link>
          </div>
          {account.opportunities.length > 0 ? (
            <div className="space-y-2">
              {account.opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-surface-muted/60 px-4 py-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-medium text-foreground">{opp.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {opp.ownerRepProfile?.displayName ?? 'Unassigned'}
                      {opp.targetCloseDate ? ` · Close ${formatDate(opp.targetCloseDate)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {opp.amountCents !== null && (
                      <span className="text-sm font-medium text-foreground">
                        {formatCompactCurrency(opp.amountCents)}
                      </span>
                    )}
                    <TVBadge
                      className={cn(STAGE_BADGE[opp.stage] ?? 'bg-surface-muted text-muted-foreground')}
                      variant="default"
                    >
                      {formatEnumLabel(opp.stage)}
                    </TVBadge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No opportunities yet.</p>
          )}
        </TVCard>
      </div>

      {/* ── Rep notes ── */}
      {account.recentNotes.length > 0 && (
        <TVCard className="space-y-4">
          <div>
            <TVCardTitle>Rep notes</TVCardTitle>
            <TVCardDescription>Most recent notes logged against this account.</TVCardDescription>
          </div>
          <div className="space-y-3">
            {account.recentNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-xl border bg-surface-muted/60 px-4 py-3 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {note.title ? (
                      <p className="text-sm font-medium text-foreground">{note.title}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        {formatEnumLabel(note.templateType)} note
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                    {note.repProfile && (
                      <span>{note.repProfile.displayName}</span>
                    )}
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{note.body}</p>
              </div>
            ))}
          </div>
        </TVCard>
      )}

      {/* ── Account meta ── */}
      <TVCard className="space-y-4">
        <div>
          <TVCardTitle>Account details</TVCardTitle>
          <TVCardDescription>Ownership, industry classification, and timeline.</TVCardDescription>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border bg-surface-muted/60 px-4 py-3 space-y-1">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Owner</p>
            {account.ownerRepProfile ? (
              <Link
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                href={`/admin/reps/${account.ownerRepProfile.id}`}
              >
                <Building2 className="h-3.5 w-3.5" />
                {account.ownerRepProfile.displayName}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Unassigned</p>
            )}
          </div>
          {account.industry && (
            <div className="rounded-xl border bg-surface-muted/60 px-4 py-3 space-y-1">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Industry</p>
              <p className="text-sm font-medium text-foreground">{account.industry}</p>
            </div>
          )}
          {account.hqLocation && (
            <div className="rounded-xl border bg-surface-muted/60 px-4 py-3 space-y-1">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">HQ location</p>
              <p className="text-sm font-medium text-foreground">{account.hqLocation}</p>
            </div>
          )}
          <div className="rounded-xl border bg-surface-muted/60 px-4 py-3 space-y-1">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Created</p>
            <p className="text-sm font-medium text-foreground">{formatDate(account.createdAt)}</p>
          </div>
          <div className="rounded-xl border bg-surface-muted/60 px-4 py-3 space-y-1">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Last updated</p>
            <p className="text-sm font-medium text-foreground">{formatDate(account.updatedAt)}</p>
          </div>
        </div>
      </TVCard>
    </div>
  );
}
