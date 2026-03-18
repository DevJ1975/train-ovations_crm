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

const mockAccounts = [
  { id: 'acct_1', name: 'Apex Industrial', domain: 'apex.com', industry: 'Manufacturing', status: 'active' },
  { id: 'acct_2', name: 'BetaCorp', domain: 'betacorp.io', industry: 'SaaS', status: 'active' },
];

describe('/api/mobile/accounts', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      account: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi.fn().mockResolvedValue(mockAccounts),
      },
    });
  });

  it('returns 401 without auth', async () => {
    requireMobileAuth.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );
    const res = await GET(new Request('http://localhost/api/mobile/accounts'));
    expect(res.status).toBe(401);
  });

  it('returns paginated accounts', async () => {
    const res = await GET(new Request('http://localhost/api/mobile/accounts'));
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.items).toHaveLength(2);
    expect(payload.total).toBe(2);
    expect(payload.items[0].name).toBe('Apex Industrial');
  });

  it('returns empty result when no rep profile', async () => {
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    });
    const res = await GET(new Request('http://localhost/api/mobile/accounts'));
    const payload = await res.json();
    expect(payload.items).toHaveLength(0);
    expect(payload.total).toBe(0);
  });

  it('passes search param to db filter', async () => {
    const mockFindMany = vi.fn().mockResolvedValue([]);
    const mockCount = vi.fn().mockResolvedValue(0);
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      account: { count: mockCount, findMany: mockFindMany },
    });

    await GET(new Request('http://localhost/api/mobile/accounts?search=apex&page=2&pageSize=5'));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    );
  });
});
