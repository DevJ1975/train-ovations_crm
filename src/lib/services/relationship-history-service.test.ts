import {
  CompanyAssociationType,
  ContactAssociationStatus,
  ProfileSourceType,
  RecordOriginType,
  RelationshipStage,
} from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { RelationshipHistoryService } from './relationship-history-service';

function createDbMock() {
  return {
    relationshipHistory: {
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    contactCompanyAssociation: {
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    relationshipMilestone: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  } as const;
}

describe('RelationshipHistoryService', () => {
  it('syncs employment snapshots into current relationship history and company associations', async () => {
    const db = createDbMock();

    db.relationshipHistory.updateMany.mockResolvedValue({ count: 1 });
    db.relationshipHistory.findFirst.mockResolvedValue(null);
    db.relationshipHistory.create.mockResolvedValue({ id: 'history_1' });
    db.contactCompanyAssociation.updateMany.mockResolvedValue({ count: 1 });
    db.contactCompanyAssociation.findFirst.mockResolvedValue(null);
    db.contactCompanyAssociation.create.mockResolvedValue({ id: 'assoc_1' });

    const result = await RelationshipHistoryService.syncFromEmploymentSnapshot(
      {
        leadId: 'ck1234567890123456789012',
        linkedInProfileLinkId: 'ck2234567890123456789012',
        companyName: 'New Rail',
        title: 'VP Operations',
        startDate: new Date('2026-02-01T00:00:00.000Z'),
        endDate: null,
        confidenceScore: 0.91,
        sourceType: ProfileSourceType.user_provided,
        retrievedAt: new Date('2026-03-13T00:00:00.000Z'),
      },
      db as never,
    );

    expect(db.relationshipHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'ck1234567890123456789012',
        companyName: 'New Rail',
        stage: RelationshipStage.current,
        originType: RecordOriginType.external_source,
      }),
    });
    expect(db.contactCompanyAssociation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'ck1234567890123456789012',
        companyName: 'New Rail',
        associationType: CompanyAssociationType.current_employer,
        status: ContactAssociationStatus.active,
        isCurrent: true,
      }),
    });
    expect(result.relationshipHistory.id).toBe('history_1');
    expect(result.companyAssociation.id).toBe('assoc_1');
  });

  it('returns a combined relationship timeline payload', async () => {
    const db = createDbMock();

    db.relationshipHistory.findMany.mockResolvedValue([{ id: 'history_1' }]);
    db.relationshipMilestone.findMany.mockResolvedValue([{ id: 'milestone_1' }]);
    db.contactCompanyAssociation.findMany.mockResolvedValue([{ id: 'assoc_1' }]);

    const result = await RelationshipHistoryService.getLeadRelationshipTimeline(
      'ck1234567890123456789012',
      db as never,
    );

    expect(result).toEqual({
      history: [{ id: 'history_1' }],
      milestones: [{ id: 'milestone_1' }],
      companyAssociations: [{ id: 'assoc_1' }],
    });
  });
});
