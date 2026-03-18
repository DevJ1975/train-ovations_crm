import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireMobileAuth, getPrismaClient } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({ requireMobileAuth }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET } from './route';
import { NextResponse } from 'next/server';

const mockUser = {
  id: 'user_1',
  name: 'Jay Jones',
  email: 'jay@trainovations.com',
  role: 'sales_rep',
  mustChangePassword: false,
  repProfile: {
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
  },
};

describe('/api/mobile/me', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      user: {
        findUnique: vi.fn().mockResolvedValue(mockUser),
      },
    });
  });

  it('returns 401 without auth', async () => {
    requireMobileAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    const res = await GET(new Request('http://localhost/api/mobile/me'));
    expect(res.status).toBe(401);
  });

  it('returns user and repProfile for authenticated user', async () => {
    const res = await GET(new Request('http://localhost/api/mobile/me'));
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.user.id).toBe('user_1');
    expect(payload.user.email).toBe('jay@trainovations.com');
    expect(payload.repProfile.id).toBe('rep_1');
    expect(payload.repProfile.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('returns repProfile as null when user has no profile', async () => {
    getPrismaClient.mockReturnValue({
      user: {
        findUnique: vi.fn().mockResolvedValue({ ...mockUser, repProfile: null }),
      },
    });
    const res = await GET(new Request('http://localhost/api/mobile/me'));
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.repProfile).toBeNull();
  });

  it('returns 404 when user not found in db', async () => {
    getPrismaClient.mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue(null) },
    });
    const res = await GET(new Request('http://localhost/api/mobile/me'));
    expect(res.status).toBe(404);
  });
});
