import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireMobileAuth, getPrismaClient } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({
  requireMobileAuth,
  paginated: (items: unknown[], total: number, page: number, pageSize: number) => ({ items, total, page, pageSize, hasMore: page * pageSize < total }),
}));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET, POST } from './route';
import { NextResponse } from 'next/server';

const mockNote = {
  id: 'note_1',
  title: 'Weekly check-in',
  body: 'Discussed Q2 targets.',
  templateType: 'blank',
  repProfileId: 'rep_1',
  leadId: null,
  accountId: null,
  opportunityId: null,
  createdAt: new Date('2026-03-12T10:00:00.000Z'),
  updatedAt: new Date('2026-03-12T10:00:00.000Z'),
};

describe('/api/mobile/notes', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      repNote: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([mockNote]),
        create: vi.fn().mockResolvedValue(mockNote),
      },
    });
  });

  describe('GET', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      const res = await GET(new Request('http://localhost/api/mobile/notes'));
      expect(res.status).toBe(401);
    });

    it('returns global notes (leadId=null)', async () => {
      const res = await GET(new Request('http://localhost/api/mobile/notes'));
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.items).toHaveLength(1);
      expect(payload.items[0].templateType).toBe('general'); // blank → general
      expect(payload.items[0].createdAt).toBe('2026-03-12T10:00:00.000Z');
    });

    it('returns empty when no rep profile', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost/api/mobile/notes'));
      const payload = await res.json();
      expect(payload.items).toHaveLength(0);
    });
  });

  describe('POST', () => {
    it('creates a global note and returns 201', async () => {
      const res = await POST(
        new Request('http://localhost/api/mobile/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: 'Discussed Q2 targets.', templateType: 'general' }),
        }),
      );
      const payload = await res.json();
      expect(res.status).toBe(201);
      expect(payload.templateType).toBe('general');
    });

    it('returns 400 when body field is missing', async () => {
      const res = await POST(
        new Request('http://localhost/api/mobile/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'No body' }),
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 404 when no rep profile', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await POST(
        new Request('http://localhost/api/mobile/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: 'A note.' }),
        }),
      );
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid JSON', async () => {
      const res = await POST(
        new Request('http://localhost/api/mobile/notes', { method: 'POST', body: 'not-json' }),
      );
      expect(res.status).toBe(400);
    });
  });
});
