import type { ConnectedAccount } from '@prisma/client';

import { GoogleClientFactory } from './google-client-factory';

export class GoogleCalendarService {
  static getConnectionSummary(
    account: Pick<ConnectedAccount, 'accountEmail' | 'scopes' | 'lastSyncedAt'>,
  ) {
    return {
      accountEmail: account.accountEmail,
      scopes: account.scopes,
      lastSyncedAt: account.lastSyncedAt,
      features: ['Meeting sync', 'Follow-up creation', 'Future automation triggers'],
    };
  }

  static createClient(account: Pick<ConnectedAccount, 'accessToken' | 'refreshToken'>) {
    return GoogleClientFactory.createCalendarClient({
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
    });
  }

  static async listCalendarSummaries(
    account: Pick<ConnectedAccount, 'accessToken' | 'refreshToken'>,
  ) {
    const client = this.createClient(account);
    const response = await client.calendarList.list();

    return (
      response.data.items?.map((calendar) => ({
        id: calendar.id ?? 'unknown',
        summary: calendar.summary ?? 'Untitled calendar',
      })) ?? []
    );
  }
}
