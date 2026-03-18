import {
  ConnectedProvider,
  ConnectionStatus,
  type Prisma,
} from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';

interface ConnectedAccountDatabaseClient {
  connectedAccount: ReturnType<typeof getPrismaClient>['connectedAccount'];
}

export interface UpsertConnectedAccountInput {
  userId: string;
  provider: ConnectedProvider;
  providerAccountId: string;
  displayName?: string;
  accountEmail?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  scopes?: string[];
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  connectionStatus?: ConnectionStatus;
  syncEnabled?: boolean;
  automationEnabled?: boolean;
  providerMetadata?: Prisma.InputJsonValue;
}

export async function upsertConnectedAccount(
  input: UpsertConnectedAccountInput,
  db: ConnectedAccountDatabaseClient = getPrismaClient(),
) {
  return db.connectedAccount.upsert({
    where: {
      userId_provider: {
        userId: input.userId,
        provider: input.provider,
      },
    },
    update: {
      providerAccountId: input.providerAccountId,
      displayName: input.displayName,
      accountEmail: input.accountEmail,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenType: input.tokenType,
      scopes: input.scopes ?? [],
      accessTokenExpiresAt: input.accessTokenExpiresAt,
      refreshTokenExpiresAt: input.refreshTokenExpiresAt,
      connectionStatus: input.connectionStatus ?? ConnectionStatus.connected,
      syncEnabled: input.syncEnabled ?? false,
      automationEnabled: input.automationEnabled ?? false,
      providerMetadata: input.providerMetadata,
      lastRefreshedAt: input.accessToken ? new Date() : undefined,
    },
    create: {
      userId: input.userId,
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      displayName: input.displayName,
      accountEmail: input.accountEmail,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenType: input.tokenType,
      scopes: input.scopes ?? [],
      accessTokenExpiresAt: input.accessTokenExpiresAt,
      refreshTokenExpiresAt: input.refreshTokenExpiresAt,
      connectionStatus: input.connectionStatus ?? ConnectionStatus.connected,
      syncEnabled: input.syncEnabled ?? false,
      automationEnabled: input.automationEnabled ?? false,
      providerMetadata: input.providerMetadata,
      lastRefreshedAt: input.accessToken ? new Date() : undefined,
    },
  });
}

export async function updateConnectedAccountTokens(
  connectedAccountId: string,
  input: {
    accessToken: string;
    refreshToken?: string;
    accessTokenExpiresAt?: Date;
    refreshTokenExpiresAt?: Date;
    scopes?: string[];
  },
  db: ConnectedAccountDatabaseClient = getPrismaClient(),
) {
  return db.connectedAccount.update({
    where: { id: connectedAccountId },
    data: {
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      accessTokenExpiresAt: input.accessTokenExpiresAt,
      refreshTokenExpiresAt: input.refreshTokenExpiresAt,
      scopes: input.scopes,
      connectionStatus: ConnectionStatus.connected,
      lastRefreshedAt: new Date(),
    },
  });
}

export async function disconnectConnectedAccount(
  userId: string,
  provider: ConnectedProvider,
  db: ConnectedAccountDatabaseClient = getPrismaClient(),
) {
  return db.connectedAccount.update({
    where: {
      userId_provider: {
        userId,
        provider,
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
}

export async function getConnectedAccountsForUser(
  userId: string,
  db: ConnectedAccountDatabaseClient = getPrismaClient(),
) {
  return db.connectedAccount.findMany({
    where: { userId },
    orderBy: {
      provider: 'asc',
    },
  });
}
