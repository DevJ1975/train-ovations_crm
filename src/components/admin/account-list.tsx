import Link from 'next/link';

import { TVBadge, TVCard, TVCardDescription, TVCardTitle } from '@/components/trainovations';

function formatCurrency(amountCents: number | null) {
  if (amountCents == null) {
    return 'Amount pending';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export function AccountList({
  accounts,
}: {
  accounts: Array<{
    id: string;
    name: string;
    domain: string | null;
    industry: string | null;
    status: string;
    hqLocation: string | null;
    ownerRepProfile: { displayName: string } | null;
    contacts: Array<{
      id: string;
      relationshipLabel: string | null;
      isPrimary: boolean;
      lead: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    }>;
    opportunities: Array<{
      id: string;
      name: string;
      stage: string;
      amountCents: number | null;
    }>;
  }>;
}) {
  return (
    <div className="space-y-4">
      {accounts.length ? (
        accounts.map((account) => {
          const primaryContact = account.contacts.find((contact) => contact.isPrimary) ?? account.contacts[0];
          const latestOpportunity = account.opportunities[0];

          return (
            <TVCard key={account.id} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link className="hover:text-primary transition-colors" href={`/admin/accounts/${account.id}`}>
                    <TVCardTitle>{account.name}</TVCardTitle>
                  </Link>
                  <TVCardDescription className="mt-2">
                    {[account.industry, account.domain, account.hqLocation]
                      .filter(Boolean)
                      .join(' • ') || 'Account profile in progress.'}
                  </TVCardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <TVBadge variant="primary">{account.status.replace('_', ' ')}</TVBadge>
                  <TVBadge>{account.ownerRepProfile?.displayName ?? 'Unassigned'}</TVBadge>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-surface-muted px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Primary contact
                  </p>
                  {primaryContact ? (
                    <>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {primaryContact.lead.firstName} {primaryContact.lead.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {primaryContact.relationshipLabel ?? 'Relationship pending'} • {primaryContact.lead.email}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No contacts have been linked to this account yet.
                    </p>
                  )}
                </div>
                <div className="rounded-lg border bg-surface-muted px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Pipeline snapshot
                  </p>
                  {latestOpportunity ? (
                    <>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {latestOpportunity.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {latestOpportunity.stage.replace('_', ' ')} • {formatCurrency(latestOpportunity.amountCents)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No opportunities are linked to this account yet.
                    </p>
                  )}
                </div>
              </div>

              {primaryContact ? (
                <div className="flex flex-wrap gap-3">
                  <Link
                    className="text-sm font-medium text-primary hover:underline"
                    href={`/admin/leads/${primaryContact.lead.id}`}
                  >
                    Open primary contact
                  </Link>
                </div>
              ) : null}
            </TVCard>
          );
        })
      ) : (
        <TVCard>
          <TVCardDescription>
            No accounts matched the current scope or filters.
          </TVCardDescription>
        </TVCard>
      )}
    </div>
  );
}
