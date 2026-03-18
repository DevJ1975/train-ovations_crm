import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAuthenticatedUser, getRepAlerts } = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  getRepAlerts: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  requireAuthenticatedUser,
}));

vi.mock('@/lib/services', () => ({
  getRepAlerts,
}));

import { GET } from './route';

describe('/api/workspace/alerts', () => {
  beforeEach(() => {
    requireAuthenticatedUser.mockResolvedValue({
      id: 'user_1',
      role: 'sales_rep',
    });
    getRepAlerts.mockResolvedValue([
      {
        id: 'alert_1',
        title: 'Champion changed companies',
        message: 'A key contact moved to a new organization.',
        priority: 'urgent',
        status: 'open',
        suggestedNextStep: 'Reach out within 48 hours.',
        triggeredAt: new Date('2026-03-14T12:00:00.000Z'),
        resolvedAt: null,
        lead: {
          id: 'lead_1',
          firstName: 'Alex',
          lastName: 'Stone',
          company: 'Metro Transit Systems',
          email: 'alex@metrotransit.com',
        },
      },
    ]);
  });

  it('returns workspace alerts for the authenticated rep', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(payload.alerts).toHaveLength(1);
    expect(payload.alerts[0].triggeredAt).toBe('2026-03-14T12:00:00.000Z');
  });
});
