import { ConnectedProvider } from '@prisma/client';
import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import {
  canAccessIntegrationSettings,
  disconnectConnectedAccount,
  getConnectedAccountsForUser,
  GoogleAuthService,
  LinkedInService,
  MicrosoftGraphService,
  NotionSyncService,
  ZoomService,
} from '@/lib/integrations';
import { getPrismaClient } from '@/lib/prisma';

export async function GET() {
  const user = await requireAuthenticatedUser('/settings/integrations');

  if (!canAccessIntegrationSettings(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [accounts, googleSummaries, zoomSummary, notionSummary, linkedInSummary, microsoftSummaries] = await Promise.all([
    getConnectedAccountsForUser(user.id),
    GoogleAuthService.getProviderSummaries(user.id),
    ZoomService.getProviderSummary(user.id),
    NotionSyncService.getProviderSummary(user.id),
    LinkedInService.getProviderSummary(user.id),
    MicrosoftGraphService.getProviderSummaries(user.id),
  ]);

  return NextResponse.json({
    accounts,
    summaries: [...googleSummaries, zoomSummary, notionSummary, linkedInSummary, ...microsoftSummaries].map((summary) => ({
      ...summary,
      lastSyncedAt: summary.lastSyncedAt?.toISOString() ?? null,
    })),
  });
}

export async function PATCH(request: Request) {
  const user = await requireAuthenticatedUser('/settings/integrations');

  if (!canAccessIntegrationSettings(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as {
    provider?: ConnectedProvider;
    syncEnabled?: boolean;
    automationEnabled?: boolean;
  };

  if (!body.provider) {
    return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
  }

  const prisma = getPrismaClient();

  const account = await prisma.connectedAccount.update({
    where: {
      userId_provider: {
        userId: user.id,
        provider: body.provider,
      },
    },
    data: {
      syncEnabled: body.syncEnabled ?? false,
      automationEnabled: body.automationEnabled ?? false,
    },
  });

  return NextResponse.json({
    account: {
      ...account,
      accessTokenExpiresAt: account.accessTokenExpiresAt?.toISOString() ?? null,
      refreshTokenExpiresAt: account.refreshTokenExpiresAt?.toISOString() ?? null,
      lastRefreshedAt: account.lastRefreshedAt?.toISOString() ?? null,
      lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(request: Request) {
  const user = await requireAuthenticatedUser('/settings/integrations');

  if (!canAccessIntegrationSettings(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') as ConnectedProvider | null;

  if (!provider) {
    return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
  }

  await disconnectConnectedAccount(user.id, provider);

  return NextResponse.json({ ok: true });
}
