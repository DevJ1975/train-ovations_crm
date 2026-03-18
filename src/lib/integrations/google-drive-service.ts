import type { ConnectedAccount } from '@prisma/client';

import { GoogleClientFactory } from './google-client-factory';

export class GoogleDriveService {
  static getConnectionSummary(account: Pick<ConnectedAccount, 'accountEmail' | 'scopes'>) {
    return {
      accountEmail: account.accountEmail,
      scopes: account.scopes,
      features: ['Artifact storage', 'Recording handoff', 'Future transcript pipeline'],
    };
  }

  static createClient(account: Pick<ConnectedAccount, 'accessToken' | 'refreshToken'>) {
    return GoogleClientFactory.createDriveClient({
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
    });
  }

  static async listRecentFiles(
    account: Pick<ConnectedAccount, 'accessToken' | 'refreshToken'>,
  ) {
    const client = this.createClient(account);
    const response = await client.files.list({
      pageSize: 5,
      fields: 'files(id,name,webViewLink)',
      orderBy: 'modifiedTime desc',
    });

    return response.data.files ?? [];
  }
}
