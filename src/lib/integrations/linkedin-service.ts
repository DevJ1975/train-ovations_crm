import { ConnectedProvider, ConnectionStatus } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';

import type { ProviderConnectionSummary } from './types';

function getLinkedInCredentials() {
  return {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri:
      process.env.LINKEDIN_OAUTH_REDIRECT_URI ??
      'http://localhost:3000/api/integrations/linkedin/callback',
  };
}

export class LinkedInService {
  static getAuthorizationUrl(userId: string) {
    const credentials = getLinkedInCredentials();

    if (!credentials.clientId) {
      throw new Error('LINKEDIN_CLIENT_ID is not configured');
    }

    const state = Buffer.from(JSON.stringify({ userId })).toString('base64url');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: credentials.clientId,
      redirect_uri: credentials.redirectUri,
      state,
      scope: 'openid profile email w_member_social',
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  static async getProviderSummary(userId: string): Promise<ProviderConnectionSummary> {
    const prisma = getPrismaClient();

    const account = await prisma.connectedAccount.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: ConnectedProvider.linkedin,
        },
      },
    });

    return {
      provider: ConnectedProvider.linkedin,
      label: 'LinkedIn',
      status: account?.connectionStatus ?? ConnectionStatus.disconnected,
      scopes: account?.scopes ?? [],
      syncEnabled: account?.syncEnabled ?? false,
      automationEnabled: account?.automationEnabled ?? false,
      lastSyncedAt: account?.lastSyncedAt,
    };
  }
}
