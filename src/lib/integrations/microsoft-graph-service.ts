import { ConnectedProvider, ConnectionStatus } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  updateConnectedAccountTokens,
  upsertConnectedAccount,
} from './connected-account-service';
import type { ProviderConnectionSummary } from './types';

// Microsoft Graph OAuth endpoints
const AUTHORITY = 'https://login.microsoftonline.com/common/oauth2/v2.0';
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

// Scope sets
const SCOPES_BASE = ['openid', 'email', 'profile', 'offline_access', 'User.Read'];
const SCOPES_OUTLOOK = ['Mail.Read', 'Mail.Send'];
const SCOPES_CALENDAR = ['Calendars.Read', 'Calendars.ReadWrite'];
const SCOPES_TEAMS = [
  'Team.ReadBasic.All',
  'Channel.ReadBasic.All',
  'ChannelMessage.Send',
  'Chat.Read',
  'Chat.ReadWrite',
];
const SCOPES_ALL = [...SCOPES_BASE, ...SCOPES_OUTLOOK, ...SCOPES_CALENDAR, ...SCOPES_TEAMS];

export type MicrosoftScopeSet = 'outlook' | 'calendar' | 'teams' | 'all';

function getClientId() {
  const id = process.env.MICROSOFT_CLIENT_ID;
  if (!id) throw new Error('Missing MICROSOFT_CLIENT_ID');
  return id;
}

function getClientSecret() {
  const secret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!secret) throw new Error('Missing MICROSOFT_CLIENT_SECRET');
  return secret;
}

function getRedirectUri() {
  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  return `${appUrl}/api/integrations/microsoft/callback`;
}

function encodeState(input: { userId: string; scopeSet: MicrosoftScopeSet }) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}

function decodeState(state: string) {
  return JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as {
    userId: string;
    scopeSet: MicrosoftScopeSet;
  };
}

function getScopesForSet(scopeSet: MicrosoftScopeSet): string[] {
  switch (scopeSet) {
    case 'outlook': return [...SCOPES_BASE, ...SCOPES_OUTLOOK];
    case 'calendar': return [...SCOPES_BASE, ...SCOPES_CALENDAR];
    case 'teams': return [...SCOPES_BASE, ...SCOPES_TEAMS];
    case 'all': return SCOPES_ALL;
  }
}

function providerForScopeSet(scopeSet: MicrosoftScopeSet): ConnectedProvider {
  switch (scopeSet) {
    case 'outlook': return ConnectedProvider.microsoft_outlook;
    case 'calendar': return ConnectedProvider.microsoft_calendar;
    case 'teams': return ConnectedProvider.microsoft_teams;
    case 'all': return ConnectedProvider.microsoft_outlook; // primary when all connected
  }
}

export class MicrosoftGraphService {
  // ─── OAuth ────────────────────────────────────────────────────────────────

  static getAuthorizationUrl(input: { userId: string; scopeSet: MicrosoftScopeSet }): string {
    const params = new URLSearchParams({
      client_id: getClientId(),
      response_type: 'code',
      redirect_uri: getRedirectUri(),
      scope: getScopesForSet(input.scopeSet).join(' '),
      response_mode: 'query',
      state: encodeState(input),
      prompt: 'consent',
    });
    return `${AUTHORITY}/authorize?${params}`;
  }

  static async exchangeAuthorizationCode(code: string) {
    const res = await fetch(`${AUTHORITY}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: getClientId(),
        client_secret: getClientSecret(),
        code,
        redirect_uri: getRedirectUri(),
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Microsoft token exchange failed: ${err}`);
    }

    return res.json() as Promise<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
      token_type: string;
      id_token?: string;
    }>;
  }

  static async refreshAccessToken(connectedAccountId: string, refreshToken: string) {
    const res = await fetch(`${AUTHORITY}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: getClientId(),
        client_secret: getClientSecret(),
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Microsoft token refresh failed: ${err}`);
    }

    const tokens = await res.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
    };

    await updateConnectedAccountTokens(connectedAccountId, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scopes: tokens.scope.split(' '),
    });

    return tokens;
  }

  static async getUserProfile(accessToken: string) {
    const res = await fetch(`${GRAPH_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Failed to fetch Microsoft user profile');
    return res.json() as Promise<{
      id: string;
      displayName: string;
      mail?: string;
      userPrincipalName: string;
    }>;
  }

  static async connectWorkspaceAccount(input: {
    userId: string;
    code: string;
    state: string;
  }) {
    const tokens = await this.exchangeAuthorizationCode(input.code);
    const decodedState = decodeState(input.state);
    const { scopeSet } = decodedState;

    // Fetch user profile to get display name and email
    let displayName: string | undefined;
    let accountEmail: string | undefined;
    try {
      const profile = await this.getUserProfile(tokens.access_token);
      displayName = profile.displayName;
      accountEmail = profile.mail ?? profile.userPrincipalName;
    } catch {
      // non-fatal
    }

    const provider = providerForScopeSet(scopeSet);

    // For 'all' scope, upsert all three providers with the same token set
    const providersToUpsert: ConnectedProvider[] =
      scopeSet === 'all'
        ? [ConnectedProvider.microsoft_outlook, ConnectedProvider.microsoft_calendar, ConnectedProvider.microsoft_teams]
        : [provider];

    const results = await Promise.all(
      providersToUpsert.map((p) =>
        upsertConnectedAccount({
          userId: input.userId,
          provider: p,
          providerAccountId: `${input.userId}:${p}`,
          displayName,
          accountEmail,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenType: tokens.token_type,
          scopes: tokens.scope.split(' '),
          accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          connectionStatus: ConnectionStatus.connected,
          syncEnabled: true,
          providerMetadata: { scopeSet },
        }),
      ),
    );

    return results[0];
  }

  // ─── Graph API helpers ────────────────────────────────────────────────────

  static async graphGet<T>(accessToken: string, path: string): Promise<T> {
    const res = await fetch(`${GRAPH_BASE}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Graph GET ${path} failed: ${err}`);
    }
    return res.json() as Promise<T>;
  }

  static async graphPost<T>(accessToken: string, path: string, body: unknown): Promise<T> {
    const res = await fetch(`${GRAPH_BASE}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Graph POST ${path} failed: ${err}`);
    }
    return res.json() as Promise<T>;
  }

  // ─── Outlook ──────────────────────────────────────────────────────────────

  static async listInboxMessages(accessToken: string, top = 50) {
    return this.graphGet<{
      value: Array<{
        id: string;
        subject?: string;
        bodyPreview?: string;
        from?: { emailAddress?: { name?: string; address?: string } };
        toRecipients?: Array<{ emailAddress?: { name?: string; address?: string } }>;
        receivedDateTime: string;
        isRead: boolean;
        conversationId: string;
      }>;
    }>(
      accessToken,
      `/me/mailFolders/inbox/messages?$top=${top}&$orderby=receivedDateTime desc&$select=id,subject,bodyPreview,from,toRecipients,receivedDateTime,isRead,conversationId`,
    );
  }

  static async getMessage(accessToken: string, messageId: string) {
    return this.graphGet<{
      id: string;
      subject?: string;
      body?: { content?: string; contentType?: string };
      from?: { emailAddress?: { name?: string; address?: string } };
      toRecipients?: Array<{ emailAddress?: { name?: string; address?: string } }>;
      ccRecipients?: Array<{ emailAddress?: { name?: string; address?: string } }>;
      receivedDateTime: string;
      isRead: boolean;
      conversationId: string;
    }>(accessToken, `/me/messages/${messageId}`);
  }

  static async sendMail(accessToken: string, input: {
    subject: string;
    bodyHtml: string;
    toEmails: string[];
    ccEmails?: string[];
  }) {
    return this.graphPost(accessToken, '/me/sendMail', {
      message: {
        subject: input.subject,
        body: { contentType: 'HTML', content: input.bodyHtml },
        toRecipients: input.toEmails.map((e) => ({ emailAddress: { address: e } })),
        ccRecipients: (input.ccEmails ?? []).map((e) => ({ emailAddress: { address: e } })),
      },
      saveToSentItems: true,
    });
  }

  static async createDraft(accessToken: string, input: {
    subject: string;
    bodyHtml: string;
    toEmails: string[];
  }) {
    return this.graphPost<{ id: string }>(accessToken, '/me/messages', {
      subject: input.subject,
      body: { contentType: 'HTML', content: input.bodyHtml },
      toRecipients: input.toEmails.map((e) => ({ emailAddress: { address: e } })),
    });
  }

  // ─── Calendar ─────────────────────────────────────────────────────────────

  static async listCalendarEvents(accessToken: string, input?: {
    startDateTime?: string;
    endDateTime?: string;
    top?: number;
  }) {
    const params = new URLSearchParams({
      $top: String(input?.top ?? 50),
      $orderby: 'start/dateTime',
      $select: 'id,subject,bodyPreview,start,end,location,webLink,organizer',
    });
    if (input?.startDateTime) params.set('startDateTime', input.startDateTime);
    if (input?.endDateTime) params.set('endDateTime', input.endDateTime);

    const path = input?.startDateTime
      ? `/me/calendarView?${params}`
      : `/me/events?${params}`;

    return this.graphGet<{
      value: Array<{
        id: string;
        subject?: string;
        bodyPreview?: string;
        start?: { dateTime: string; timeZone: string };
        end?: { dateTime: string; timeZone: string };
        location?: { displayName?: string };
        webLink?: string;
        organizer?: { emailAddress?: { name?: string; address?: string } };
      }>;
    }>(accessToken, path);
  }

  static async createCalendarEvent(accessToken: string, input: {
    subject: string;
    body?: string;
    startDateTime: string;
    endDateTime: string;
    timeZone?: string;
    attendeeEmails?: string[];
    location?: string;
  }) {
    return this.graphPost<{ id: string; webLink: string }>(accessToken, '/me/events', {
      subject: input.subject,
      body: input.body ? { contentType: 'HTML', content: input.body } : undefined,
      start: { dateTime: input.startDateTime, timeZone: input.timeZone ?? 'UTC' },
      end: { dateTime: input.endDateTime, timeZone: input.timeZone ?? 'UTC' },
      location: input.location ? { displayName: input.location } : undefined,
      attendees: (input.attendeeEmails ?? []).map((e) => ({
        emailAddress: { address: e },
        type: 'required',
      })),
    });
  }

  // ─── Teams ────────────────────────────────────────────────────────────────

  static async listJoinedTeams(accessToken: string) {
    return this.graphGet<{
      value: Array<{ id: string; displayName: string; description?: string }>;
    }>(accessToken, '/me/joinedTeams');
  }

  static async listTeamChannels(accessToken: string, teamId: string) {
    return this.graphGet<{
      value: Array<{ id: string; displayName: string; membershipType?: string }>;
    }>(accessToken, `/teams/${teamId}/channels`);
  }

  static async postChannelMessage(accessToken: string, input: {
    teamId: string;
    channelId: string;
    content: string;
    contentType?: 'html' | 'text';
  }) {
    return this.graphPost<{ id: string }>(
      accessToken,
      `/teams/${input.teamId}/channels/${input.channelId}/messages`,
      {
        body: {
          contentType: input.contentType ?? 'html',
          content: input.content,
        },
      },
    );
  }

  static async listChats(accessToken: string) {
    return this.graphGet<{
      value: Array<{
        id: string;
        chatType: string;
        topic?: string;
        members?: Array<{ displayName?: string }>;
      }>;
    }>(accessToken, '/me/chats?$expand=members');
  }

  static async postChatMessage(accessToken: string, input: {
    chatId: string;
    content: string;
    contentType?: 'html' | 'text';
  }) {
    return this.graphPost<{ id: string }>(
      accessToken,
      `/me/chats/${input.chatId}/messages`,
      {
        body: {
          contentType: input.contentType ?? 'html',
          content: input.content,
        },
      },
    );
  }

  // ─── Provider summaries ───────────────────────────────────────────────────

  static async getProviderSummaries(userId: string): Promise<ProviderConnectionSummary[]> {
    const prisma = getPrismaClient();
    const accounts = await prisma.connectedAccount.findMany({
      where: {
        userId,
        provider: {
          in: [
            ConnectedProvider.microsoft_outlook,
            ConnectedProvider.microsoft_calendar,
            ConnectedProvider.microsoft_teams,
          ],
        },
      },
    });

    const byProvider = new Map(accounts.map((a) => [a.provider, a]));

    const make = (
      provider: ConnectedProvider,
      label: string,
    ): ProviderConnectionSummary => {
      const acc = byProvider.get(provider);
      return {
        provider,
        label,
        status: acc?.connectionStatus ?? ConnectionStatus.disconnected,
        scopes: acc?.scopes ?? [],
        syncEnabled: acc?.syncEnabled ?? false,
        automationEnabled: acc?.automationEnabled ?? false,
        lastSyncedAt: acc?.lastSyncedAt,
      };
    };

    return [
      make(ConnectedProvider.microsoft_outlook, 'Microsoft Outlook'),
      make(ConnectedProvider.microsoft_calendar, 'Microsoft Calendar'),
      make(ConnectedProvider.microsoft_teams, 'Microsoft Teams'),
    ];
  }

  // ─── Token retrieval helper ───────────────────────────────────────────────

  static async getAccessToken(userId: string, provider: ConnectedProvider): Promise<string | null> {
    const prisma = getPrismaClient();
    const account = await prisma.connectedAccount.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    if (!account?.accessToken) return null;

    // Auto-refresh if expiring within 5 minutes
    if (
      account.refreshToken &&
      account.accessTokenExpiresAt &&
      account.accessTokenExpiresAt < new Date(Date.now() + 5 * 60 * 1000)
    ) {
      try {
        const refreshed = await this.refreshAccessToken(account.id, account.refreshToken);
        return refreshed.access_token;
      } catch {
        return account.accessToken;
      }
    }

    return account.accessToken;
  }
}
