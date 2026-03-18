import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const { requireMobileAuth, getPrismaClient } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({
  requireMobileAuth,
  paginated: (items: unknown[], total: number, page: number, pageSize: number) => ({
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  }),
}));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET } from './route';

const mockOpps = [
  {
    id: 'opp_1',
    name: 'Apex Q1 Deal',
    stage: 'proposal',
    amountCents: 500000,
    currency: 'USD',
    targetCloseDate: new Date('2026-04-01T00:00:00.000Z'),
  },
  {
    id: 'opp_2',
    name: 'BetaCorp Renewal',
    stage: 'negotiation',
    amountCents: 120000,
    currency: 'USD',
    targetCloseDate: null,
  },
];

describe('/api/mobile/opportunities', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      opportunity: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi.fn().mockResolvedValue(mockOpps),
      },
    });
  });

  it('returns 401 without auth', async () => {
    requireMobileAuth.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );
    const res = await GET(new Request('http://localhost/api/mobile/opportunities'));
    expect(res.status).toBe(401);
  });

  it('returns paginated opportunities with ISO dates', async () => {
    const res = await GET(new Request('http://localhost/api/mobile/opportunities'));
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.items).toHaveLength(2);
    expect(payload.total).toBe(2);
    expect(payload.items[0].targetCloseDate).toBe('2026-04-01T00:00:00.000Z');
    expect(payload.items[1].targetCloseDate).toBeNull();
  });

  it('returns empty result when no rep profile', async () => {
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    });
    const res = await GET(new Request('http://localhost/api/mobile/opportunities'));
    const payload = await res.json();
    expect(payload.items).toHaveLength(0);
  });

  it('passes stage filter to db query', async () => {
    const mockFindMany = vi.fn().mockResolvedValue([]);
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      opportunity: { count: vi.fn().mockResolvedValue(0), findMany: mockFindMany },
    });

    await GET(new Request('http://localhost/api/mobile/opportunities?stage=proposal'));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ stage: 'proposal' }),
      }),
    );
  });
});
