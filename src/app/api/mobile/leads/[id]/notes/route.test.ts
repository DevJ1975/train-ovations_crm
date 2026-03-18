import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireMobileAuth, getPrismaClient } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({ requireMobileAuth }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET, POST } from './route';
import { NextResponse } from 'next/server';

const ctx = { params: Promise.resolve({ id: 'lead_1' }) };

const mockNote = {
  id: 'note_1',
  title: 'Intro call',
  body: 'Discussed pricing and timeline.',
  templateType: 'call',
  repProfileId: 'rep_1',
  leadId: 'lead_1',
  accountId: null,
  opportunityId: null,
  createdAt: new Date('2026-03-11T08:00:00.000Z'),
  updatedAt: new Date('2026-03-11T08:00:00.000Z'),
};

describe('/api/mobile/leads/[id]/notes', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      lead: { findFirst: vi.fn().mockResolvedValue({ id: 'lead_1' }) },
      repNote: {
        findMany: vi.fn().mockResolvedValue([mockNote]),
        create: vi.fn().mockResolvedValue(mockNote),
      },
    });
  });

  describe('GET', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      const res = await GET(new Request('http://localhost/api/mobile/leads/lead_1/notes'), ctx);
      expect(res.status).toBe(401);
    });

    it('returns notes for a lead', async () => {
      const res = await GET(new Request('http://localhost/api/mobile/leads/lead_1/notes'), ctx);
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload).toHaveLength(1);
      expect(payload[0].createdAt).toBe('2026-03-11T08:00:00.000Z');
    });

    it('returns empty array when no rep profile', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost/api/mobile/leads/lead_1/notes'), ctx);
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload).toEqual([]);
    });

    it('returns 404 when lead does not belong to rep', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        lead: { findFirst: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost/api/mobile/leads/lead_1/notes'), ctx);
      expect(res.status).toBe(404);
    });
  });

  describe('POST', () => {
    it('creates a note and returns 201', async () => {
      const res = await POST(
        new Request('http://localhost/api/mobile/leads/lead_1/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: 'Discussed pricing.', templateType: 'call' }),
        }),
        ctx,
      );
      const payload = await res.json();
      expect(res.status).toBe(201);
      expect(payload.leadId).toBe('lead_1');
    });

    it('returns 400 when body field is missing', async () => {
      const res = await POST(
        new Request('http://localhost/api/mobile/leads/lead_1/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'No body here' }),
        }),
        ctx,
      );
      expect(res.status).toBe(400);
    });

    it('returns 404 when lead not found', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        lead: { findFirst: vi.fn().mockResolvedValue(null) },
      });
      const res = await POST(
        new Request('http://localhost/api/mobile/leads/lead_1/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: 'A note.' }),
        }),
        ctx,
      );
      expect(res.status).toBe(404);
    });
  });
});
