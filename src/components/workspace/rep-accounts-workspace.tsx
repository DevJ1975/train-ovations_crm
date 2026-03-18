'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, ExternalLink, MapPin, Search, Users } from 'lucide-react';

import {
  TVBadge,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVEmptyState,
} from '@/components/trainovations';
import { formatCompactCurrency } from '@/lib/format';
import type { RepAccountItem } from '@/lib/services/workspace-service';

const statusLabel: Record<string, string> = {
  prospect: 'Prospect',
  active_customer: 'Active customer',
  inactive_customer: 'Inactive',
  partner: 'Partner',
  archived: 'Archived',
};

const statusTone: Record<string, string> = {
  prospect: 'bg-primary/10 text-primary',
  active_customer: 'bg-success/15 text-success',
  inactive_customer: 'bg-muted text-muted-foreground',
  partner: 'bg-accent/15 text-accent',
  archived: 'bg-muted text-muted-foreground',
};

const ALL_STATUSES = ['all', 'prospect', 'active_customer', 'inactive_customer', 'partner', 'archived'] as const;
const STATUS_FILTER_LABELS: Record<string, string> = {
  all: 'All',
  prospect: 'Prospects',
  active_customer: 'Active',
  inactive_customer: 'Inactive',
  partner: 'Partners',
  archived: 'Archived',
};

export function RepAccountsWorkspace({ accounts }: { accounts: RepAccountItem[] }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = accounts.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      a.name.toLowerCase().includes(q) ||
      (a.industry ?? '').toLowerCase().includes(q) ||
      (a.hqLocation ?? '').toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  if (accounts.length === 0) {
    return (
      <TVEmptyState
        title="No accounts yet"
        description="Accounts owned by your rep profile will appear here once they are created and assigned."
        icon={<Building2 className="h-8 w-8 text-muted-foreground" />}
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
            placeholder="Search accounts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_STATUSES.map((s) => (
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
        <TVEmptyState title="No accounts match your search." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountCard({ account }: { account: RepAccountItem }) {
  const primary = account.contacts.find((c) => c.isPrimary) ?? account.contacts[0] ?? null;
  const additionalCount = Math.max(0, account.contacts.length - 1);

  return (
    <TVCard className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link href={`/workspace/accounts/${account.id}`}>
            <TVCardTitle className="truncate transition-colors hover:text-primary">{account.name}</TVCardTitle>
          </Link>
          {account.domain ? (
            <a
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              href={`https://${account.domain}`}
              rel="noreferrer"
              target="_blank"
            >
              {account.domain}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
        <TVBadge className={statusTone[account.status] ?? ''} variant="default">
          {statusLabel[account.status] ?? account.status}
        </TVBadge>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        {account.industry ? (
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            {account.industry}
          </span>
        ) : null}
        {account.hqLocation ? (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {account.hqLocation}
          </span>
        ) : null}
      </div>

      {account.description ? (
        <TVCardDescription className="line-clamp-2">{account.description}</TVCardDescription>
      ) : null}

      <div className="mt-auto space-y-3 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {account.contacts.length} contact{account.contacts.length !== 1 ? 's' : ''}
            </span>
          </div>
          {account.openDealCount > 0 ? (
            <TVBadge className="bg-success/10 text-success" variant="default">
              {account.openDealCount} open deal{account.openDealCount !== 1 ? 's' : ''}
              {account.totalPipelineValueCents > 0
                ? ` · ${formatCompactCurrency(account.totalPipelineValueCents)}`
                : ''}
            </TVBadge>
          ) : (
            <TVBadge variant="default">No open deals</TVBadge>
          )}
        </div>

        {primary ? (
          <div className="rounded-xl border border-border/60 bg-surface-muted/50 px-3 py-2">
            <p className="text-xs font-medium text-foreground">
              {primary.firstName} {primary.lastName}
              {primary.isPrimary ? (
                <span className="ml-1.5 text-xs text-muted-foreground">(primary)</span>
              ) : null}
            </p>
            <p className="truncate text-xs text-muted-foreground">{primary.email}</p>
            {primary.relationshipLabel ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{primary.relationshipLabel}</p>
            ) : null}
            {additionalCount > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                +{additionalCount} more contact{additionalCount !== 1 ? 's' : ''}
              </p>
            ) : null}
          </div>
        ) : null}

        <Link
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          href={`/workspace/accounts/${account.id}`}
        >
          View account
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </TVCard>
  );
}
