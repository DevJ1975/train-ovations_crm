import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAuthenticatedUser, getPrismaClient } = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({ requireAuthenticatedUser }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET } from './route';

const mockDupe = {
  id: 'lead_1',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  status: 'new',
  company: 'Acme',
};

describe('/api/workspace/leads/check-duplicate', () => {
  beforeEach(() => {
    requireAuthenticatedUser.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      lead: { findMany: vi.fn().mockResolvedValue([mockDupe]) },
    });
  });

  it('returns 403 for non-sales_rep', async () => {
    requireAuthenticatedUser.mockResolvedValue({ id: 'user_1', role: 'admin' });
    const res = await GET(new Request('http://localhost/api/workspace/leads/check-duplicate?email=jane@example.com'));
    expect(res.status).toBe(403);
  });

  it('returns empty array with no query params', async () => {
    const res = await GET(new Request('http://localhost/api/workspace/leads/check-duplicate'));
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.duplicates).toHaveLength(0);
  });

  it('returns empty array when no rep profile', async () => {
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    });
    const res = await GET(new Request('http://localhost/api/workspace/leads/check-duplicate?email=jane@example.com'));
    const payload = await res.json();
    expect(payload.duplicates).toHaveLength(0);
  });

  it('returns duplicates when email matches', async () => {
    const res = await GET(new Request('http://localhost/api/workspace/leads/check-duplicate?email=jane@example.com'));
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.duplicates).toHaveLength(1);
    expect(payload.duplicates[0].email).toBe('jane@example.com');
  });

  it('queries by firstName + lastName when provided', async () => {
    const mockFindMany = vi.fn().mockResolvedValue([mockDupe]);
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'rep_1' }) },
      lead: { findMany: mockFindMany },
    });

    await GET(new Request('http://localhost/api/workspace/leads/check-duplicate?firstName=Jane&lastName=Smith'));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      }),
    );
  });
});
