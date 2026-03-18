import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAuthenticatedUser, getPrismaClient } = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({ requireAuthenticatedUser }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { POST } from './route';

describe('/api/workspace/onboarding/complete', () => {
  const mockUpdate = vi.fn().mockResolvedValue({ id: 'rep_1' });

  beforeEach(() => {
    requireAuthenticatedUser.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { update: mockUpdate },
    });
    mockUpdate.mockClear();
  });

  it('returns 403 for non-sales_rep', async () => {
    requireAuthenticatedUser.mockResolvedValue({ id: 'user_1', role: 'admin' });
    const res = await POST();
    expect(res.status).toBe(403);
  });

  it('sets onboardingComplete to true and returns success', async () => {
    const res = await POST();
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user_1' },
        data: { onboardingComplete: true },
      }),
    );
  });
});
