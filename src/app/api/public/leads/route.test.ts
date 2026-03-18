import { LeadStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/services', () => ({
  createLeadFromPublicLandingPage: vi.fn(),
}));

vi.mock('@/lib/security/upstash-rate-limit', () => ({
  limitPublicRequest: vi.fn(),
  applyRateLimitHeaders: (
    response: Response,
    rateLimit: { remaining: number; limit?: number; reset?: number },
  ) => {
    if (typeof rateLimit.limit === 'number') {
      response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
    }

    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));

    if (typeof rateLimit.reset === 'number') {
      response.headers.set('X-RateLimit-Reset', String(rateLimit.reset));
    }

    return response;
  },
}));

import { POST } from './route';
import { createLeadFromPublicLandingPage } from '@/lib/services';
import { limitPublicRequest } from '@/lib/security/upstash-rate-limit';

describe('POST /api/public/leads', () => {
  beforeEach(() => {
    vi.mocked(limitPublicRequest).mockResolvedValue({
      allowed: true,
      remaining: 4,
    });
  });

  it('creates a lead and returns a structured response', async () => {
    vi.mocked(createLeadFromPublicLandingPage).mockResolvedValueOnce({
      outcome: 'created',
      lead: {
        id: 'lead_1',
        status: LeadStatus.new,
        duplicateOfLeadId: null,
      },
    } as never);

    const response = await POST(
      new Request('http://localhost/api/public/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
        body: JSON.stringify({
          repSlug: 'jay-jones',
          landingPageId: 'ck1234567890123456789012',
          firstName: 'Taylor',
          lastName: 'Brooks',
          email: 'taylor@company.com',
          consent: true,
          companyEmailWebsite: '',
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      leadId: 'lead_1',
      status: LeadStatus.new,
      duplicateOfLeadId: null,
    });
  });

  it('returns 202 for honeypot submissions', async () => {
    vi.mocked(createLeadFromPublicLandingPage).mockResolvedValueOnce({
      outcome: 'spam',
    } as never);

    const response = await POST(
      new Request('http://localhost/api/public/leads', {
        method: 'POST',
        body: JSON.stringify({
          repSlug: 'jay-jones',
          landingPageId: 'ck1234567890123456789012',
          firstName: 'Spam',
          lastName: 'Bot',
          email: 'spam@example.com',
          consent: true,
          companyEmailWebsite: 'spam',
        }),
      }),
    );

    expect(response.status).toBe(202);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(limitPublicRequest).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
    });

    const response = await POST(
      new Request('http://localhost/api/public/leads', {
        method: 'POST',
        body: JSON.stringify({
          repSlug: 'jay-jones',
          landingPageId: 'ck1234567890123456789012',
          firstName: 'Taylor',
          lastName: 'Brooks',
          email: 'taylor@company.com',
          consent: true,
          companyEmailWebsite: '',
        }),
      }),
    );

    expect(response.status).toBe(429);
  });

  it('applies rate limit headers to successful responses', async () => {
    vi.mocked(limitPublicRequest).mockResolvedValueOnce({
      allowed: true,
      remaining: 3,
      limit: 5,
      reset: 1710301000,
    });
    vi.mocked(createLeadFromPublicLandingPage).mockResolvedValueOnce({
      outcome: 'created',
      lead: {
        id: 'lead_2',
        status: LeadStatus.new,
        duplicateOfLeadId: null,
      },
    } as never);

    const response = await POST(
      new Request('http://localhost/api/public/leads', {
        method: 'POST',
        body: JSON.stringify({
          repSlug: 'jay-jones',
          landingPageId: 'ck1234567890123456789012',
          firstName: 'Taylor',
          lastName: 'Brooks',
          email: 'taylor@company.com',
          consent: true,
          companyEmailWebsite: '',
        }),
      }),
    );

    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('3');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('1710301000');
  });

  it('returns 404 for unknown reps', async () => {
    vi.mocked(createLeadFromPublicLandingPage).mockResolvedValueOnce({
      outcome: 'not_found',
    } as never);

    const response = await POST(
      new Request('http://localhost/api/public/leads', {
        method: 'POST',
        body: JSON.stringify({
          repSlug: 'missing',
          landingPageId: 'ck1234567890123456789012',
          firstName: 'Taylor',
          lastName: 'Brooks',
          email: 'taylor@company.com',
          consent: true,
          companyEmailWebsite: '',
        }),
      }),
    );

    expect(response.status).toBe(404);
  });
});
