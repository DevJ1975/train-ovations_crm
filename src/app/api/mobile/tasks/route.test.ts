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

const mockTask = {
  id: 'task_1',
  title: 'Follow up with Jordan',
  explanation: 'Send a proposal draft.',
  status: 'generated', // RepTaskSuggestionStatus.generated
  priority: 'medium',  // AlertPriority.medium
  recommendedDueAt: new Date('2026-03-20T00:00:00.000Z'),
  repProfileId: 'rep_1',
  leadId: 'lead_1',
  accountId: null,
  opportunityId: null,
  createdAt: new Date('2026-03-10T12:00:00.000Z'),
  updatedAt: new Date('2026-03-10T12:00:00.000Z'),
};

describe('/api/mobile/tasks', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      repTaskSuggestion: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([mockTask]),
        create: vi.fn().mockResolvedValue(mockTask),
      },
    });
  });

  describe('GET', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      const res = await GET(new Request('http://localhost/api/mobile/tasks'));
      expect(res.status).toBe(401);
    });

    it('returns paginated pending tasks by default', async () => {
      const res = await GET(new Request('http://localhost/api/mobile/tasks'));
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.items).toHaveLength(1);
      expect(payload.items[0].status).toBe('pending'); // 'generated' maps to 'pending'
      expect(payload.items[0].dueDate).toBe('2026-03-20T00:00:00.000Z');
      expect(payload.items[0].createdAt).toBe('2026-03-10T12:00:00.000Z');
    });

    it('maps completed db status correctly', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        repTaskSuggestion: {
          count: vi.fn().mockResolvedValue(1),
          findMany: vi.fn().mockResolvedValue([{ ...mockTask, status: 'converted' }]),
        },
      });
      const res = await GET(new Request('http://localhost/api/mobile/tasks?status=completed'));
      const payload = await res.json();
      expect(payload.items[0].status).toBe('completed');
    });

    it('returns empty when no rep profile', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost/api/mobile/tasks'));
      const payload = await res.json();
      expect(payload.items).toHaveLength(0);
    });
  });

  describe('POST', () => {
    it('creates a task and returns 201', async () => {
      const res = await POST(
        new Request('http://localhost/api/mobile/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Follow up with Jordan', priority: 'high', leadId: 'lead_1' }),
        }),
      );
      const payload = await res.json();
      expect(res.status).toBe(201);
      expect(payload.status).toBe('pending');
      expect(payload.id).toBe('task_1');
    });

    it('returns 400 when title is missing', async () => {
      const res = await POST(
        new Request('http://localhost/api/mobile/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority: 'high' }),
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid JSON', async () => {
      const res = await POST(
        new Request('http://localhost/api/mobile/tasks', { method: 'POST', body: 'oops' }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 404 when no rep profile', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await POST(
        new Request('http://localhost/api/mobile/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Task' }),
        }),
      );
      expect(res.status).toBe(404);
    });
  });
});
