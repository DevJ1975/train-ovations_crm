import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const { requireMobileAuth, getPrismaClient } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({ requireMobileAuth }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET, POST } from './route';

const mockActivityLog = {
  id: 'act_1',
  description: 'Call logged: 2m 30s',
  metadata: { durationSeconds: 150, notes: 'Discussed pricing' },
  createdAt: new Date('2026-03-17T12:00:00.000Z'),
};

function makeCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('/api/mobile/leads/[id]/calls', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      lead: { findFirst: vi.fn().mockResolvedValue({ id: 'lead_1' }) },
      activityLog: {
        findMany: vi.fn().mockResolvedValue([mockActivityLog]),
        create: vi.fn().mockResolvedValue(mockActivityLog),
      },
      leadNote: { create: vi.fn().mockResolvedValue({ id: 'note_1' }) },
    });
  });

  describe('GET', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      const res = await GET(new Request('http://localhost'), makeCtx('lead_1'));
      expect(res.status).toBe(401);
    });

    it('returns 404 when lead not found', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        lead: { findFirst: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost'), makeCtx('lead_999'));
      expect(res.status).toBe(404);
    });

    it('returns call logs for a lead', async () => {
      const res = await GET(new Request('http://localhost'), makeCtx('lead_1'));
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(payload)).toBe(true);
      expect(payload[0].description).toBe('Call logged: 2m 30s');
      expect(payload[0].createdAt).toBe('2026-03-17T12:00:00.000Z');
    });

    it('returns empty array when no rep profile', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost'), makeCtx('lead_1'));
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload).toHaveLength(0);
    });
  });

  describe('POST', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      const res = await POST(new Request('http://localhost', { method: 'POST', body: '{}' }), makeCtx('lead_1'));
      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid JSON', async () => {
      const res = await POST(
        new Request('http://localhost', { method: 'POST', body: 'bad' }),
        makeCtx('lead_1'),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 when durationSeconds is missing', async () => {
      const res = await POST(
        new Request('http://localhost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: 'Great call' }),
        }),
        makeCtx('lead_1'),
      );
      expect(res.status).toBe(400);
    });

    it('creates activity log and note and returns 201', async () => {
      const res = await POST(
        new Request('http://localhost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ durationSeconds: 150, notes: 'Discussed pricing' }),
        }),
        makeCtx('lead_1'),
      );
      const payload = await res.json();
      expect(res.status).toBe(201);
      expect(payload.description).toBe('Call logged: 2m 30s');
      expect(payload.createdAt).toBe('2026-03-17T12:00:00.000Z');
    });

    it('includes durationSeconds in metadata', async () => {
      const mockCreate = vi.fn().mockResolvedValue(mockActivityLog);
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        lead: { findFirst: vi.fn().mockResolvedValue({ id: 'lead_1' }) },
        activityLog: { create: mockCreate },
        leadNote: { create: vi.fn().mockResolvedValue({ id: 'note_1' }) },
      });

      await POST(
        new Request('http://localhost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ durationSeconds: 90 }),
        }),
        makeCtx('lead_1'),
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({ durationSeconds: 90 }),
          }),
        }),
      );
    });
  });
});
