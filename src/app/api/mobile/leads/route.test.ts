import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireMobileAuth, getPrismaClient, createLead } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
  createLead: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({ requireMobileAuth, paginated: (items: unknown[], total: number, page: number, pageSize: number) => ({ items, total, page, pageSize, hasMore: page * pageSize < total }) }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));
vi.mock('@/lib/services', () => ({ createLead }));

import { GET, POST } from './route';
import { NextResponse } from 'next/server';

const mockLead = {
  id: 'lead_1',
  firstName: 'Jordan',
  lastName: 'Lee',
  email: 'jordan@apex.com',
  company: 'Apex Industrial',
  status: 'new',
  createdAt: new Date('2026-03-10T12:00:00.000Z'),
};

const fullLead = {
  ...mockLead,
  phone: null,
  jobTitle: null,
  interest: null,
  notes: null,
  repProfileId: 'rep_1',
  updatedAt: new Date('2026-03-10T12:00:00.000Z'),
};

describe('/api/mobile/leads', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: {
        findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }),
      },
      lead: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([mockLead]),
        create: vi.fn().mockResolvedValue(fullLead),
      },
    });
  });

  describe('GET', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      const res = await GET(new Request('http://localhost/api/mobile/leads'));
      expect(res.status).toBe(401);
    });

    it('returns paginated leads', async () => {
      const res = await GET(new Request('http://localhost/api/mobile/leads'));
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.items).toHaveLength(1);
      expect(payload.items[0].createdAt).toBe('2026-03-10T12:00:00.000Z');
      expect(payload.total).toBe(1);
      expect(payload.page).toBe(1);
      expect(payload.pageSize).toBe(20);
    });

    it('returns empty paginated result when no rep profile', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost/api/mobile/leads'));
      const payload = await res.json();
      expect(payload.items).toHaveLength(0);
      expect(payload.total).toBe(0);
    });

    it('forwards search and status query params to db filter', async () => {
      const mockFindMany = vi.fn().mockResolvedValue([]);
      const mockCount = vi.fn().mockResolvedValue(0);
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        lead: { count: mockCount, findMany: mockFindMany },
      });

      await GET(new Request('http://localhost/api/mobile/leads?search=Jordan&status=new&page=2&pageSize=10'));

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'new', repProfileId: 'rep_1' }),
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('POST', () => {
    beforeEach(() => {
      createLead.mockResolvedValue(fullLead);
    });

    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      const res = await POST(new Request('http://localhost/api/mobile/leads', { method: 'POST', body: '{}' }));
      expect(res.status).toBe(401);
    });

    it('creates a lead and returns 201', async () => {
      const mockCreate = vi.fn().mockResolvedValue(fullLead);
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        lead: { count: vi.fn(), findMany: vi.fn(), create: mockCreate },
      });
      const res = await POST(
        new Request('http://localhost/api/mobile/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName: 'Jordan', lastName: 'Lee', email: 'jordan@apex.com', company: 'Apex Industrial' }),
        }),
      );
      const payload = await res.json();
      expect(res.status).toBe(201);
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ firstName: 'Jordan', repProfileId: 'rep_1' }) }));
      expect(payload.createdAt).toBe('2026-03-10T12:00:00.000Z');
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await POST(
        new Request('http://localhost/api/mobile/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName: 'Jordan' }),
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 404 when no rep profile', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await POST(
        new Request('http://localhost/api/mobile/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName: 'Jordan', lastName: 'Lee', email: 'jordan@apex.com' }),
        }),
      );
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid JSON', async () => {
      const res = await POST(
        new Request('http://localhost/api/mobile/leads', {
          method: 'POST',
          body: 'not-json',
        }),
      );
      expect(res.status).toBe(400);
    });
  });
});
