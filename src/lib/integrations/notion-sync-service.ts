import { ConnectedProvider, ConnectionStatus, NoteDestinationType } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';

import { NotionClientFactory } from './notion-client-factory';
import { upsertConnectedAccount } from './connected-account-service';
import type { ProviderConnectionSummary } from './types';

function getNotionCredentials() {
  return {
    clientId: process.env.NOTION_CLIENT_ID,
    clientSecret: process.env.NOTION_CLIENT_SECRET,
    redirectUri:
      process.env.NOTION_OAUTH_REDIRECT_URI ??
      'http://localhost:3000/api/integrations/notion/callback',
  };
}

export class NotionSyncService {
  static getAuthorizationUrl(userId: string) {
    const credentials = getNotionCredentials();

    if (!credentials.clientId) {
      throw new Error('Missing NOTION_CLIENT_ID');
    }

    const params = new URLSearchParams({
      client_id: credentials.clientId,
      response_type: 'code',
      owner: 'user',
      redirect_uri: credentials.redirectUri,
      state: Buffer.from(JSON.stringify({ userId })).toString('base64url'),
    });

    return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
  }

  static buildNoteDestination(input: {
    destinationType: NoteDestinationType;
    pageId?: string;
    databaseId?: string;
  }) {
    return {
      destinationType: input.destinationType,
      pageId: input.pageId,
      databaseId: input.databaseId,
    };
  }

  static createClient(accessToken?: string) {
    return NotionClientFactory.create(accessToken);
  }

  static async getWorkspaceIdentity(accessToken: string) {
    const client = this.createClient(accessToken);
    const user = await client.users.me({});

    return {
      id: user.id,
      name:
        'name' in user && typeof user.name === 'string'
          ? user.name
          : 'Notion workspace',
      type: user.type,
    };
  }

  static async connectNotionAccount(input: {
    userId: string;
    providerAccountId: string;
    accountEmail?: string;
    accessToken?: string;
    scopes?: string[];
  }) {
    return upsertConnectedAccount({
      userId: input.userId,
      provider: ConnectedProvider.notion,
      providerAccountId: input.providerAccountId,
      accountEmail: input.accountEmail,
      accessToken: input.accessToken,
      scopes: input.scopes,
      connectionStatus: ConnectionStatus.connected,
      syncEnabled: true,
      automationEnabled: false,
    });
  }

  static async getProviderSummary(userId: string): Promise<ProviderConnectionSummary> {
    const prisma = getPrismaClient();
    const account = await prisma.connectedAccount.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: ConnectedProvider.notion,
        },
      },
    });

    return {
      provider: ConnectedProvider.notion,
      label: 'Notion',
      status: account?.connectionStatus ?? ConnectionStatus.disconnected,
      scopes: account?.scopes ?? [],
      syncEnabled: account?.syncEnabled ?? false,
      automationEnabled: account?.automationEnabled ?? false,
      lastSyncedAt: account?.lastSyncedAt,
    };
  }
}
