import { describe, expect, it } from 'vitest';

import { GoogleClientFactory } from './google-client-factory';

describe('GoogleClientFactory', () => {
  it('creates an OAuth client with credentials support', () => {
    const client = GoogleClientFactory.createOAuthClient({
      accessToken: 'token-1',
      refreshToken: 'refresh-1',
    });

    expect(client).toBeDefined();
    expect(client.credentials.access_token).toBe('token-1');
  });

  it('creates calendar, drive, and gmail clients from the same auth flow', () => {
    expect(GoogleClientFactory.createCalendarClient()).toBeDefined();
    expect(GoogleClientFactory.createDriveClient()).toBeDefined();
    expect(GoogleClientFactory.createGmailClient()).toBeDefined();
  });
});
