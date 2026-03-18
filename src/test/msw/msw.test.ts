import { describe, expect, it } from 'vitest';

describe('MSW test foundation', () => {
  it('intercepts external Google token requests in tests', async () => {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
    });
    const payload = (await response.json()) as { access_token: string };

    expect(payload.access_token).toBe('msw-google-token');
  });
});
