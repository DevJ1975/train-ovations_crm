import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireMobileAuth, getPrismaClient } = vi.hoisted(() => ({
  requireMobileAuth: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/mobile', () => ({ requireMobileAuth }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET, PATCH } from './route';
import { NextResponse } from 'next/server';

const mockTask = {
  id: 'task_1',
  title: 'Follow up',
  explanation: null,
  status: 'generated',
  priority: 'medium',
  recommendedDueAt: null,
  repProfileId: 'rep_1',
  leadId: null,
  createdAt: new Date('2026-03-10T12:00:00.000Z'),
  updatedAt: new Date('2026-03-10T12:00:00.000Z'),
};

const ctx = { params: Promise.resolve({ id: 'task_1' }) };

describe('/api/mobile/tasks/[id]', () => {
  beforeEach(() => {
    requireMobileAuth.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      repTaskSuggestion: {
        findFirst: vi.fn().mockResolvedValue(mockTask),
        update: vi.fn().mockResolvedValue(mockTask),
      },
    });
  });

  describe('GET', () => {
    it('returns 401 without auth', async () => {
      requireMobileAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      const res = await GET(new Request('http://localhost/api/mobile/tasks/task_1'), ctx);
      expect(res.status).toBe(401);
    });

    it('returns serialized task', async () => {
      const res = await GET(new Request('http://localhost/api/mobile/tasks/task_1'), ctx);
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.id).toBe('task_1');
      expect(payload.status).toBe('pending');
      expect(payload.dueDate).toBeNull();
    });

    it('returns 404 when task not found', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        repTaskSuggestion: { findFirst: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost/api/mobile/tasks/task_1'), ctx);
      expect(res.status).toBe(404);
    });

    it('returns 404 when no rep profile', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET(new Request('http://localhost/api/mobile/tasks/task_1'), ctx);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH', () => {
    it('marks task as completed', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        repTaskSuggestion: {
          findFirst: vi.fn().mockResolvedValue(mockTask),
          update: vi.fn().mockResolvedValue({ ...mockTask, status: 'converted' }),
        },
      });
      const res = await PATCH(
        new Request('http://localhost/api/mobile/tasks/task_1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        }),
        ctx,
      );
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.status).toBe('completed');
    });

    it('returns 400 for invalid JSON', async () => {
      const res = await PATCH(
        new Request('http://localhost/api/mobile/tasks/task_1', { method: 'PATCH', body: 'bad' }),
        ctx,
      );
      expect(res.status).toBe(400);
    });

    it('returns 404 when task not found', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
        repTaskSuggestion: { findFirst: vi.fn().mockResolvedValue(null) },
      });
      const res = await PATCH(
        new Request('http://localhost/api/mobile/tasks/task_1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        }),
        ctx,
      );
      expect(res.status).toBe(404);
    });
  });
});
