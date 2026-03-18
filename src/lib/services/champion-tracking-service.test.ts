import { ChampionPriority, ChampionStatus, RecordOriginType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { ChampionTrackingService } from './champion-tracking-service';

function createDbMock() {
  return {
    championFlag: {
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

describe('ChampionTrackingService', () => {
  it('creates an active strategic champion and logs a milestone', async () => {
    const db = createDbMock();

    db.championFlag.findUnique.mockResolvedValue(null);
    db.championFlag.upsert.mockResolvedValue({
      id: 'champion_1',
      leadId: 'ck1234567890123456789012',
      ownerRepProfileId: 'ck2234567890123456789012',
      isActive: true,
      priority: ChampionPriority.strategic,
      status: ChampionStatus.active,
      rationale: 'Primary advocate.',
      notes: 'Knows the implementation team well.',
      confidenceScore: 0.91,
      originType: RecordOriginType.user_input,
    });
    db.activityLog.create.mockResolvedValue({ id: 'log_1' });
    db.relationshipMilestone.create.mockResolvedValue({ id: 'milestone_1' });

    const result = await ChampionTrackingService.updateChampionFlag(
      {
        leadId: 'ck1234567890123456789012',
        ownerRepProfileId: 'ck2234567890123456789012',
        isActive: true,
        priority: ChampionPriority.strategic,
        rationale: 'Primary advocate.',
        notes: 'Knows the implementation team well.',
        confidenceScore: 0.91,
        originType: RecordOriginType.user_input,
      },
      {
        actorUserId: 'user_1',
      },
      db as never,
    );

    expect(result.status).toBe(ChampionStatus.active);
    expect(db.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'champion_flag_updated',
        leadId: 'ck1234567890123456789012',
      }),
    });
    expect(db.relationshipMilestone.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'ck1234567890123456789012',
        milestoneType: 'champion_status',
      }),
    });
  });

  it('defaults an inactive prior champion to former status', async () => {
    const db = createDbMock();

    db.championFlag.findUnique.mockResolvedValue({
      id: 'champion_1',
      leadId: 'ck1234567890123456789012',
      isActive: true,
      status: ChampionStatus.active,
      lastStatusChangedAt: new Date('2026-03-01T00:00:00.000Z'),
    });
    db.championFlag.upsert.mockResolvedValue({
      id: 'champion_1',
      leadId: 'ck1234567890123456789012',
      ownerRepProfileId: null,
      isActive: false,
      priority: ChampionPriority.medium,
      status: ChampionStatus.former,
      rationale: 'Moved companies.',
      notes: null,
      confidenceScore: 0.8,
      originType: RecordOriginType.user_input,
    });
    db.activityLog.create.mockResolvedValue({ id: 'log_1' });
    db.relationshipMilestone.create.mockResolvedValue({ id: 'milestone_1' });

    const result = await ChampionTrackingService.updateChampionFlag(
      {
        leadId: 'ck1234567890123456789012',
        isActive: false,
        priority: ChampionPriority.medium,
        rationale: 'Moved companies.',
        confidenceScore: 0.8,
        originType: RecordOriginType.user_input,
      },
      {},
      db as never,
    );

    expect(result.status).toBe(ChampionStatus.former);
    expect(db.championFlag.upsert).toHaveBeenCalledWith({
      where: { leadId: 'ck1234567890123456789012' },
      update: expect.objectContaining({
        status: ChampionStatus.former,
        isActive: false,
      }),
      create: expect.any(Object),
    });
  });
});
