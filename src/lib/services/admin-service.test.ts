import { describe, expect, it, vi } from 'vitest';

import {
  inviteRepUser,
  getAccountsList,
  getDashboardMetrics,
  getLeadActivityTimeline,
  getLeadById,
  getLeadsList,
  offboardRepUser,
  getOpportunitiesList,
  getRepProfiles,
  resendRepInvite,
  updateRepProfileBasic,
} from './admin-service';

function createAdminDbMock() {
  const db = {
    lead: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    repProfile: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    account: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    opportunity: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    activityLog: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    meeting: {
      updateMany: vi.fn(),
    },
    emailThread: {
      updateMany: vi.fn(),
    },
    emailDraft: {
      updateMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (callback: (tx: any) => unknown) => callback(db)),
  };

  return db as any;
}

const superAdminActor = {
  id: 'user_admin',
  role: 'super_admin' as const,
};

const managerActor = {
  id: 'user_manager',
  role: 'sales_manager' as const,
};

describe('admin service', () => {
  it('builds dashboard metrics from grouped lead data', async () => {
    const db = createAdminDbMock();

    db.lead.count.mockResolvedValueOnce(12).mockResolvedValueOnce(4);
    db.account.count.mockResolvedValue(2);
    db.opportunity.count.mockResolvedValue(2);
    db.lead.groupBy
      .mockResolvedValueOnce([
        { status: 'new', _count: { _all: 8 } },
        { status: 'contacted', _count: { _all: 4 } },
      ])
      .mockResolvedValueOnce([
        { repProfileId: 'rep_1', _count: { _all: 7 } },
        { repProfileId: 'rep_2', _count: { _all: 5 } },
      ]);
    db.repProfile.findMany.mockResolvedValue([
      {
        id: 'rep_1',
        displayName: 'Jay Jones',
        user: {
          lastLoginAt: new Date('2026-03-14T09:00:00.000Z'),
          invitationSentAt: new Date('2026-03-01T09:00:00.000Z'),
          invitationAcceptedAt: new Date('2026-03-02T09:00:00.000Z'),
        },
        ownedLeads: [
          { id: 'lead_1', status: 'qualified', createdAt: new Date('2026-03-10T00:00:00.000Z') },
          { id: 'lead_2', status: 'new', createdAt: new Date('2026-03-12T00:00:00.000Z') },
        ],
        ownedAccounts: [{ id: 'account_1' }],
        ownedOpportunities: [
          { id: 'opp_1', stage: 'proposal', amountCents: 5000000 },
          { id: 'opp_2', stage: 'closed_won', amountCents: 2500000 },
        ],
      },
      {
        id: 'rep_2',
        displayName: 'Casey Rivera',
        user: {
          lastLoginAt: null,
          invitationSentAt: new Date('2026-03-05T09:00:00.000Z'),
          invitationAcceptedAt: null,
        },
        ownedLeads: [{ id: 'lead_3', status: 'contacted', createdAt: new Date('2026-02-10T00:00:00.000Z') }],
        ownedAccounts: [{ id: 'account_2' }],
        ownedOpportunities: [{ id: 'opp_3', stage: 'discovery', amountCents: 3000000 }],
      },
    ]);
    db.opportunity.findMany
      .mockResolvedValueOnce([
        {
          id: 'opp_1',
          stage: 'proposal',
          amountCents: 5000000,
          ownerRepProfileId: 'rep_1',
          targetCloseDate: new Date('2026-03-01T00:00:00.000Z'),
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          closeDate: null,
        },
        {
          id: 'opp_3',
          stage: 'discovery',
          amountCents: 3000000,
          ownerRepProfileId: 'rep_2',
          targetCloseDate: new Date('2026-04-01T00:00:00.000Z'),
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          closeDate: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'opp_2',
          stage: 'closed_won',
          amountCents: 2500000,
          ownerRepProfileId: 'rep_1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          closeDate: new Date('2026-02-15T00:00:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'opp_2',
          stage: 'closed_won',
          amountCents: 2500000,
          ownerRepProfileId: 'rep_1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          closeDate: new Date('2026-02-15T00:00:00.000Z'),
        },
        {
          id: 'opp_4',
          stage: 'closed_lost',
          amountCents: 1500000,
          ownerRepProfileId: 'rep_2',
          createdAt: new Date('2026-01-10T00:00:00.000Z'),
          closeDate: new Date('2026-02-20T00:00:00.000Z'),
        },
      ]);

    const result = await getDashboardMetrics(superAdminActor, db);

    expect(result.totalLeads).toBe(12);
    expect(result.recentLeads).toBe(4);
    expect(result.totalAccounts).toBe(2);
    expect(result.openOpportunities).toBe(2);
    expect(result.pipelineValueCents).toBe(8000000);
    expect(result.weightedForecastValueCents).toBe(4000000);
    expect(result.closedWonValueCents).toBe(2500000);
    expect(result.pendingInvites).toBe(1);
    expect(result.overdueOpenOpportunities).toBe(1);
    expect(result.leadsByRep[0]?.repName).toBe('Jay Jones');
    expect(result.leadsByStatus[0]?.status).toBe('new');
    expect(result.forecastByStage.find((entry) => entry.stage === 'proposal')?.amountCents).toBe(
      5000000,
    );
    expect(result.repPerformance[0]?.repName).toBe('Jay Jones');
  });

  it('fetches a filtered leads list', async () => {
    const db = createAdminDbMock();
    db.lead.findMany.mockResolvedValue([{ id: 'lead_1' }]);

    const result = await getLeadsList(
      superAdminActor,
      {
        search: 'taylor',
        status: 'new',
        repId: 'rep_1',
      },
      db,
    );

    expect(db.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'new',
          repProfileId: 'rep_1',
        }),
      }),
    );
    expect(result).toEqual([{ id: 'lead_1' }]);
  });

  it('retrieves lead detail and timeline data', async () => {
    const db = createAdminDbMock();
    db.lead.findFirst.mockResolvedValue({ id: 'lead_1' });
    db.activityLog.findMany.mockResolvedValue([{ id: 'activity_1' }]);

    const [lead, timeline] = await Promise.all([
      getLeadById(superAdminActor, 'lead_1', db),
      getLeadActivityTimeline(superAdminActor, 'lead_1', db),
    ]);

    expect(lead).toEqual({ id: 'lead_1' });
    expect(timeline).toEqual([{ id: 'activity_1' }]);
  });

  it('retrieves and updates rep management data', async () => {
    const db = createAdminDbMock();
    db.repProfile.findMany.mockResolvedValue([{ id: 'rep_1' }]);
    db.repProfile.update.mockResolvedValue({ id: 'rep_1', displayName: 'Jay Jones' });

    const reps = await getRepProfiles(superAdminActor, db);
    const updated = await updateRepProfileBasic(
      superAdminActor,
      'rep_1',
      {
        displayName: 'Jay Jones',
        title: 'Safety Technology Specialist',
        bio: 'Updated bio text for Trainovations.',
        email: 'jay.jones@trainovations.com',
        isActive: true,
      },
      db,
    );

    expect(reps).toEqual([{ id: 'rep_1' }]);
    expect(updated).toEqual({ id: 'rep_1', displayName: 'Jay Jones' });
  });

  it('scopes manager lead access to assigned reps', async () => {
    const db = createAdminDbMock();
    db.repProfile.findMany.mockResolvedValue([{ id: 'rep_1' }]);
    db.lead.findMany.mockResolvedValue([{ id: 'lead_1' }]);

    await getLeadsList(managerActor, { repId: 'all' }, db);

    expect(db.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          repProfileId: {
            in: ['rep_1'],
          },
        }),
      }),
    );
  });

  it('returns scoped accounts and opportunities', async () => {
    const db = createAdminDbMock();
    db.repProfile.findMany.mockResolvedValue([{ id: 'rep_1' }]);
    db.account.findMany.mockResolvedValue([{ id: 'account_1' }]);
    db.opportunity.findMany.mockResolvedValue([{ id: 'opportunity_1' }]);

    const [accounts, opportunities] = await Promise.all([
      getAccountsList(managerActor, {}, db),
      getOpportunitiesList(managerActor, {}, db),
    ]);

    expect(db.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerRepProfileId: {
            in: ['rep_1'],
          },
        }),
      }),
    );
    expect(db.opportunity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerRepProfileId: {
            in: ['rep_1'],
          },
        }),
      }),
    );
    expect(accounts).toEqual([{ id: 'account_1' }]);
    expect(opportunities).toEqual([{ id: 'opportunity_1' }]);
  });

  it('blocks manager rep updates outside assigned scope', async () => {
    const db = createAdminDbMock();
    db.repProfile.findMany.mockResolvedValue([{ id: 'rep_1' }]);

    await expect(
      updateRepProfileBasic(
        managerActor,
        'rep_2',
        {
          displayName: 'Casey Rivera',
          title: 'Enterprise Account Executive',
          bio: 'Updated bio text for Trainovations.',
          email: 'casey.rivera@trainovations.com',
          isActive: true,
        },
        db,
      ),
    ).rejects.toThrow(/forbidden/i);
  });

  it('invites a new rep user with a temporary password', async () => {
    const db = createAdminDbMock();
    db.user.findUnique.mockResolvedValue(null);
    db.repProfile.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({
      id: 'user_rep',
      email: 'new.rep@trainovations.com',
    });
    db.repProfile.create.mockResolvedValue({
      id: 'rep_3',
      displayName: 'New Rep',
    });

    const result = await inviteRepUser(
      superAdminActor,
      {
        firstName: 'New',
        lastName: 'Rep',
        email: 'new.rep@trainovations.com',
        title: 'Account Executive',
      },
      db,
    );

    expect(db.user.create).toHaveBeenCalled();
    expect(db.repProfile.create).toHaveBeenCalled();
    expect(result.temporaryPassword).toBeTruthy();
  });

  it('resends an invite by resetting the password and invite timestamp', async () => {
    const db = createAdminDbMock();
    db.repProfile.findMany.mockResolvedValue([{ id: 'rep_1' }]);
    db.repProfile.findUnique.mockResolvedValue({
      id: 'rep_1',
      displayName: 'Jay Jones',
      user: {
        id: 'user_1',
        email: 'jay.jones@trainovations.com',
      },
    });
    db.user.update.mockResolvedValue({
      id: 'user_1',
      email: 'jay.jones@trainovations.com',
    });

    const result = await resendRepInvite(managerActor, 'rep_1', db);

    expect(db.user.update).toHaveBeenCalled();
    expect(result.temporaryPassword).toBeTruthy();
  });

  it('offboards a rep and reassigns owned records', async () => {
    const db = createAdminDbMock();
    db.repProfile.findMany.mockResolvedValue([{ id: 'rep_1' }, { id: 'rep_2' }]);
    db.repProfile.findUnique
      .mockResolvedValueOnce({
        id: 'rep_1',
        user: { id: 'user_1' },
      })
      .mockResolvedValueOnce({
        id: 'rep_2',
        user: { id: 'user_2' },
      });
    db.user.delete.mockResolvedValue({ id: 'user_1' });

    await offboardRepUser(managerActor, 'rep_1', 'rep_2', db);

    expect(db.lead.updateMany).toHaveBeenCalledWith({
      where: { repProfileId: 'rep_1' },
      data: { repProfileId: 'rep_2' },
    });
    expect(db.user.delete).toHaveBeenCalled();
  });
});
