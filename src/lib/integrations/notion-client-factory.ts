import { Client } from '@notionhq/client';

export class NotionClientFactory {
  static create(accessToken?: string | null) {
    return new Client({
      auth: accessToken ?? process.env.NOTION_INTERNAL_INTEGRATION_TOKEN ?? undefined,
    });
  }
}
