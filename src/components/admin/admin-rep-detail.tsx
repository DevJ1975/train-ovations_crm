import Link from 'next/link';
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Shield,
  Target,
  TrendingUp,
  User,
  XCircle,
} from 'lucide-react';

import { TVBadge, TVCard, TVCardDescription, TVCardTitle } from '@/components/trainovations';
import { formatCompactCurrency, formatDate, formatEnumLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AdminRepDetailProfile } from '@/lib/services/admin-service';

// ─── Stage badge colours ──────────────────────────────────────────────────────

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

const LEAD_STATUS_BADGE: Record<string, string> = {
  new: 'bg-surface-muted text-muted-foreground',
  contacted: 'bg-primary/10 text-primary',
  qualified: 'bg-accent/15 text-accent',
  proposal: 'bg-accent/20 text-accent',
  won: 'bg-success/15 text-success',
  lost: 'bg-destructive/10 text-destructive',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminRepDetail({ rep }: { rep: AdminRepDetailProfile }) {
  const inviteStatus = rep.user.invitationAcceptedAt
    ? 'accepted'
    : rep.user.invitationSentAt
      ? 'pending'
      : 'not_invited';

  return (
    <div className="space-y-6">

      {/* ── Rep header ── */}
      <TVCard className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TVBadge
                className={rep.isActive ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive'}
                variant="default"
              >
                {rep.isActive ? 'Active' : 'Inactive'}
              </TVBadge>
              <TVBadge
                className={
                  inviteStatus === 'accepted'
                    ? 'bg-success/15 text-success'
                    : inviteStatus === 'pending'
                      ? 'bg-warning/15 text-warning-foreground'
                      : 'bg-surface-muted text-muted-foreground'
                }
                variant="default"
              >
                {inviteStatus === 'accepted'
                  ? 'Invite accepted'
                  : inviteStatus === 'pending'
                    ? 'Invite pending'
                    : 'Not invited'}
              </TVBadge>
              {rep.user.mustChangePassword && (
                <TVBadge className="bg-warning/15 text-warning-foreground" variant="default">
                  Password reset required
                </TVBadge>
              )}
            </div>
            <h2 className="text-2xl font-semibold text-foreground">{rep.displayName}</h2>
            <p className="text-muted-foreground">{rep.title}</p>
          </div>
          {rep.landingPages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {rep.landingPages.map((page) => (
                <Link
                  key={page.id}
                  className="flex items-center gap-1.5 rounded-lg border bg-surface-muted/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/20 hover:text-foreground"
                  href={`/rep/${page.slug}`}
                  target="_blank"
                >
                  <Globe className="h-3 w-3" />
                  {page.title}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Contact info grid */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-2 rounded-xl border bg-surface-muted/60 px-4 py-3">
            <Mail className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 truncate text-sm text-foreground">{rep.email}</span>
          </div>
          {rep.phone && (
            <div className="flex items-center gap-2 rounded-xl border bg-surface-muted/60 px-4 py-3">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm text-foreground">{rep.phone}</span>
            </div>
          )}
          {rep.location && (
            <div className="flex items-center gap-2 rounded-xl border bg-surface-muted/60 px-4 py-3">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm text-foreground">{rep.location}</span>
            </div>
          )}
          {rep.website && (
            <div className="flex items-center gap-2 rounded-xl border bg-surface-muted/60 px-4 py-3">
              <Globe className="h-4 w-4 shrink-0 text-primary" />
              <Link
                className="min-w-0 truncate text-sm text-primary hover:underline"
                href={rep.website}
                target="_blank"
              >
                {rep.website.replace(/^https?:\/\//, '')}
              </Link>
            </div>
          )}
        </div>

        {/* Bio */}
        {rep.bio && (
          <p className="rounded-xl border bg-surface-muted/60 px-4 py-3 text-sm text-muted-foreground">
            {rep.bio}
          </p>
        )}
      </TVCard>

      {/* ── Pipeline KPIs ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-primary/5 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Open pipeline</p>
            <TrendingUp className="h-4 w-4 text-primary opacity-50" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">
            {formatCompactCurrency(rep.pipelineValueCents)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{rep.openDealCount} open deals</p>
        </div>
        <div className="rounded-xl border bg-success/5 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Closed won</p>
            <DollarSign className="h-4 w-4 text-success opacity-50" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">
            {formatCompactCurrency(rep.closedWonValueCents)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Recent 10 opps</p>
        </div>
        <div className="rounded-xl border bg-surface-muted/60 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Total leads</p>
            <User className="h-4 w-4 opacity-50" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">{rep.leadCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">{rep.accountCount} accounts</p>
        </div>
        <div className="rounded-xl border bg-surface-muted/60 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Opportunities</p>
            <Target className="h-4 w-4 opacity-50" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">{rep.opportunityCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">Total in pipeline</p>
        </div>
      </div>

      {/* ── Leads + Accounts ── */}
      <div className="grid gap-6 xl:grid-cols-2">

        {/* Recent leads */}
        <TVCard className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <TVCardTitle>Recent leads</TVCardTitle>
              <TVCardDescription>Latest 10 leads owned by this rep.</TVCardDescription>
            </div>
            <Link
              className="text-xs text-primary hover:underline"
              href={`/admin/leads?rep=${rep.id}`}
            >
              View all
            </Link>
          </div>
          {rep.recentLeads.length > 0 ? (
            <div className="space-y-2">
              {rep.recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-surface-muted/60 px-4 py-3 transition-colors hover:border-primary/20 hover:bg-surface"
                  href={`/admin/leads/${lead.id}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
                  </div>
                  <TVBadge
                    className={cn(LEAD_STATUS_BADGE[lead.status] ?? 'bg-surface-muted text-muted-foreground')}
                    variant="default"
                  >
                    {formatEnumLabel(lead.status)}
                  </TVBadge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No leads yet.</p>
          )}
        </TVCard>

        {/* Recent accounts */}
        <TVCard className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <TVCardTitle>Recent accounts</TVCardTitle>
              <TVCardDescription>Latest 10 accounts owned by this rep.</TVCardDescription>
            </div>
            <Link
              className="text-xs text-primary hover:underline"
              href={`/admin/accounts?rep=${rep.id}`}
            >
              View all
            </Link>
          </div>
          {rep.recentAccounts.length > 0 ? (
            <div className="space-y-2">
              {rep.recentAccounts.map((account) => (
                <Link
                  key={account.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-surface-muted/60 px-4 py-3 transition-colors hover:border-primary/20 hover:bg-surface"
                  href={`/admin/accounts/${account.id}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
                      {account.industry && (
                        <p className="text-xs text-muted-foreground">{account.industry}</p>
                      )}
                    </div>
                  </div>
                  <TVBadge className="bg-surface-muted text-muted-foreground shrink-0" variant="default">
                    {formatEnumLabel(account.status)}
                  </TVBadge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No accounts yet.</p>
          )}
        </TVCard>
      </div>

      {/* ── Recent opportunities ── */}
      <TVCard className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <TVCardTitle>Recent opportunities</TVCardTitle>
            <TVCardDescription>Latest 10 deals in this rep&apos;s pipeline.</TVCardDescription>
          </div>
          <Link
            className="text-xs text-primary hover:underline"
            href={`/admin/opportunities?rep=${rep.id}`}
          >
            View all
          </Link>
        </div>
        {rep.recentOpportunities.length > 0 ? (
          <div className="space-y-2">
            {rep.recentOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="flex items-center justify-between gap-3 rounded-xl border bg-surface-muted/60 px-4 py-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium text-foreground">{opp.name}</p>
                  {opp.targetCloseDate && (
                    <p className="text-xs text-muted-foreground">
                      Close {formatDate(opp.targetCloseDate)}
                    </p>
                  )}
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
                    {STAGE_LABELS[opp.stage] ?? opp.stage}
                  </TVBadge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No opportunities yet.</p>
        )}
      </TVCard>

      {/* ── Account / auth context ── */}
      <TVCard className="space-y-4">
        <div>
          <TVCardTitle>Account &amp; auth context</TVCardTitle>
          <TVCardDescription>Login history, invite status, and manager assignment.</TVCardDescription>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border bg-surface-muted/60 px-4 py-3 space-y-1">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last login
            </p>
            <p className="text-sm font-medium text-foreground">
              {rep.user.lastLoginAt ? formatDate(rep.user.lastLoginAt) : 'Never'}
            </p>
          </div>
          <div className="rounded-xl border bg-surface-muted/60 px-4 py-3 space-y-1">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <Activity className="h-3 w-3" />
              Invite accepted
            </p>
            <p className="text-sm font-medium text-foreground">
              {rep.user.invitationAcceptedAt
                ? formatDate(rep.user.invitationAcceptedAt)
                : rep.user.invitationSentAt
                  ? `Sent ${formatDate(rep.user.invitationSentAt)}`
                  : 'Not invited'}
            </p>
          </div>
          <div className="rounded-xl border bg-surface-muted/60 px-4 py-3 space-y-1">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <Shield className="h-3 w-3" />
              Account status
            </p>
            <p className={cn('flex items-center gap-1.5 text-sm font-medium', rep.user.isActive ? 'text-success' : 'text-destructive')}>
              {rep.user.isActive
                ? <><CheckCircle2 className="h-3.5 w-3.5" /> Active</>
                : <><XCircle className="h-3.5 w-3.5" /> Deactivated</>}
            </p>
          </div>
          {rep.managerUser && (
            <div className="rounded-xl border bg-surface-muted/60 px-4 py-3 space-y-1">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Manager</p>
              <p className="text-sm font-medium text-foreground">
                {rep.managerUser.name ?? rep.managerUser.email}
              </p>
            </div>
          )}
          <div className="rounded-xl border bg-surface-muted/60 px-4 py-3 space-y-1">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Rep since</p>
            <p className="text-sm font-medium text-foreground">{formatDate(rep.createdAt)}</p>
          </div>
          <div className="rounded-xl border bg-surface-muted/60 px-4 py-3 space-y-1">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Slug</p>
            <p className="font-mono text-sm text-foreground">{rep.slug}</p>
          </div>
        </div>
      </TVCard>
    </div>
  );
}
