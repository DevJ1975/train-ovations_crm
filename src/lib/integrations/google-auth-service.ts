import { ConnectedProvider, ConnectionStatus } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';

import { GoogleClientFactory } from './google-client-factory';
import {
  type GoogleScopeSet,
  type ProviderConnectionSummary,
} from './types';
import {
  updateConnectedAccountTokens,
  upsertConnectedAccount,
} from './connected-account-service';

const GOOGLE_SCOPE_MAP: Record<GoogleScopeSet, string[]> = {
  basic: ['openid', 'email', 'profile'],
  gmail: ['https://www.googleapis.com/auth/gmail.readonly'],
  gmail_compose: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
  ],
  calendar: ['https://www.googleapis.com/auth/calendar.events'],
  drive: ['https://www.googleapis.com/auth/drive.readonly'],
  workspace_basic: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/drive.readonly',
  ],
};

function encodeState(input: { userId: string; scopeSet: GoogleScopeSet }) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}

function decodeState(state: string) {
  return JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as {
    userId: string;
    scopeSet: GoogleScopeSet;
  };
}

export class GoogleAuthService {
  static getScopes(scopeSet: GoogleScopeSet) {
    return [...GOOGLE_SCOPE_MAP.basic, ...GOOGLE_SCOPE_MAP[scopeSet]];
  }

  static getAuthorizationUrl(input: { userId: string; scopeSet: GoogleScopeSet }) {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Missing GOOGLE_CLIENT_ID');
    }

    const client = GoogleClientFactory.createOAuthClient();

    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: this.getScopes(input.scopeSet),
      state: encodeState(input),
      include_granted_scopes: true,
    });
  }

  static async exchangeAuthorizationCode(code: string) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Missing Google OAuth credentials');
    }

    const client = GoogleClientFactory.createOAuthClient();
    const { tokens } = await client.getToken(code);

    return {
      access_token: tokens.access_token ?? '',
      refresh_token: tokens.refresh_token ?? undefined,
      expires_in: tokens.expiry_date
        ? Math.max(0, Math.floor((tokens.expiry_date - Date.now()) / 1000))
        : undefined,
      scope: Array.isArray(tokens.scope) ? tokens.scope.join(' ') : tokens.scope,
      token_type: tokens.token_type ?? undefined,
      id_token: tokens.id_token ?? undefined,
    };
  }

  static async refreshAccessToken(connectedAccountId: string, refreshToken: string) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Missing Google OAuth credentials');
    }

    const client = GoogleClientFactory.createOAuthClient({
      refreshToken,
    });
    const refreshResponse = await client.refreshAccessToken();
    const tokens = refreshResponse.credentials;
    const payload = {
      access_token: tokens.access_token ?? '',
      expires_in: tokens.expiry_date
        ? Math.max(0, Math.floor((tokens.expiry_date - Date.now()) / 1000))
        : undefined,
      scope: Array.isArray(tokens.scope) ? tokens.scope.join(' ') : tokens.scope,
    };

    await updateConnectedAccountTokens(connectedAccountId, {
      accessToken: payload.access_token,
      accessTokenExpiresAt: payload.expires_in
        ? new Date(Date.now() + payload.expires_in * 1000)
        : undefined,
      scopes: payload.scope?.split(' ') ?? [],
    });

    return payload;
  }

  static async connectWorkspaceAccount(input: {
    userId: string;
    code: string;
    state: string;
  }) {
    const tokenPayload = await this.exchangeAuthorizationCode(input.code);
    const decodedState = decodeState(input.state);
    const scopeSet = decodedState.scopeSet;

    return upsertConnectedAccount({
      userId: input.userId,
      provider:
        scopeSet === 'gmail' || scopeSet === 'gmail_compose'
          ? ConnectedProvider.google_gmail
          : scopeSet === 'calendar'
            ? ConnectedProvider.google_calendar
            : scopeSet === 'drive'
              ? ConnectedProvider.google_drive
              : ConnectedProvider.google_auth,
      providerAccountId: `${input.userId}:${scopeSet}`,
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token,
      tokenType: tokenPayload.token_type,
      scopes: tokenPayload.scope?.split(' ') ?? this.getScopes(scopeSet),
      accessTokenExpiresAt: tokenPayload.expires_in
        ? new Date(Date.now() + tokenPayload.expires_in * 1000)
        : undefined,
      connectionStatus: ConnectionStatus.connected,
      syncEnabled: true,
      providerMetadata: {
        scopeSet,
        incrementalAuth: true,
      },
    });
  }

  static async getProviderSummaries(userId: string): Promise<ProviderConnectionSummary[]> {
    const prisma = getPrismaClient();
    const accounts = await prisma.connectedAccount.findMany({
      where: {
        userId,
        provider: {
          in: [
            ConnectedProvider.google_auth,
            ConnectedProvider.google_gmail,
            ConnectedProvider.google_calendar,
            ConnectedProvider.google_drive,
          ],
        },
      },
    });

    const summaryByProvider = new Map(accounts.map((account) => [account.provider, account]));

    return [
      {
        provider: ConnectedProvider.google_auth,
        label: 'Google Sign-In',
        status:
          summaryByProvider.get(ConnectedProvider.google_auth)?.connectionStatus ??
          ConnectionStatus.disconnected,
        scopes: summaryByProvider.get(ConnectedProvider.google_auth)?.scopes ?? [],
        syncEnabled:
          summaryByProvider.get(ConnectedProvider.google_auth)?.syncEnabled ?? false,
        automationEnabled:
          summaryByProvider.get(ConnectedProvider.google_auth)?.automationEnabled ??
          false,
        lastSyncedAt:
          summaryByProvider.get(ConnectedProvider.google_auth)?.lastSyncedAt,
      },
      {
        provider: ConnectedProvider.google_gmail,
        label: 'Gmail',
        status:
          summaryByProvider.get(ConnectedProvider.google_gmail)?.connectionStatus ??
          ConnectionStatus.disconnected,
        scopes: summaryByProvider.get(ConnectedProvider.google_gmail)?.scopes ?? [],
        syncEnabled:
          summaryByProvider.get(ConnectedProvider.google_gmail)?.syncEnabled ?? false,
        automationEnabled:
          summaryByProvider.get(ConnectedProvider.google_gmail)?.automationEnabled ??
          false,
        lastSyncedAt:
          summaryByProvider.get(ConnectedProvider.google_gmail)?.lastSyncedAt,
      },
      {
        provider: ConnectedProvider.google_calendar,
        label: 'Google Calendar',
        status:
          summaryByProvider.get(ConnectedProvider.google_calendar)?.connectionStatus ??
          ConnectionStatus.disconnected,
        scopes:
          summaryByProvider.get(ConnectedProvider.google_calendar)?.scopes ?? [],
        syncEnabled:
          summaryByProvider.get(ConnectedProvider.google_calendar)?.syncEnabled ??
          false,
        automationEnabled:
          summaryByProvider.get(ConnectedProvider.google_calendar)?.automationEnabled ??
          false,
        lastSyncedAt:
          summaryByProvider.get(ConnectedProvider.google_calendar)?.lastSyncedAt,
      },
      {
        provider: ConnectedProvider.google_drive,
        label: 'Google Drive',
        status:
          summaryByProvider.get(ConnectedProvider.google_drive)?.connectionStatus ??
          ConnectionStatus.disconnected,
        scopes: summaryByProvider.get(ConnectedProvider.google_drive)?.scopes ?? [],
        syncEnabled:
          summaryByProvider.get(ConnectedProvider.google_drive)?.syncEnabled ?? false,
        automationEnabled:
          summaryByProvider.get(ConnectedProvider.google_drive)?.automationEnabled ??
          false,
        lastSyncedAt:
          summaryByProvider.get(ConnectedProvider.google_drive)?.lastSyncedAt,
      },
    ];
  }
}
