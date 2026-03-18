import crypto from 'node:crypto';

import {
  ConnectedProvider,
  ConnectionStatus,
  NoteDestinationType,
  WebhookEventStatus,
} from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockUpsertConnectedAccount = vi.fn();
const mockPrisma = {
  webhookEvent: {
    create: vi.fn(),
  },
};
const mockUsersMe = vi.fn();

vi.mock('./connected-account-service', () => ({
  upsertConnectedAccount: (...args: unknown[]) => mockUpsertConnectedAccount(...args),
}));

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: () => mockPrisma,
}));

vi.mock('./notion-client-factory', () => ({
  NotionClientFactory: {
    create: () => ({
      users: {
        me: mockUsersMe,
      },
    }),
  },
}));

import { NotionSyncService } from './notion-sync-service';
import { ZoomService } from './zoom-service';

describe('ZoomService and NotionSyncService', () => {
  const zoomWebhookSecret = process.env.ZOOM_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.ZOOM_WEBHOOK_SECRET = 'zoom-webhook-secret';
    mockUpsertConnectedAccount.mockReset();
    mockPrisma.webhookEvent.create.mockReset();
    mockUsersMe.mockReset();
  });

  afterEach(() => {
    process.env.ZOOM_WEBHOOK_SECRET = zoomWebhookSecret;
    vi.restoreAllMocks();
  });

  it('verifies a valid Zoom webhook signature', () => {
    const payload = JSON.stringify({
      event: 'meeting.ended',
      payload: {
        object: {
          id: 'meeting-1',
        },
      },
    });
    const timestamp = '1710300000';
    const signature = `v0=${crypto
      .createHmac('sha256', 'zoom-webhook-secret')
      .update(`v0:${timestamp}:${payload}`)
      .digest('hex')}`;

    expect(
      ZoomService.verifyWebhookSignature({
        payload,
        timestamp,
        signature,
      }),
    ).toBe(true);
  });

  it('persists an incoming webhook event before downstream processing', async () => {
    mockPrisma.webhookEvent.create.mockResolvedValue({
      id: 'webhook_1',
      status: WebhookEventStatus.received,
    });

    const result = await ZoomService.ingestWebhookEvent({
      headers: {
        'x-zm-trackingid': 'tracking-1',
      },
      payload: {
        event: 'meeting.ended',
      },
    });

    expect(result).toEqual({
      id: 'webhook_1',
      status: WebhookEventStatus.received,
    });
    expect(mockPrisma.webhookEvent.create).toHaveBeenCalledWith({
      data: {
        provider: ConnectedProvider.zoom,
        eventType: 'meeting.ended',
        deliveryId: 'tracking-1',
        status: WebhookEventStatus.received,
        verified: false,
        headers: {
          'x-zm-trackingid': 'tracking-1',
        },
        payload: {
          event: 'meeting.ended',
        },
      },
    });
  });

  it('connects a Zoom account with automation enabled', async () => {
    await ZoomService.connectZoomAccount({
      userId: 'user_1',
      providerAccountId: 'zoom-account-1',
      accountEmail: 'rep@trainovations.com',
      accessToken: 'zoom-token',
      refreshToken: 'zoom-refresh',
      scopes: ['meeting:read'],
      expiresIn: 7200,
    });

    expect(mockUpsertConnectedAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        provider: ConnectedProvider.zoom,
        connectionStatus: ConnectionStatus.connected,
        automationEnabled: true,
        accessTokenExpiresAt: expect.any(Date),
      }),
    );
  });

  it('builds a reusable Notion destination abstraction', () => {
    expect(
      NotionSyncService.buildNoteDestination({
        destinationType: NoteDestinationType.notion_database,
        databaseId: 'database_1',
      }),
    ).toEqual({
      destinationType: NoteDestinationType.notion_database,
      pageId: undefined,
      databaseId: 'database_1',
    });
  });

  it('loads Notion workspace identity through the shared client factory', async () => {
    mockUsersMe.mockResolvedValueOnce({
      id: 'notion-user-1',
      type: 'person',
      name: 'Notion Workspace',
    });

    const result = await NotionSyncService.getWorkspaceIdentity('notion-token');

    expect(result).toEqual({
      id: 'notion-user-1',
      type: 'person',
      name: 'Notion Workspace',
    });
  });
});
