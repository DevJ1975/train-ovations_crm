import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPrismaClient } = vi.hoisted(() => ({
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { POST } from './route';

const mockRep = { id: 'rep_1', bookingEnabled: true, bookingDuration: 30 };
const mockCreate = vi.fn().mockResolvedValue({});

function makeParams(slug: string) {
  return Promise.resolve({ slug });
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/book/test-slug', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/book/[slug]', () => {
  beforeEach(() => {
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue(mockRep) },
      lead: { create: mockCreate },
      booking: { create: mockCreate },
    });
    mockCreate.mockClear();
  });

  it('returns 404 when rep not found', async () => {
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    });
    const res = await POST(makeRequest({}), { params: makeParams('unknown') });
    expect(res.status).toBe(404);
  });

  it('returns 404 when booking is disabled', async () => {
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue({ ...mockRep, bookingEnabled: false }) },
    });
    const res = await POST(makeRequest({}), { params: makeParams('test-slug') });
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid JSON', async () => {
    const res = await POST(
      new Request('http://localhost/api/book/test-slug', { method: 'POST', body: 'bad-json' }),
      { params: makeParams('test-slug') },
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeRequest({ guestName: 'Jane' }), { params: makeParams('test-slug') });
    expect(res.status).toBe(400);
  });

  it('creates lead and booking and returns 200', async () => {
    const res = await POST(
      makeRequest({
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        requestedAt: '2026-03-25T14:00:00.000Z',
      }),
      { params: makeParams('test-slug') },
    );
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('splits guest name into firstName + lastName for lead', async () => {
    const leadCreate = vi.fn().mockResolvedValue({});
    const bookingCreate = vi.fn().mockResolvedValue({});
    getPrismaClient.mockReturnValue({
      repProfile: { findUnique: vi.fn().mockResolvedValue(mockRep) },
      lead: { create: leadCreate },
      booking: { create: bookingCreate },
    });

    await POST(
      makeRequest({
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        requestedAt: '2026-03-25T14:00:00.000Z',
      }),
      { params: makeParams('test-slug') },
    );

    expect(leadCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ firstName: 'Jane', lastName: 'Smith' }),
      }),
    );
  });
});
