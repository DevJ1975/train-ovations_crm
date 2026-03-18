import { describe, expect, it } from 'vitest';

describe('MSW provider handlers', () => {
  it('intercepts Google Calendar requests', async () => {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    );
    const payload = (await response.json()) as {
      items: Array<{ summary: string }>;
    };

    expect(payload.items[0]?.summary).toBe('Primary Calendar');
  });

  it('intercepts Notion identity requests', async () => {
    const response = await fetch('https://api.notion.com/v1/users/me');
    const payload = (await response.json()) as { name: string };

    expect(payload.name).toBe('Trainovations Bot');
  });

  it('intercepts Resend email requests', async () => {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
    });
    const payload = (await response.json()) as { id: string };

    expect(payload.id).toBe('re_test_email_1');
  });
});
