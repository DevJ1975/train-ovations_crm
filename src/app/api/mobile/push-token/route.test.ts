import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireMobileAuth, getPrismaClient } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({ requireMobileAuth }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { POST } from './route';
import { NextResponse } from 'next/server';

describe('/api/mobile/push-token', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    });
  });

  it('returns 401 without auth', async () => {
    requireMobileAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    const res = await POST(new Request('http://localhost/api/mobile/push-token', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(401);
  });

  it('stores push token and returns ok', async () => {
    const res = await POST(
      new Request('http://localhost/api/mobile/push-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'ExponentPushToken[abc123]' }),
      }),
    );
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.ok).toBe(true);
    const db = getPrismaClient();
    expect(db.repProfile.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user_1' },
      data: { pushToken: 'ExponentPushToken[abc123]' },
    });
  });

  it('returns 400 when token is missing', async () => {
    const res = await POST(
      new Request('http://localhost/api/mobile/push-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON', async () => {
    const res = await POST(
      new Request('http://localhost/api/mobile/push-token', { method: 'POST', body: 'bad' }),
    );
    expect(res.status).toBe(400);
  });
});
