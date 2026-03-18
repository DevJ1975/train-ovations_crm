import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAuthenticatedUser, getRepLeadInbox, createLead, getPrismaClient } = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  getRepLeadInbox: vi.fn(),
  createLead: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  requireAuthenticatedUser,
}));

vi.mock('@/lib/prisma', () => ({
  getPrismaClient,
}));

vi.mock('@/lib/services', () => ({
  getRepLeadInbox,
  createLead,
}));

import { GET, POST } from './route';

describe('/api/workspace/leads', () => {
  beforeEach(() => {
    requireAuthenticatedUser.mockResolvedValue({
      id: 'user_1',
      role: 'sales_rep',
    });
    getPrismaClient.mockReturnValue({
      repProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'rep_1',
        }),
      },
      lead: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    });
    getRepLeadInbox.mockResolvedValue([
      {
        id: 'lead_1',
        firstName: 'Jordan',
        lastName: 'Lee',
        company: 'Apex Industrial',
        email: 'jordan@apex.com',
        phone: '555-101-1111',
        location: 'Dallas, Texas',
        status: 'new',
        interest: 'Pilot rollout',
        createdAt: new Date('2026-03-13T12:00:00.000Z'),
        landingPageSlug: 'jay-jones',
        openAlertCount: 2,
        latestMeetingSummary: 'Discussed next steps.',
      },
    ]);
  });

  it('returns workspace leads for the authenticated rep', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(payload.leads).toHaveLength(1);
    expect(payload.leads[0].createdAt).toBe('2026-03-13T12:00:00.000Z');
  });

  it('creates a manual lead for the authenticated rep', async () => {
    createLead.mockResolvedValue({
      id: 'lead_2',
      firstName: 'Jordan',
      lastName: 'Lee',
      company: 'Apex Industrial',
      email: 'jordan@apex.com',
      phone: null,
      location: 'Dallas, Texas',
      industry: null,
      jobTitle: null,
      interest: null,
      notes: null,
      consent: true,
      status: 'new',
      sourceType: 'manual',
      repProfileId: 'rep_1',
      landingPageId: null,
      duplicateOfLeadId: null,
      queryParams: null,
      submittedAt: null,
      createdAt: new Date('2026-03-14T12:00:00.000Z'),
      updatedAt: new Date('2026-03-14T12:00:00.000Z'),
    });

    const response = await POST(
      new Request('http://localhost/api/workspace/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'Jordan',
          lastName: 'Lee',
          email: 'jordan@apex.com',
          company: 'Apex Industrial',
          location: 'Dallas, Texas',
          consent: true,
          status: 'new',
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(createLead).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Jordan',
        repProfileId: 'rep_1',
        sourceType: 'manual',
        location: 'Dallas, Texas',
      }),
    );
    expect(payload.lead.createdAt).toBe('2026-03-14T12:00:00.000Z');
  });
});
