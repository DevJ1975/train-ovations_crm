import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const { requireMobileAuth, getPrismaClient } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({ requireMobileAuth }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET, PATCH, DELETE } from './route';

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
  ocrRaw: null,
  createdAt: new Date('2026-03-10T09:00:00.000Z'),
  updatedAt: new Date('2026-03-10T09:00:00.000Z'),
};

const ctx = { params: Promise.resolve({ id: 'exp_1' }) };

describe('/api/mobile/expenses/[id]', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      expense: {
        findFirst: vi.fn().mockResolvedValue(mockExpense),
        update: vi.fn().mockResolvedValue(mockExpense),
        delete: vi.fn().mockResolvedValue(mockExpense),
      },
    });
  });

  describe('GET', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      );
      const res = await GET(new Request('http://localhost/api/mobile/expenses/exp_1'), ctx);
      expect(res.status).toBe(401);
    });

    it('returns expense with serialized dates', async () => {
      const res = await GET(new Request('http://localhost/api/mobile/expenses/exp_1'), ctx);
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.id).toBe('exp_1');
      expect(payload.amount).toBe(42.5);
      expect(payload.date).toBe('2026-03-10T08:00:00.000Z');
      expect(payload.createdAt).toBe('2026-03-10T09:00:00.000Z');
    });

    it('returns 404 when expense not found', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        expense: { findFirst: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost/api/mobile/expenses/exp_1'), ctx);
      expect(res.status).toBe(404);
    });

    it('returns 404 when rep profile not found', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost/api/mobile/expenses/exp_1'), ctx);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      );
      const res = await PATCH(
        new Request('http://localhost/api/mobile/expenses/exp_1', { method: 'PATCH', body: '{}' }),
        ctx,
      );
      expect(res.status).toBe(401);
    });

    it('updates expense and returns updated record', async () => {
      const updated = { ...mockExpense, amount: 55.0, vendor: 'Delta Airlines', category: 'travel' };
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        expense: {
          findFirst: vi.fn().mockResolvedValue(mockExpense),
          update: vi.fn().mockResolvedValue(updated),
        },
      });

      const res = await PATCH(
        new Request('http://localhost/api/mobile/expenses/exp_1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 55.0, category: 'travel' }),
        }),
        ctx,
      );
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.amount).toBe(55.0);
      expect(payload.category).toBe('travel');
    });

    it('returns 400 for invalid JSON', async () => {
      const res = await PATCH(
        new Request('http://localhost/api/mobile/expenses/exp_1', {
          method: 'PATCH',
          body: 'bad-json',
        }),
        ctx,
      );
      expect(res.status).toBe(400);
    });

    it('returns 404 when expense not found', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        expense: { findFirst: vi.fn().mockResolvedValue(null) },
      });
      const res = await PATCH(
        new Request('http://localhost/api/mobile/expenses/exp_1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 10 }),
        }),
        ctx,
      );
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      );
      const res = await DELETE(
        new Request('http://localhost/api/mobile/expenses/exp_1', { method: 'DELETE' }),
        ctx,
      );
      expect(res.status).toBe(401);
    });

    it('deletes expense and returns { ok: true }', async () => {
      const res = await DELETE(
        new Request('http://localhost/api/mobile/expenses/exp_1', { method: 'DELETE' }),
        ctx,
      );
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.ok).toBe(true);
    });

    it('returns 404 when expense not found', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        expense: { findFirst: vi.fn().mockResolvedValue(null) },
      });
      const res = await DELETE(
        new Request('http://localhost/api/mobile/expenses/exp_1', { method: 'DELETE' }),
        ctx,
      );
      expect(res.status).toBe(404);
    });
  });
});
