import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const { requireMobileAuth, getPrismaClient } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({ requireMobileAuth }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET } from './route';

const mockAccount = {
  id: 'acct_1',
  name: 'Apex Industrial',
  domain: 'apex.com',
  industry: 'Manufacturing',
  status: 'active',
  hqLocation: 'Dallas, TX',
  description: 'Industrial equipment supplier',
  ownerRepProfileId: 'rep_1',
  createdAt: new Date('2026-01-15T00:00:00.000Z'),
  updatedAt: new Date('2026-01-15T00:00:00.000Z'),
};

const ctx = { params: Promise.resolve({ id: 'acct_1' }) };

describe('/api/mobile/accounts/[id]', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      account: { findFirst: vi.fn().mockResolvedValue(mockAccount) },
    });
  });

  it('returns 401 without auth', async () => {
    requireMobileAuth.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );
    const res = await GET(new Request('http://localhost/api/mobile/accounts/acct_1'), ctx);
    expect(res.status).toBe(401);
  });

  it('returns account detail with ISO dates', async () => {
    const res = await GET(new Request('http://localhost/api/mobile/accounts/acct_1'), ctx);
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.id).toBe('acct_1');
    expect(payload.name).toBe('Apex Industrial');
    expect(payload.createdAt).toBe('2026-01-15T00:00:00.000Z');
    expect(payload.hqLocation).toBe('Dallas, TX');
  });

  it('returns 404 when rep profile not found', async () => {
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    });
    const res = await GET(new Request('http://localhost/api/mobile/accounts/acct_1'), ctx);
    expect(res.status).toBe(404);
  });

  it('returns 404 when account does not belong to rep', async () => {
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      account: { findFirst: vi.fn().mockResolvedValue(null) },
    });
    const res = await GET(new Request('http://localhost/api/mobile/accounts/acct_1'), ctx);
    expect(res.status).toBe(404);
  });
});
