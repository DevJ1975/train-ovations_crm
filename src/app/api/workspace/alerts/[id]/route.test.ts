import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAuthenticatedUser, updateRepAlertStatus } = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  updateRepAlertStatus: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  requireAuthenticatedUser,
}));

vi.mock('@/lib/services', () => ({
  updateRepAlertStatus,
}));

import { PATCH } from './route';

describe('/api/workspace/alerts/[id]', () => {
  beforeEach(() => {
    requireAuthenticatedUser.mockResolvedValue({
      id: 'user_1',
      role: 'sales_rep',
    });
    updateRepAlertStatus.mockResolvedValue({
      id: 'alert_1',
      title: 'Champion changed companies',
      message: 'A key contact moved to a new organization.',
      priority: 'urgent',
      status: 'resolved',
      suggestedNextStep: 'Reach out within 48 hours.',
      triggeredAt: new Date('2026-03-14T12:00:00.000Z'),
      resolvedAt: new Date('2026-03-14T14:00:00.000Z'),
      lead: {
        id: 'lead_1',
        firstName: 'Alex',
        lastName: 'Stone',
        company: 'Metro Transit Systems',
        email: 'alex@metrotransit.com',
      },
    });
  });

  it('updates the alert status for the authenticated rep', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/workspace/alerts/alert_1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'resolved' }),
      }),
      {
        params: Promise.resolve({ id: 'alert_1' }),
      },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(updateRepAlertStatus).toHaveBeenCalledWith('user_1', 'alert_1', 'resolved');
    expect(payload.alert.resolvedAt).toBe('2026-03-14T14:00:00.000Z');
  });
});
