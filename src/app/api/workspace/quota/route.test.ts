import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAuthenticatedUser, getPrismaClient } = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({ requireAuthenticatedUser }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET, POST } from './route';

const mockQuota = { id: 'q_1', repProfileId: 'rep_1', period: '2026-03', targetCents: 500000, closedCents: 120000 };

describe('/api/workspace/quota', () => {
  beforeEach(() => {
    requireAuthenticatedUser.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      repQuota: {
        findUnique: vi.fn().mockResolvedValue(mockQuota),
        upsert: vi.fn().mockResolvedValue(mockQuota),
      },
    });
  });

  describe('GET', () => {
    it('returns 403 for non-sales_rep', async () => {
      requireAuthenticatedUser.mockResolvedValue({ id: 'user_1', role: 'admin' });
      const res = await GET();
      expect(res.status).toBe(403);
    });

    it('returns 404 when rep profile not found', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET();
      expect(res.status).toBe(404);
    });

    it('returns current quota', async () => {
      const res = await GET();
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.quota.targetCents).toBe(500000);
    });

    it('returns null quota when none set', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        repQuota: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET();
      const payload = await res.json();
      expect(payload.quota).toBeNull();
    });
  });

  describe('POST', () => {
    it('returns 400 with invalid payload', async () => {
      const res = await POST(new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: '2026-03' }), // missing targetCents
      }));
      expect(res.status).toBe(400);
    });

    it('upserts quota and returns 200', async () => {
      const mockUpsert = vi.fn().mockResolvedValue(mockQuota);
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        repQuota: { upsert: mockUpsert },
      });

      const res = await POST(new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: '2026-03', targetCents: 500000 }),
      }));
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.quota.targetCents).toBe(500000);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: expect.objectContaining({ targetCents: 500000 }) }),
      );
    });
  });
});
