import { ConnectedProvider, ConnectionStatus } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockUpdateConnectedAccountTokens = vi.fn();
const mockUpsertConnectedAccount = vi.fn();
const mockGenerateAuthUrl = vi.fn();
const mockGetToken = vi.fn();
const mockSetCredentials = vi.fn();
const mockRefreshAccessToken = vi.fn();

vi.mock('./connected-account-service', () => ({
  updateConnectedAccountTokens: (...args: unknown[]) =>
    mockUpdateConnectedAccountTokens(...args),
  upsertConnectedAccount: (...args: unknown[]) => mockUpsertConnectedAccount(...args),
}));

vi.mock('./google-client-factory', () => ({
  GoogleClientFactory: {
    createOAuthClient: () => ({
      generateAuthUrl: mockGenerateAuthUrl,
      getToken: mockGetToken,
      setCredentials: mockSetCredentials,
      refreshAccessToken: mockRefreshAccessToken,
    }),
  },
}));

import { GoogleAuthService } from './google-auth-service';

describe('GoogleAuthService', () => {
  const env = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI,
  };

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
    process.env.GOOGLE_OAUTH_REDIRECT_URI =
      'http://localhost:3000/api/integrations/google/callback';
    mockUpdateConnectedAccountTokens.mockReset();
    mockUpsertConnectedAccount.mockReset();
    mockGenerateAuthUrl.mockReset();
    mockGetToken.mockReset();
    mockSetCredentials.mockReset();
    mockRefreshAccessToken.mockReset();
  });

  afterEach(() => {
    process.env.GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
    process.env.GOOGLE_OAUTH_REDIRECT_URI = env.GOOGLE_OAUTH_REDIRECT_URI;
    vi.restoreAllMocks();
  });

  it('builds an incremental authorization URL for workspace scopes', () => {
    mockGenerateAuthUrl.mockReturnValue(
      'https://accounts.google.com/o/oauth2/v2/auth?scope=openid',
    );

    const url = GoogleAuthService.getAuthorizationUrl({
      userId: 'user_1',
      scopeSet: 'calendar',
    });

    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth?');
    expect(mockGenerateAuthUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        access_type: 'offline',
        include_granted_scopes: true,
        scope: expect.arrayContaining([
          'openid',
          'https://www.googleapis.com/auth/calendar.events',
        ]),
      }),
    );
  });

  it('refreshes access tokens and persists the updated expiry', async () => {
    mockRefreshAccessToken.mockResolvedValue({
      credentials: {
        access_token: 'refreshed-access-token',
        expiry_date: Date.now() + 3_600_000,
        scope: 'scope:a scope:b',
      },
    });

    const payload = await GoogleAuthService.refreshAccessToken(
      'connected_account_1',
      'refresh-token',
    );

    expect(payload.access_token).toBe('refreshed-access-token');
    expect(mockUpdateConnectedAccountTokens).toHaveBeenCalledWith(
      'connected_account_1',
      expect.objectContaining({
        accessToken: 'refreshed-access-token',
        scopes: ['scope:a', 'scope:b'],
        accessTokenExpiresAt: expect.any(Date),
      }),
    );
  });

  it('maps incremental Google scopes to provider-specific connected accounts', async () => {
    mockGetToken.mockResolvedValue({
      tokens: {
        access_token: 'workspace-token',
        refresh_token: 'workspace-refresh',
        expiry_date: Date.now() + 1_800_000,
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
        token_type: 'Bearer',
      },
    });

    await GoogleAuthService.connectWorkspaceAccount({
      userId: 'user_1',
      code: 'auth-code',
      state: Buffer.from(
        JSON.stringify({
          userId: 'user_1',
          scopeSet: 'gmail',
        }),
      ).toString('base64url'),
    });

    expect(mockUpsertConnectedAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        provider: ConnectedProvider.google_gmail,
        connectionStatus: ConnectionStatus.connected,
        syncEnabled: true,
        scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      }),
    );
  });
});
