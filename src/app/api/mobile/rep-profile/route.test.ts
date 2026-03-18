import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireMobileAuth, getPrismaClient } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({ requireMobileAuth }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET, PATCH } from './route';
import { NextResponse } from 'next/server';

const mockProfile = {
  id: 'rep_1',
  userId: 'user_1',
  displayName: 'Jay Jones',
  slug: 'jay-jones',
  firstName: 'Jay',
  lastName: 'Jones',
  title: 'Sales Rep',
  bio: null,
  email: 'jay@trainovations.com',
  phone: null,
  website: null,
  location: 'Dallas, TX',
  photoUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('/api/mobile/rep-profile', () => {
  const mockUpdate = vi.fn();

  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    mockUpdate.mockResolvedValue(mockProfile);
    getPrismaClient.mockReturnValue({
      repProfile: {
        findUnique: vi.fn().mockResolvedValue(mockProfile),
        update: mockUpdate,
      },
    });
  });

  describe('GET', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      const res = await GET(new Request('http://localhost/api/mobile/rep-profile'));
      expect(res.status).toBe(401);
    });

    it('returns serialized rep profile', async () => {
      const res = await GET(new Request('http://localhost/api/mobile/rep-profile'));
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.id).toBe('rep_1');
      expect(payload.createdAt).toBe('2026-01-01T00:00:00.000Z');
    });

    it('returns 404 when no profile', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost/api/mobile/rep-profile'));
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH', () => {
    it('updates the profile', async () => {
      mockUpdate.mockResolvedValue({ ...mockProfile, bio: 'Sales expert' });
      const res = await PATCH(
        new Request('http://localhost/api/mobile/rep-profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bio: 'Sales expert' }),
        }),
      );
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'rep_1' } }));
      expect(payload.bio).toBe('Sales expert');
    });

    it('returns 400 for invalid JSON', async () => {
      const res = await PATCH(
        new Request('http://localhost/api/mobile/rep-profile', { method: 'PATCH', body: 'bad' }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 404 when no profile', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await PATCH(
        new Request('http://localhost/api/mobile/rep-profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bio: 'X' }),
        }),
      );
      expect(res.status).toBe(404);
    });
  });
});
