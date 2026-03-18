import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireMobileAuth, getPrismaClient } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({ requireMobileAuth }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { DELETE } from './route';
import { NextResponse } from 'next/server';

const ctx = { params: Promise.resolve({ id: 'note_1' }) };

describe('/api/mobile/notes/[id]', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      repNote: {
        findFirst: vi.fn().mockResolvedValue({ id: 'note_1' }),
        delete: vi.fn().mockResolvedValue({}),
      },
    });
  });

  it('returns 401 without auth', async () => {
    requireMobileAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    const res = await DELETE(new Request('http://localhost/api/mobile/notes/note_1', { method: 'DELETE' }), ctx);
    expect(res.status).toBe(401);
  });

  it('deletes note and returns ok', async () => {
    const res = await DELETE(new Request('http://localhost/api/mobile/notes/note_1', { method: 'DELETE' }), ctx);
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.ok).toBe(true);
  });

  it('returns 404 when note does not belong to rep', async () => {
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      repNote: { findFirst: vi.fn().mockResolvedValue(null) },
    });
    const res = await DELETE(new Request('http://localhost/api/mobile/notes/note_1', { method: 'DELETE' }), ctx);
    expect(res.status).toBe(404);
  });

  it('returns 404 when no rep profile', async () => {
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    });
    const res = await DELETE(new Request('http://localhost/api/mobile/notes/note_1', { method: 'DELETE' }), ctx);
    expect(res.status).toBe(404);
  });
});
