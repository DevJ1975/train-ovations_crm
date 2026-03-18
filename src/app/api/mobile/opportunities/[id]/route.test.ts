import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const { requireMobileAuth, getPrismaClient } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({ requireMobileAuth }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET } from './route';

const mockOpp = {
  id: 'opp_1',
  name: 'Apex Q1 Deal',
  stage: 'proposal',
  amountCents: 500000,
  currency: 'USD',
  targetCloseDate: new Date('2026-04-01T00:00:00.000Z'),
  accountId: 'acct_1',
  ownerRepProfileId: 'rep_1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const ctx = { params: Promise.resolve({ id: 'opp_1' }) };

describe('/api/mobile/opportunities/[id]', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      opportunity: { findFirst: vi.fn().mockResolvedValue(mockOpp) },
    });
  });

  it('returns 401 without auth', async () => {
    requireMobileAuth.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );
    const res = await GET(new Request('http://localhost/api/mobile/opportunities/opp_1'), ctx);
    expect(res.status).toBe(401);
  });

  it('returns opportunity with serialized dates', async () => {
    const res = await GET(new Request('http://localhost/api/mobile/opportunities/opp_1'), ctx);
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.id).toBe('opp_1');
    expect(payload.amountCents).toBe(500000);
    expect(payload.targetCloseDate).toBe('2026-04-01T00:00:00.000Z');
    expect(payload.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('serializes null targetCloseDate as null', async () => {
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      opportunity: { findFirst: vi.fn().mockResolvedValue({ ...mockOpp, targetCloseDate: null }) },
    });
    const res = await GET(new Request('http://localhost/api/mobile/opportunities/opp_1'), ctx);
    const payload = await res.json();
    expect(payload.targetCloseDate).toBeNull();
  });

  it('returns 404 when rep profile not found', async () => {
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    });
    const res = await GET(new Request('http://localhost/api/mobile/opportunities/opp_1'), ctx);
    expect(res.status).toBe(404);
  });

  it('returns 404 when opportunity does not belong to rep', async () => {
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      opportunity: { findFirst: vi.fn().mockResolvedValue(null) },
    });
    const res = await GET(new Request('http://localhost/api/mobile/opportunities/opp_1'), ctx);
    expect(res.status).toBe(404);
  });
});
