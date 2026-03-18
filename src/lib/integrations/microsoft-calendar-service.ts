import { ConnectedProvider, SyncStatus } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import { MicrosoftGraphService } from './microsoft-graph-service';

export class MicrosoftCalendarService {
  /**
   * Sync upcoming calendar events from Microsoft Calendar into the CalendarEvent model.
   */
  static async syncEvents(userId: string, daysAhead = 30): Promise<{ synced: number }> {
    const accessToken = await MicrosoftGraphService.getAccessToken(
      userId,
      ConnectedProvider.microsoft_calendar,
    );
    if (!accessToken) throw new Error('No Microsoft Calendar access token found');

    const prisma = getPrismaClient();

    const now = new Date();
    const end = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const { value: events } = await MicrosoftGraphService.listCalendarEvents(accessToken, {
      startDateTime: now.toISOString(),
      endDateTime: end.toISOString(),
      top: 100,
    });

    let synced = 0;

    for (const event of events) {
      if (!event.start?.dateTime || !event.end?.dateTime) continue;

      const existing = await prisma.calendarEvent.findFirst({
        where: { userId, externalEventId: event.id },
      });

      const data = {
        title: event.subject ?? '(no title)',
        description: event.bodyPreview ?? null,
        startAt: new Date(event.start.dateTime),
        endAt: new Date(event.end.dateTime),
        sourceUrl: event.webLink ?? null,
        syncStatus: SyncStatus.success,
        lastSyncedAt: new Date(),
        rawPayload: event as object,
      };

      if (existing) {
        await prisma.calendarEvent.update({ where: { id: existing.id }, data });
      } else {
        await prisma.calendarEvent.create({
          data: {
            userId,
            provider: ConnectedProvider.microsoft_calendar,
            externalEventId: event.id,
            calendarId: 'primary',
            ...data,
          },
        });
        synced++;
      }
    }

    await prisma.connectedAccount.updateMany({
      where: { userId, provider: ConnectedProvider.microsoft_calendar },
      data: { lastSyncedAt: new Date() },
    });

    return { synced };
  }
}
