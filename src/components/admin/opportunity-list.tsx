import Link from 'next/link';

import { TVBadge, TVCard, TVCardDescription, TVCardTitle } from '@/components/trainovations';

function formatCurrency(amountCents: number | null, currency: string) {
  if (amountCents == null) {
    return 'Amount pending';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function formatDate(value: Date | null) {
  if (!value) {
    return 'Date pending';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

export function OpportunityList({
  opportunities,
}: {
  opportunities: Array<{
    id: string;
    name: string;
    stage: string;
    amountCents: number | null;
    currency: string;
    targetCloseDate: Date | null;
    ownerRepProfile: { displayName: string } | null;
    account: {
      id: string;
      name: string;
      status: string;
    };
    primaryLead: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  }>;
}) {
  return (
    <div className="space-y-4">
      {opportunities.length ? (
        opportunities.map((opportunity) => (
          <TVCard key={opportunity.id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <TVCardTitle>{opportunity.name}</TVCardTitle>
                <TVCardDescription className="mt-2">
                  {opportunity.account.name} • {formatCurrency(opportunity.amountCents, opportunity.currency)}
                </TVCardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <TVBadge variant="accent">{opportunity.stage.replace('_', ' ')}</TVBadge>
                <TVBadge>{opportunity.ownerRepProfile?.displayName ?? 'Unassigned'}</TVBadge>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-surface-muted px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Account
                </p>
                <Link
                  className="mt-2 block text-sm font-medium text-foreground hover:text-primary transition-colors"
                  href={`/admin/accounts/${opportunity.account.id}`}
                >
                  {opportunity.account.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {opportunity.account.status.replace('_', ' ')}
                </p>
              </div>
              <div className="rounded-lg border bg-surface-muted px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Primary contact
                </p>
                {opportunity.primaryLead ? (
                  <>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {opportunity.primaryLead.firstName} {opportunity.primaryLead.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {opportunity.primaryLead.email}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No primary contact linked yet.
                  </p>
                )}
              </div>
              <div className="rounded-lg border bg-surface-muted px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Target close
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatDate(opportunity.targetCloseDate)}
                </p>
              </div>
            </div>

            {opportunity.primaryLead ? (
              <Link
                className="text-sm font-medium text-primary hover:underline"
                href={`/admin/leads/${opportunity.primaryLead.id}`}
              >
                Open linked contact
              </Link>
            ) : null}
          </TVCard>
        ))
      ) : (
        <TVCard>
          <TVCardDescription>
            No opportunities matched the current scope or filters.
          </TVCardDescription>
        </TVCard>
      )}
    </div>
  );
}
