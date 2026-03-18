import { ConnectedProvider, Prisma, WebhookEventStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

import { AutomationOrchestrator, ZoomService } from '@/lib/integrations';
import { processZoomMeetingCompletedEvent } from '@/lib/meeting-intelligence/meeting-completion-service';
import { getPrismaClient } from '@/lib/prisma';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const headers = {
    'x-zm-request-timestamp': request.headers.get('x-zm-request-timestamp') ?? '',
    'x-zm-signature': request.headers.get('x-zm-signature') ?? '',
    'x-zm-trackingid': request.headers.get('x-zm-trackingid') ?? '',
  };
  const payload = JSON.parse(rawBody) as Prisma.InputJsonValue & Record<string, unknown>;

  const isVerified = ZoomService.verifyWebhookSignature({
    payload: rawBody,
    timestamp: headers['x-zm-request-timestamp'],
    signature: headers['x-zm-signature'],
  });

  const prisma = getPrismaClient();
  const eventRecord = await prisma.webhookEvent.create({
    data: {
      provider: ConnectedProvider.zoom,
      eventType: String(payload.event ?? 'unknown'),
      deliveryId: headers['x-zm-trackingid'] || undefined,
      status: isVerified ? WebhookEventStatus.verified : WebhookEventStatus.failed,
      verified: isVerified,
      headers,
      payload,
    },
  });

  if (!isVerified) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (payload.event === 'meeting.ended') {
    const result = await processZoomMeetingCompletedEvent(payload, prisma);

    if (result.outcome === 'processed' && result.meetingId) {
      if (result.shouldQueueAutomation && result.userId) {
        await AutomationOrchestrator.queueZoomMeetingCompletionPipeline({
          userId: result.userId,
          connectedAccountId: result.connectedAccountId,
          meetingId: result.meetingId,
        });
      }

      await prisma.webhookEvent.update({
        where: { id: eventRecord.id },
        data: {
          status: WebhookEventStatus.processed,
          processedAt: new Date(),
          meetingId: result.meetingId,
        },
      });
    } else {
      await prisma.webhookEvent.update({
        where: { id: eventRecord.id },
        data: {
          status: WebhookEventStatus.ignored,
          processedAt: new Date(),
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
