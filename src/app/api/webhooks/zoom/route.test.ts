import { ConnectedProvider, WebhookEventStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockVerifyWebhookSignature = vi.fn();
const mockQueueZoomMeetingCompletionPipeline = vi.fn();
const mockProcessZoomMeetingCompletedEvent = vi.fn();

const mockPrisma = {
  webhookEvent: {
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@/lib/integrations', () => ({
  ZoomService: {
    verifyWebhookSignature: (...args: unknown[]) =>
      mockVerifyWebhookSignature(...args),
  },
  AutomationOrchestrator: {
    queueZoomMeetingCompletionPipeline: (...args: unknown[]) =>
      mockQueueZoomMeetingCompletionPipeline(...args),
  },
}));

vi.mock('@/lib/meeting-intelligence/meeting-completion-service', () => ({
  processZoomMeetingCompletedEvent: (...args: unknown[]) =>
    mockProcessZoomMeetingCompletedEvent(...args),
}));

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: () => mockPrisma,
}));

import { POST } from './route';

describe('POST /api/webhooks/zoom', () => {
  beforeEach(() => {
    mockVerifyWebhookSignature.mockReset();
    mockQueueZoomMeetingCompletionPipeline.mockReset();
    mockProcessZoomMeetingCompletedEvent.mockReset();
    mockPrisma.webhookEvent.create.mockReset();
    mockPrisma.webhookEvent.update.mockReset();
  });

  it('rejects unverified requests and records the failed event', async () => {
    mockVerifyWebhookSignature.mockReturnValue(false);
    mockPrisma.webhookEvent.create.mockResolvedValue({ id: 'webhook_1' });

    const response = await POST(
      new Request('http://localhost/api/webhooks/zoom', {
        method: 'POST',
        headers: {
          'x-zm-request-timestamp': '1710300000',
          'x-zm-signature': 'invalid',
          'x-zm-trackingid': 'delivery-1',
        },
        body: JSON.stringify({
          event: 'meeting.ended',
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(mockPrisma.webhookEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: ConnectedProvider.zoom,
        deliveryId: 'delivery-1',
        status: WebhookEventStatus.failed,
        verified: false,
      }),
    });
  });

  it('queues meeting automation for verified meeting-ended events', async () => {
    mockVerifyWebhookSignature.mockReturnValue(true);
    mockPrisma.webhookEvent.create.mockResolvedValue({ id: 'webhook_1' });
    mockProcessZoomMeetingCompletedEvent.mockResolvedValue({
      outcome: 'processed',
      id: 'meeting_1',
      userId: 'user_1',
      connectedAccountId: 'account_1',
      meetingId: 'meeting_1',
      shouldQueueAutomation: true,
      created: false,
      artifactSummary: {
        hasRecording: true,
        hasTranscript: false,
        participantCount: 2,
      },
    });

    const response = await POST(
      new Request('http://localhost/api/webhooks/zoom', {
        method: 'POST',
        headers: {
          'x-zm-request-timestamp': '1710300000',
          'x-zm-signature': 'valid',
          'x-zm-trackingid': 'delivery-1',
        },
        body: JSON.stringify({
          event: 'meeting.ended',
          payload: {
            object: {
              id: 'zoom-123',
            },
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockProcessZoomMeetingCompletedEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'meeting.ended',
      }),
      mockPrisma,
    );
    expect(mockQueueZoomMeetingCompletionPipeline).toHaveBeenCalledWith({
      userId: 'user_1',
      connectedAccountId: 'account_1',
      meetingId: 'meeting_1',
    });
    expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith({
      where: { id: 'webhook_1' },
      data: expect.objectContaining({
        status: WebhookEventStatus.processed,
        meetingId: 'meeting_1',
        processedAt: expect.any(Date),
      }),
    });
  });

  it('marks the webhook ignored when the meeting cannot be resolved', async () => {
    mockVerifyWebhookSignature.mockReturnValue(true);
    mockPrisma.webhookEvent.create.mockResolvedValue({ id: 'webhook_1' });
    mockProcessZoomMeetingCompletedEvent.mockResolvedValue({
      outcome: 'ignored',
      shouldQueueAutomation: false,
      created: false,
      artifactSummary: {
        hasRecording: false,
        hasTranscript: false,
        participantCount: 0,
      },
    });

    const response = await POST(
      new Request('http://localhost/api/webhooks/zoom', {
        method: 'POST',
        headers: {
          'x-zm-request-timestamp': '1710300000',
          'x-zm-signature': 'valid',
          'x-zm-trackingid': 'delivery-1',
        },
        body: JSON.stringify({
          event: 'meeting.ended',
          payload: {
            object: {
              id: 'zoom-123',
            },
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockQueueZoomMeetingCompletionPipeline).not.toHaveBeenCalled();
    expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith({
      where: { id: 'webhook_1' },
      data: expect.objectContaining({
        status: WebhookEventStatus.ignored,
        processedAt: expect.any(Date),
      }),
    });
  });
});
