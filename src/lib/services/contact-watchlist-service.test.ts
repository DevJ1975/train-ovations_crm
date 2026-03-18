import { RecordOriginType, WatchlistCategory, WatchlistPriority } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { ContactWatchlistService } from './contact-watchlist-service';

function createDbMock() {
  return {
    contactWatchlist: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
    relationshipMilestone: {
      create: vi.fn(),
    },
  } as any;
}

describe('ContactWatchlistService', () => {
  it('creates a strategic watchlist record and milestone when activated', async () => {
    const db = createDbMock();

    db.contactWatchlist.findUnique.mockResolvedValue(null);
    db.contactWatchlist.upsert.mockResolvedValue({
      id: 'watch_1',
      leadId: 'ck1234567890123456789012',
      isActive: true,
      category: WatchlistCategory.target_company_mover,
      priority: WatchlistPriority.critical,
      reason: 'Important relationship to monitor for target-account movement.',
      originType: RecordOriginType.user_input,
      notifyOnEmploymentChange: true,
      notifyOnTitleChange: true,
      notifyOnBrokenLink: true,
      notifyOnStaleData: true,
      notifyOnTargetCompanyMatch: true,
    });
    db.activityLog.create.mockResolvedValue({ id: 'log_1' });
    db.relationshipMilestone.create.mockResolvedValue({ id: 'milestone_1' });

    const result = await ContactWatchlistService.updateWatchlist(
      {
        leadId: 'ck1234567890123456789012',
        isActive: true,
        category: WatchlistCategory.target_company_mover,
        priority: WatchlistPriority.critical,
        reason: 'Important relationship to monitor for target-account movement.',
        notifyOnEmploymentChange: true,
        notifyOnTitleChange: true,
        notifyOnBrokenLink: true,
        notifyOnStaleData: true,
        notifyOnTargetCompanyMatch: true,
        originType: RecordOriginType.user_input,
      },
      {
        actorUserId: 'user_1',
      },
      db as never,
    );

    expect(result.priority).toBe(WatchlistPriority.critical);
    expect(db.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'watchlist_updated',
        leadId: 'ck1234567890123456789012',
      }),
    });
    expect(db.relationshipMilestone.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        milestoneType: 'watchlist_added',
      }),
    });
  });

  it('does not create a new milestone when an existing watchlist is simply reprioritized', async () => {
    const db = createDbMock();

    db.contactWatchlist.findUnique.mockResolvedValue({
      id: 'watch_1',
      leadId: 'ck1234567890123456789012',
      isActive: true,
      priority: WatchlistPriority.normal,
    });
    db.contactWatchlist.upsert.mockResolvedValue({
      id: 'watch_1',
      leadId: 'ck1234567890123456789012',
      isActive: true,
      category: WatchlistCategory.strategic_contact,
      priority: WatchlistPriority.high,
      reason: 'Elevated due to recent title change.',
      originType: RecordOriginType.user_input,
      notifyOnEmploymentChange: true,
      notifyOnTitleChange: true,
      notifyOnBrokenLink: true,
      notifyOnStaleData: true,
      notifyOnTargetCompanyMatch: true,
    });
    db.activityLog.create.mockResolvedValue({ id: 'log_1' });

    await ContactWatchlistService.updateWatchlist(
      {
        leadId: 'ck1234567890123456789012',
        isActive: true,
        category: WatchlistCategory.strategic_contact,
        priority: WatchlistPriority.high,
        reason: 'Elevated due to recent title change.',
        notifyOnEmploymentChange: true,
        notifyOnTitleChange: true,
        notifyOnBrokenLink: true,
        notifyOnStaleData: true,
        notifyOnTargetCompanyMatch: true,
        originType: RecordOriginType.user_input,
      },
      {},
      db as never,
    );

    expect(db.relationshipMilestone.create).not.toHaveBeenCalled();
  });
});
