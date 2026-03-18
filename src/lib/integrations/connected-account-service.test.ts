import {
  ConnectedProvider,
  ConnectionStatus,
} from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import {
  disconnectConnectedAccount,
  getConnectedAccountsForUser,
  updateConnectedAccountTokens,
  upsertConnectedAccount,
} from './connected-account-service';

describe('connected account service', () => {
  it('upserts a connected account with provider metadata', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 'account_1' });

    const result = await upsertConnectedAccount(
      {
        userId: 'user_1',
        provider: ConnectedProvider.google_gmail,
        providerAccountId: 'google-account-1',
        accountEmail: 'rep@trainovations.com',
        accessToken: 'access-token',
        scopes: ['gmail.readonly'],
        providerMetadata: {
          incrementalAuth: true,
        },
      },
      {
        connectedAccount: {
          upsert,
        } as never,
      },
    );

    expect(result).toEqual({ id: 'account_1' });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0]?.[0]).toMatchObject({
      where: {
        userId_provider: {
          userId: 'user_1',
          provider: ConnectedProvider.google_gmail,
        },
      },
      create: {
        providerAccountId: 'google-account-1',
        accountEmail: 'rep@trainovations.com',
        connectionStatus: ConnectionStatus.connected,
      },
      update: {
        scopes: ['gmail.readonly'],
      },
    });
  });

  it('updates tokens and marks the connection as active', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'account_1' });

    await updateConnectedAccountTokens(
      'account_1',
      {
        accessToken: 'new-token',
        refreshToken: 'refresh-token',
        scopes: ['scope:a', 'scope:b'],
      },
      {
        connectedAccount: {
          update,
        } as never,
      },
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 'account_1' },
      data: expect.objectContaining({
        accessToken: 'new-token',
        refreshToken: 'refresh-token',
        scopes: ['scope:a', 'scope:b'],
        connectionStatus: ConnectionStatus.connected,
        lastRefreshedAt: expect.any(Date),
      }),
    });
  });

  it('disconnects a provider and disables sync settings', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'account_1' });

    await disconnectConnectedAccount(
      'user_1',
      ConnectedProvider.zoom,
      {
        connectedAccount: {
          update,
        } as never,
      },
    );

    expect(update).toHaveBeenCalledWith({
      where: {
        userId_provider: {
          userId: 'user_1',
          provider: ConnectedProvider.zoom,
        },
      },
      data: {
        connectionStatus: ConnectionStatus.disconnected,
        accessToken: null,
        refreshToken: null,
        syncEnabled: false,
        automationEnabled: false,
      },
    });
  });

  it('returns accounts sorted by provider', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'account_1' }]);

    const result = await getConnectedAccountsForUser('user_1', {
      connectedAccount: {
        findMany,
      } as never,
    });

    expect(result).toEqual([{ id: 'account_1' }]);
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: 'user_1' },
      orderBy: {
        provider: 'asc',
      },
    });
  });
});
