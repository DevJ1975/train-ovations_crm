import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAuthenticatedUser, getPrismaClient } = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({ requireAuthenticatedUser }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { PATCH } from './route';

const mockProfile = { id: 'rep_1' };
const mockUpdate = vi.fn().mockResolvedValue({ id: 'rep_1' });

describe('/api/workspace/rep-profile', () => {
  beforeEach(() => {
    requireAuthenticatedUser.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: {
        findUnique: vi.fn().mockResolvedValue(mockProfile),
        update: mockUpdate,
      },
    });
    mockUpdate.mockClear();
  });

  it('returns 403 for non-sales_rep', async () => {
    requireAuthenticatedUser.mockResolvedValue({ id: 'user_1', role: 'admin' });
    const res = await PATCH(new Request('http://localhost/api/workspace/rep-profile', { method: 'PATCH', body: '{}' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid JSON', async () => {
    const res = await PATCH(new Request('http://localhost/api/workspace/rep-profile', {
      method: 'PATCH',
      body: 'not-json',
    }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when rep profile not found', async () => {
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    });
    const res = await PATCH(new Request('http://localhost/api/workspace/rep-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Jay' }),
    }));
    expect(res.status).toBe(404);
  });

  it('updates profile fields and returns 200', async () => {
    const res = await PATCH(new Request('http://localhost/api/workspace/rep-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Jay Jones', title: 'Sales Rep' }),
    }));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rep_1' },
        data: expect.objectContaining({ displayName: 'Jay Jones', title: 'Sales Rep' }),
      }),
    );
  });

  it('updates booking fields', async () => {
    const res = await PATCH(new Request('http://localhost/api/workspace/rep-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingEnabled: true, bookingDuration: 45 }),
    }));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bookingEnabled: true, bookingDuration: 45 }),
      }),
    );
  });
});
