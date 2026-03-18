import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireMobileAuth, getPrismaClient } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({ requireMobileAuth }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET, PATCH } from './route';
import { NextResponse } from 'next/server';

const mockLead = {
  id: 'lead_1',
  firstName: 'Jordan',
  lastName: 'Lee',
  email: 'jordan@apex.com',
  phone: null,
  company: 'Apex Industrial',
  jobTitle: null,
  status: 'new',
  interest: null,
  notes: null,
  repProfileId: 'rep_1',
  createdAt: new Date('2026-03-10T12:00:00.000Z'),
  updatedAt: new Date('2026-03-10T12:00:00.000Z'),
};

const ctx = { params: Promise.resolve({ id: 'lead_1' }) };

describe('/api/mobile/leads/[id]', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      lead: {
        findFirst: vi.fn().mockResolvedValue(mockLead),
        update: vi.fn().mockResolvedValue(mockLead),
      },
    });
  });

  describe('GET', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      const res = await GET(new Request('http://localhost/api/mobile/leads/lead_1'), ctx);
      expect(res.status).toBe(401);
    });

    it('returns serialized lead', async () => {
      const res = await GET(new Request('http://localhost/api/mobile/leads/lead_1'), ctx);
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.id).toBe('lead_1');
      expect(payload.createdAt).toBe('2026-03-10T12:00:00.000Z');
      expect(payload.title).toBeNull(); // jobTitle → title
    });

    it('returns 404 when rep profile not found', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost/api/mobile/leads/lead_1'), ctx);
      expect(res.status).toBe(404);
    });

    it('returns 404 when lead does not belong to rep', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        lead: { findFirst: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost/api/mobile/leads/lead_1'), ctx);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      const res = await PATCH(new Request('http://localhost/api/mobile/leads/lead_1', { method: 'PATCH', body: '{}' }), ctx);
      expect(res.status).toBe(401);
    });

    it('updates and returns the lead', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ ...mockLead, status: 'contacted' });
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        lead: {
          findFirst: vi.fn().mockResolvedValue(mockLead),
          update: mockUpdate,
        },
      });
      const res = await PATCH(
        new Request('http://localhost/api/mobile/leads/lead_1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'contacted' }),
        }),
        ctx,
      );
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'lead_1' } }));
      expect(payload.status).toBe('contacted');
    });

    it('returns 400 for invalid JSON', async () => {
      const res = await PATCH(
        new Request('http://localhost/api/mobile/leads/lead_1', { method: 'PATCH', body: 'bad-json' }),
        ctx,
      );
      expect(res.status).toBe(400);
    });

    it('returns 404 when lead not found', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        lead: { findFirst: vi.fn().mockResolvedValue(null) },
      });
      const res = await PATCH(
        new Request('http://localhost/api/mobile/leads/lead_1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'contacted' }),
        }),
        ctx,
      );
      expect(res.status).toBe(404);
    });
  });
});
