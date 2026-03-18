import { ConnectedProvider } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  requireAuthenticatedUser,
  getConnectedAccountsForUser,
  getProviderSummaries,
  getZoomSummary,
  getNotionSummary,
  getLinkedInSummary,
  disconnectConnectedAccount,
  update,
} = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  getConnectedAccountsForUser: vi.fn(),
  getProviderSummaries: vi.fn(),
  getZoomSummary: vi.fn(),
  getNotionSummary: vi.fn(),
  getLinkedInSummary: vi.fn(),
  disconnectConnectedAccount: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  requireAuthenticatedUser,
}));

vi.mock('@/lib/integrations', () => ({
  canAccessIntegrationSettings: () => true,
  getConnectedAccountsForUser,
  GoogleAuthService: {
    getProviderSummaries,
  },
  ZoomService: {
    getProviderSummary: getZoomSummary,
  },
  NotionSyncService: {
    getProviderSummary: getNotionSummary,
  },
  LinkedInService: {
    getProviderSummary: getLinkedInSummary,
  },
  disconnectConnectedAccount,
}));

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: () => ({
    connectedAccount: {
      update,
    },
  }),
}));

import { DELETE, GET, PATCH } from './route';

describe('/api/settings/integrations', () => {
  beforeEach(() => {
    requireAuthenticatedUser.mockResolvedValue({
      id: 'user_1',
      role: 'sales_rep',
    });
    getConnectedAccountsForUser.mockResolvedValue([
      {
        provider: ConnectedProvider.google_gmail,
        accountEmail: 'jay@trainovations.com',
      },
    ]);
    getProviderSummaries.mockResolvedValue([
      {
        provider: ConnectedProvider.google_gmail,
        label: 'Google Gmail',
        status: 'connected',
        scopes: ['gmail.readonly'],
        syncEnabled: true,
        automationEnabled: false,
        lastSyncedAt: new Date('2026-03-13T12:00:00.000Z'),
      },
    ]);
    getZoomSummary.mockResolvedValue({
      provider: ConnectedProvider.zoom,
      label: 'Zoom',
      status: 'disconnected',
      scopes: [],
      syncEnabled: false,
      automationEnabled: false,
      lastSyncedAt: null,
    });
    getNotionSummary.mockResolvedValue({
      provider: ConnectedProvider.notion,
      label: 'Notion',
      status: 'disconnected',
      scopes: [],
      syncEnabled: false,
      automationEnabled: false,
      lastSyncedAt: null,
    });
    getLinkedInSummary.mockResolvedValue({
      provider: ConnectedProvider.linkedin,
      label: 'LinkedIn',
      status: 'disconnected',
      scopes: [],
      syncEnabled: false,
      automationEnabled: false,
      lastSyncedAt: null,
    });
    update.mockResolvedValue({
      id: 'acc_1',
      createdAt: new Date('2026-03-13T12:00:00.000Z'),
      updatedAt: new Date('2026-03-13T12:00:00.000Z'),
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      lastRefreshedAt: null,
      lastSyncedAt: null,
      provider: ConnectedProvider.google_gmail,
    });
  });

  it('returns integration summaries for the authenticated user', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(payload.summaries).toHaveLength(4);
    expect(payload.accounts[0].accountEmail).toBe('jay@trainovations.com');
  });

  it('updates integration preferences', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/settings/integrations', {
        method: 'PATCH',
        body: JSON.stringify({
          provider: ConnectedProvider.google_gmail,
          syncEnabled: true,
          automationEnabled: true,
        }),
      }),
    );

    expect(update).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('disconnects a provider', async () => {
    const response = await DELETE(
      new Request(
        'http://localhost/api/settings/integrations?provider=google_gmail',
      ),
    );

    expect(disconnectConnectedAccount).toHaveBeenCalledWith(
      'user_1',
      ConnectedProvider.google_gmail,
    );
    expect(response.status).toBe(200);
  });
});
