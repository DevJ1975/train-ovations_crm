import { describe, expect, it } from 'vitest';

import { NotionClientFactory } from './notion-client-factory';

describe('NotionClientFactory', () => {
  it('creates an official Notion SDK client', () => {
    const client = NotionClientFactory.create('notion-token');

    expect(client).toBeDefined();
  });
});
