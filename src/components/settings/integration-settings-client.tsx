'use client';

import Link from 'next/link';
import { ConnectionStatus, ConnectedProvider } from '@prisma/client';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
} from '@/components/trainovations';
import {
  useDisconnectIntegrationMutation,
  useIntegrationSettingsQuery,
  useUpdateIntegrationPreferencesMutation,
} from '@/lib/query/integration-hooks';

const providerConnectLinks: Record<ConnectedProvider, string | null> = {
  google_auth: null,
  google_gmail: '/api/integrations/google/connect?scopeSet=gmail_compose',
  google_calendar: '/api/integrations/google/connect?scopeSet=calendar',
  google_drive: '/api/integrations/google/connect?scopeSet=drive',
  zoom: '/api/integrations/zoom/connect',
  notion: '/api/integrations/notion/connect',
  linkedin: '/api/integrations/linkedin/connect',
  microsoft_outlook:  '/api/integrations/microsoft/connect?scopeSet=outlook',
  microsoft_calendar: '/api/integrations/microsoft/connect?scopeSet=calendar',
  microsoft_teams:    '/api/integrations/microsoft/connect?scopeSet=teams',
};

function GoogleLogo() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24">
      <path
        d="M21.6 12.23c0-.73-.06-1.26-.19-1.82H12v3.48h5.53c-.11.86-.7 2.15-2.01 3.02l-.02.12 2.84 2.2.2.02c1.84-1.7 2.9-4.19 2.9-7.02Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.89 6.62-2.41l-3.15-2.44c-.84.59-1.97 1-3.47 1-2.64 0-4.87-1.74-5.67-4.15l-.11.01-2.95 2.29-.04.11C4.88 19.67 8.14 22 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.33 14c-.21-.59-.33-1.22-.33-1.87s.12-1.28.31-1.87l-.01-.13-2.99-2.33-.1.05A9.96 9.96 0 0 0 2 12.13c0 1.6.38 3.11 1.05 4.45L6.33 14Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.1c1.9 0 3.18.82 3.91 1.51l2.86-2.8C16.95 3.11 14.7 2 12 2 8.14 2 4.88 4.33 3.21 7.68l3.1 2.41C7.13 7.74 9.36 6.1 12 6.1Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function ZoomLogo() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="6" fill="#0B5CFF" />
      <path
        d="M7 8.75c0-.97.78-1.75 1.75-1.75h5.28c1.52 0 2.75 1.23 2.75 2.75v4.5c0 .97-.78 1.75-1.75 1.75H8.75A1.75 1.75 0 0 1 7 14.25v-5.5Zm10.22 1.34 2.44-1.73c.52-.37 1.24 0 .97.73a1.8 1.8 0 0 0-.12.65v4.51c0 .22.04.45.12.65.27.73-.45 1.1-.97.73l-2.44-1.73V10.1Z"
        fill="#fff"
      />
    </svg>
  );
}

function LinkedInLogo() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        d="M7.5 10h-2v7h2v-7Zm-1-1.1a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3ZM17 13.1c0-1.7-.9-3.1-2.6-3.1-.8 0-1.5.4-1.9 1v-.9H10.5v7H12.5v-3.6c0-.9.4-1.6 1.3-1.6.8 0 1.2.6 1.2 1.5V17H17v-3.9Z"
        fill="#fff"
      />
    </svg>
  );
}

function OutlookLogo() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#0078D4" />
      {/* Envelope back panel */}
      <rect x="11" y="7" width="10" height="10" rx="1" fill="#50D9FF" />
      {/* Envelope fold line */}
      <path d="M11 8l5 4 5-4" stroke="#0078D4" strokeWidth="1" fill="none" />
      {/* Outlook "O" circle overlay */}
      <rect x="3" y="8" width="9" height="9" rx="4.5" fill="#fff" />
      <rect x="5.5" y="10.5" width="4" height="4" rx="2" fill="#0078D4" />
    </svg>
  );
}

function CalendarLogo() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#0078D4" />
      {/* Calendar header */}
      <rect x="4" y="5" width="16" height="3" rx="1" fill="#fff" fillOpacity="0.3" />
      {/* Calendar body */}
      <rect x="4" y="9" width="16" height="10" rx="1" fill="#fff" />
      {/* Day number */}
      <text x="12" y="17" textAnchor="middle" fontSize="7" fontWeight="700" fill="#0078D4" fontFamily="system-ui">
        28
      </text>
      {/* Binding dots */}
      <circle cx="8.5" cy="5" r="1.2" fill="#fff" />
      <circle cx="15.5" cy="5" r="1.2" fill="#fff" />
    </svg>
  );
}

function TeamsLogo() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#6264A7" />
      {/* Primary person head */}
      <circle cx="13.5" cy="8" r="2.5" fill="#fff" />
      {/* Primary person body */}
      <path d="M8.5 19c0-2.76 2.24-5 5-5h0c2.76 0 5 2.24 5 5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Secondary person (smaller, behind) */}
      <circle cx="7.5" cy="9" r="1.8" fill="#fff" fillOpacity="0.6" />
      <path d="M4 19c0-2 1.57-3.5 3.5-3.5" stroke="#fff" strokeWidth="1.2" fill="none" strokeOpacity="0.6" strokeLinecap="round" />
    </svg>
  );
}

function ProviderLogo({ provider }: { provider: ConnectedProvider }) {
  if (provider === ConnectedProvider.zoom) {
    return <ZoomLogo />;
  }

  if (
    provider === ConnectedProvider.google_auth ||
    provider === ConnectedProvider.google_gmail ||
    provider === ConnectedProvider.google_calendar ||
    provider === ConnectedProvider.google_drive
  ) {
    return <GoogleLogo />;
  }

  if (provider === ConnectedProvider.linkedin) {
    return <LinkedInLogo />;
  }

  if (provider === ConnectedProvider.microsoft_outlook) return <OutlookLogo />;
  if (provider === ConnectedProvider.microsoft_calendar) return <CalendarLogo />;
  if (provider === ConnectedProvider.microsoft_teams) return <TeamsLogo />;

  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-surface-muted text-[10px] font-semibold uppercase text-muted-foreground">
      N
    </div>
  );
}

export function IntegrationSettingsClient({ userId }: { userId: string }) {
  const { data, isLoading, isError } = useIntegrationSettingsQuery(userId);
  const updateMutation = useUpdateIntegrationPreferencesMutation(userId);
  const disconnectMutation = useDisconnectIntegrationMutation(userId);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-surface p-6 text-sm text-muted-foreground">
        Loading connected tools...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-danger/30 bg-surface p-6 text-sm text-danger">
        We couldn&apos;t load integration settings right now.
      </div>
    );
  }

  const accountByProvider = new Map(
    data.accounts.map((account) => [account.provider, account]),
  );

  return (
    <div className="tv-stagger mt-8 grid gap-6">
      {data.summaries.map((summary) => {
        const account = accountByProvider.get(summary.provider);

        return (
          <TVCard key={summary.provider} className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <ProviderLogo provider={summary.provider} />
                  <TVCardTitle>{summary.label}</TVCardTitle>
                  <TVBadge
                    variant={
                      summary.status === ConnectionStatus.connected
                        ? 'success'
                        : summary.status === ConnectionStatus.error
                          ? 'accent'
                          : 'default'
                    }
                  >
                    {summary.status}
                  </TVBadge>
                </div>
                <TVCardDescription>
                  {summary.scopes.length
                    ? `Scopes: ${summary.scopes.join(', ')}`
                    : 'No scopes granted yet.'}
                </TVCardDescription>
              </div>

              <div className="flex gap-3">
                {providerConnectLinks[summary.provider] ? (
                  <TVButton asChild variant="secondary">
                    <Link href={providerConnectLinks[summary.provider] ?? '#'}>
                      Connect
                    </Link>
                  </TVButton>
                ) : (
                  <TVButton asChild variant="secondary">
                    <Link href="/login">Use Google Sign-In</Link>
                  </TVButton>
                )}

                {account ? (
                  <TVButton
                    onClick={() => disconnectMutation.mutate(summary.provider)}
                    type="button"
                    variant="ghost"
                  >
                    Disconnect
                  </TVButton>
                ) : null}
              </div>
            </div>

            <form
              className="flex flex-col gap-4 rounded-lg border bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between"
              onSubmit={(event) => {
                event.preventDefault();

                const form = new FormData(event.currentTarget);

                updateMutation.mutate({
                  provider: summary.provider,
                  syncEnabled: form.get('syncEnabled') === 'true',
                  automationEnabled: form.get('automationEnabled') === 'true',
                });
              }}
            >
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  {account?.accountEmail ?? 'No connected account email recorded yet.'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last sync:{' '}
                  {summary.lastSyncedAt
                    ? new Date(summary.lastSyncedAt).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    defaultChecked={summary.syncEnabled}
                    name="syncEnabled"
                    type="checkbox"
                    value="true"
                  />
                  Sync enabled
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    defaultChecked={summary.automationEnabled}
                    name="automationEnabled"
                    type="checkbox"
                    value="true"
                  />
                  Automation enabled
                </label>
                <TVButton type="submit">Save</TVButton>
              </div>
            </form>
          </TVCard>
        );
      })}
    </div>
  );
}
