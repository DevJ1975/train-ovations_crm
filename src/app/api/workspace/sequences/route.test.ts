import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAuthenticatedUser, getPrismaClient } = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({ requireAuthenticatedUser }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET, POST } from './route';

const mockSequence = {
  id: 'seq_1',
  name: 'Welcome drip',
  description: 'Onboard new leads',
  isActive: true,
  createdAt: new Date('2026-03-17T00:00:00.000Z'),
  updatedAt: new Date('2026-03-17T00:00:00.000Z'),
  steps: [{ id: 'step_1', stepNumber: 1, delayDays: 1, subject: 'Hi', bodyTemplate: 'Hello {{firstName}}' }],
  _count: { enrollments: 3 },
};

describe('/api/workspace/sequences', () => {
  beforeEach(() => {
    requireAuthenticatedUser.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      followUpSequence: {
        findMany: vi.fn().mockResolvedValue([mockSequence]),
        create: vi.fn().mockResolvedValue(mockSequence),
      },
      $transaction: vi.fn().mockImplementation(async (fn: (db: unknown) => unknown) => {
        return fn({
          followUpSequence: {
            create: vi.fn().mockResolvedValue(mockSequence),
            findUnique: vi.fn().mockResolvedValue(mockSequence),
          },
          followUpStep: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
        });
      }),
    });
  });

  describe('GET', () => {
    it('returns 403 for non-sales_rep', async () => {
      requireAuthenticatedUser.mockResolvedValue({ id: 'user_1', role: 'admin' });
      const res = await GET();
      expect(res.status).toBe(403);
    });

    it('returns 404 when rep profile not found', async () => {
      getPrismaClient.mockReturnValue({
        repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const res = await GET();
      expect(res.status).toBe(404);
    });

    it('returns sequences with steps and enrollment count', async () => {
      const res = await GET();
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.sequences).toHaveLength(1);
      expect(payload.sequences[0].name).toBe('Welcome drip');
      expect(payload.sequences[0].enrollmentCount).toBe(3);
      expect(payload.sequences[0].steps).toHaveLength(1);
      expect(payload.sequences[0].createdAt).toBe('2026-03-17T00:00:00.000Z');
    });
  });

  describe('POST', () => {
    const validBody = {
      name: 'New sequence',
      steps: [{ delayDays: 1, subject: 'Hi', bodyTemplate: 'Hello {{firstName}}' }],
    };

    it('returns 400 when name is missing', async () => {
      const res = await POST(new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: validBody.steps }),
      }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when steps is empty', async () => {
      const res = await POST(new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', steps: [] }),
      }));
      expect(res.status).toBe(400);
    });

    it('creates sequence in a transaction and returns 201', async () => {
      const res = await POST(new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }));
      expect(res.status).toBe(201);
    });
  });
});
