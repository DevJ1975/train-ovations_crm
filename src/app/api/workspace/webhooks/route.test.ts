import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAuthenticatedUser, getPrismaClient } = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({ requireAuthenticatedUser }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));

import { GET, POST } from './route';

const mockWebhook = {
  id: 'wh_1',
  userId: 'user_1',
  url: 'https://example.com/hook',
  events: ['lead.created'],
  secret: 'abc123',
  description: 'Test hook',
  isActive: true,
  createdAt: new Date('2026-03-17T00:00:00.000Z'),
};

describe('/api/workspace/webhooks', () => {
  beforeEach(() => {
    requireAuthenticatedUser.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getPrismaClient.mockReturnValue({
      webhookEndpoint: {
        findMany: vi.fn().mockResolvedValue([mockWebhook]),
        create: vi.fn().mockResolvedValue(mockWebhook),
      },
    });
  });

  describe('GET', () => {
    it('returns webhooks list', async () => {
      const res = await GET();
      const payload = await res.json();
      expect(res.status).toBe(200);
      expect(payload.webhooks).toHaveLength(1);
      expect(payload.webhooks[0].url).toBe('https://example.com/hook');
    });
  });

  describe('POST', () => {
    it('returns 400 with missing url', async () => {
      const res = await POST(new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: ['lead.created'] }),
      }));
      expect(res.status).toBe(400);
    });

    it('returns 400 with missing events array', async () => {
      const res = await POST(new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/hook' }),
      }));
      expect(res.status).toBe(400);
    });

    it('creates webhook and returns 201 with secret', async () => {
      const res = await POST(new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/hook', events: ['lead.created'] }),
      }));
      const payload = await res.json();
      expect(res.status).toBe(201);
      expect(payload.webhook).toBeDefined();
      expect(typeof payload.secret).toBe('string');
      expect(payload.secret.length).toBeGreaterThan(0);
    });

    it('generates a unique secret on each creation', async () => {
      const mockCreate = vi.fn().mockResolvedValue(mockWebhook);
      getPrismaClient.mockReturnValue({
        webhookEndpoint: { create: mockCreate },
      });

      await POST(new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/hook', events: ['lead.created'] }),
      }));

      const callData = mockCreate.mock.calls[0][0].data;
      expect(callData.secret).toHaveLength(64); // 32 bytes hex = 64 chars
    });
  });
});
