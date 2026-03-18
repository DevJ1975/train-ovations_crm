import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAuthenticatedUser, getRepLeadById, updateLead, deleteLead } = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  getRepLeadById: vi.fn(),
  updateLead: vi.fn(),
  deleteLead: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  requireAuthenticatedUser,
}));

vi.mock('@/lib/services', () => ({
  getRepLeadById,
  updateLead,
  deleteLead,
}));

import { DELETE, PATCH } from './route';

describe('/api/workspace/leads/[id]', () => {
  beforeEach(() => {
    requireAuthenticatedUser.mockResolvedValue({
      id: 'user_1',
      role: 'sales_rep',
    });
    getRepLeadById.mockResolvedValue({
      id: 'lead_1',
      repProfileId: 'rep_1',
    });
  });

  it('updates a rep-owned lead', async () => {
    updateLead.mockResolvedValue({
      id: 'lead_1',
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
      status: 'contacted',
      sourceType: 'manual',
      repProfileId: 'rep_1',
      landingPageId: null,
      duplicateOfLeadId: null,
      queryParams: null,
      submittedAt: null,
      createdAt: new Date('2026-03-14T12:00:00.000Z'),
      updatedAt: new Date('2026-03-14T13:00:00.000Z'),
    });

    const response = await PATCH(
      new Request('http://localhost/api/workspace/leads/lead_1', {
        method: 'PATCH',
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
          status: 'contacted',
        }),
      }),
      {
        params: Promise.resolve({
          id: 'lead_1',
        }),
      },
    );

    expect(response!.status).toBe(200);
    expect(updateLead).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: 'lead_1',
        actorUserId: 'user_1',
      }),
    );
  });

  it('deletes a rep-owned lead', async () => {
    const response = await DELETE(new Request('http://localhost/api/workspace/leads/lead_1'), {
      params: Promise.resolve({
        id: 'lead_1',
      }),
    });

    expect(response!.status).toBe(200);
    expect(deleteLead).toHaveBeenCalledWith({
      leadId: 'lead_1',
      actorUserId: 'user_1',
      repProfileId: 'rep_1',
    });
  });
});
