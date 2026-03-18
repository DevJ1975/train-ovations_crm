import crypto from 'node:crypto';

import {
  ConnectedProvider,
  ConnectionStatus,
  Prisma,
  WebhookEventStatus,
} from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';

import { upsertConnectedAccount } from './connected-account-service';
import type { ProviderConnectionSummary } from './types';

function getZoomCredentials() {
  return {
    clientId: process.env.ZOOM_CLIENT_ID,
    clientSecret: process.env.ZOOM_CLIENT_SECRET,
    redirectUri:
      process.env.ZOOM_OAUTH_REDIRECT_URI ??
      'http://localhost:3000/api/integrations/zoom/callback',
    webhookSecret: process.env.ZOOM_WEBHOOK_SECRET,
  };
}

export class ZoomService {
  static getAuthorizationUrl(userId: string) {
    const credentials = getZoomCredentials();

    if (!credentials.clientId) {
      throw new Error('Missing ZOOM_CLIENT_ID');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: credentials.clientId,
      redirect_uri: credentials.redirectUri,
      state: Buffer.from(JSON.stringify({ userId })).toString('base64url'),
    });

    return `https://zoom.us/oauth/authorize?${params.toString()}`;
  }

  static async exchangeAuthorizationCode(code: string) {
    const credentials = getZoomCredentials();

    if (!credentials.clientId || !credentials.clientSecret) {
      throw new Error('Missing Zoom OAuth credentials');
    }

    const basicAuth = Buffer.from(
      `${credentials.clientId}:${credentials.clientSecret}`,
    ).toString('base64');

    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        redirect_uri: credentials.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange Zoom authorization code');
    }

    return response.json() as Promise<{
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    }>;
  }

  static verifyWebhookSignature(input: {
    payload: string;
    timestamp: string;
    signature: string | null;
  }) {
    const secret = getZoomCredentials().webhookSecret;

    if (!secret || !input.signature) {
      return false;
    }

    const message = `v0:${input.timestamp}:${input.payload}`;
    const digest = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');

    return input.signature === `v0=${digest}`;
  }

  static async ingestWebhookEvent(input: {
    headers: Record<string, string>;
    payload: Prisma.InputJsonValue & Record<string, unknown>;
  }) {
    const prisma = getPrismaClient();

    return prisma.webhookEvent.create({
      data: {
        provider: ConnectedProvider.zoom,
        eventType: String(input.payload.event ?? 'unknown'),
        deliveryId: input.headers['x-zm-trackingid'] ?? undefined,
        status: WebhookEventStatus.received,
        verified: false,
        headers: input.headers,
        payload: input.payload,
      },
    });
  }

  static async connectZoomAccount(input: {
    userId: string;
    providerAccountId: string;
    accountEmail?: string;
    accessToken: string;
    refreshToken?: string;
    scopes?: string[];
    expiresIn?: number;
  }) {
    return upsertConnectedAccount({
      userId: input.userId,
      provider: ConnectedProvider.zoom,
      providerAccountId: input.providerAccountId,
      accountEmail: input.accountEmail,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      scopes: input.scopes,
      accessTokenExpiresAt: input.expiresIn
        ? new Date(Date.now() + input.expiresIn * 1000)
        : undefined,
      connectionStatus: ConnectionStatus.connected,
      syncEnabled: true,
      automationEnabled: true,
    });
  }

  static async getProviderSummary(userId: string): Promise<ProviderConnectionSummary> {
    const prisma = getPrismaClient();
    const account = await prisma.connectedAccount.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: ConnectedProvider.zoom,
        },
      },
    });

    return {
      provider: ConnectedProvider.zoom,
      label: 'Zoom',
      status: account?.connectionStatus ?? ConnectionStatus.disconnected,
      scopes: account?.scopes ?? [],
      syncEnabled: account?.syncEnabled ?? false,
      automationEnabled: account?.automationEnabled ?? false,
      lastSyncedAt: account?.lastSyncedAt,
    };
  }
}
