import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QueryProvider } from '@/components/providers/query-provider';

import { IntegrationSettingsClient } from './integration-settings-client';

describe('IntegrationSettingsClient', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes('/api/settings/integrations') && (!init || init.method === undefined)) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                accounts: [
                  {
                    provider: 'google_gmail',
                    accountEmail: 'jay@trainovations.com',
                  },
                ],
                summaries: [
                  {
                    provider: 'google_gmail',
                    label: 'Google Gmail',
                    status: 'connected',
                    scopes: ['gmail.readonly'],
                    syncEnabled: true,
                    automationEnabled: false,
                    lastSyncedAt: '2026-03-13T12:00:00.000Z',
                  },
                ],
              }),
            ),
          );
        }

        return Promise.resolve(new Response(JSON.stringify({ ok: true })));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads integration settings through React Query and performs mutations', async () => {
    const user = userEvent.setup();

    render(
      <QueryProvider>
        <IntegrationSettingsClient userId="user_1" />
      </QueryProvider>,
    );

    expect(await screen.findByText('Google Gmail')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/settings/integrations',
        expect.objectContaining({
          method: 'PATCH',
        }),
      );
    });

    await user.click(screen.getByRole('button', { name: /disconnect/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/settings/integrations?provider=google_gmail',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });
  });
});
