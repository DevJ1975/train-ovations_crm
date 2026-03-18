import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const { requireMobileAuth, getPrismaClient } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({
  requireMobileAuth,
  paginated: (items: unknown[], total: number, page: number, pageSize: number) => ({
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  }),
}));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET, POST } from './route';

const mockExpense = {
  id: 'exp_1',
  repProfileId: 'rep_1',
  amount: 42.5,
  currency: 'USD',
  vendor: 'Starbucks',
  category: 'meals',
  date: new Date('2026-03-10T08:00:00.000Z'),
  notes: 'Client breakfast',
  receiptUrl: '/uploads/receipts/rep_1-001.jpg',
  createdAt: new Date('2026-03-10T09:00:00.000Z'),
  updatedAt: new Date('2026-03-10T09:00:00.000Z'),
};

const mockCreatedExpense = { ...mockExpense, ocrRaw: null };

describe('/api/mobile/expenses', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      expense: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([mockExpense]),
        create: vi.fn().mockResolvedValue(mockCreatedExpense),
      },
    });
  });

  describe('GET', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      );
      const res = await GET(new Request('http://localhost/api/mobile/expenses'));
      expect(res.status).toBe(401);
    });

    it('returns paginated expenses with serialized dates', async () => {
      const res = await GET(new Request('http://localhost/api/mobile/expenses'));
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.items).toHaveLength(1);
      expect(payload.total).toBe(1);
      expect(payload.items[0].date).toBe('2026-03-10T08:00:00.000Z');
      expect(payload.items[0].createdAt).toBe('2026-03-10T09:00:00.000Z');
      expect(payload.items[0].vendor).toBe('Starbucks');
    });

    it('returns empty result when no rep profile', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost/api/mobile/expenses'));
      const payload = await res.json();
      expect(payload.items).toHaveLength(0);
    });

    it('passes category filter to db query', async () => {
      const mockFindMany = vi.fn().mockResolvedValue([]);
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        expense: { count: vi.fn().mockResolvedValue(0), findMany: mockFindMany },
      });

      await GET(new Request('http://localhost/api/mobile/expenses?category=meals'));

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'meals' }),
        }),
      );
    });
  });

  describe('POST', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      );
      const res = await POST(
        new Request('http://localhost/api/mobile/expenses', { method: 'POST', body: '{}' }),
      );
      expect(res.status).toBe(401);
    });

    it('creates an expense and returns 201', async () => {
      const res = await POST(
        new Request('http://localhost/api/mobile/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 42.5, vendor: 'Starbucks', category: 'meals' }),
        }),
      );
      const payload = await res.json();
      expect(res.status).toBe(201);
      expect(payload.vendor).toBe('Starbucks');
      expect(payload.date).toBe('2026-03-10T08:00:00.000Z');
    });

    it('returns 400 when amount is missing', async () => {
      const res = await POST(
        new Request('http://localhost/api/mobile/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendor: 'Starbucks' }),
        }),
      );
      expect(res.status).toBe(400);
    });

    it('defaults category to "other" when invalid category provided', async () => {
      const mockCreate = vi.fn().mockResolvedValue(mockCreatedExpense);
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        expense: { create: mockCreate },
      });

      await POST(
        new Request('http://localhost/api/mobile/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 10, category: 'unknown_category' }),
        }),
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ category: 'other' }) }),
      );
    });

    it('returns 400 for invalid JSON', async () => {
      const res = await POST(
        new Request('http://localhost/api/mobile/expenses', {
          method: 'POST',
          body: 'not-json',
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 404 when rep profile not found', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await POST(
        new Request('http://localhost/api/mobile/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 10 }),
        }),
      );
      expect(res.status).toBe(404);
    });
  });
});
