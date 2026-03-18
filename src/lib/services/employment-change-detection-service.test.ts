import {
  ActivityLogType,
  AlertPriority,
  EmploymentChangeType,
  ExpansionOpportunityType,
  LinkedInProfileLinkStatus,
  ProfileSourceType,
  WatchlistPriority,
} from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { EmploymentChangeDetectionService } from './employment-change-detection-service';

function createDbMock() {
  return {
    employmentSnapshot: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    lead: {
      findUnique: vi.fn(),
    },
    linkedInProfileLink: {
      findUnique: vi.fn(),
    },
    relationshipHistory: {
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    contactCompanyAssociation: {
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    expansionOpportunitySignal: {
      create: vi.fn(),
    },
    repActionPrompt: {
      create: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
    contactWatchlist: {
      findUnique: vi.fn(),
    },
    championFlag: {
      findUnique: vi.fn(),
    },
    employmentChangeEvent: {
      create: vi.fn(),
    },
    careerMovementAlert: {
      create: vi.fn(),
    },
  } as any;
}

describe('EmploymentChangeDetectionService', () => {
  it('detects company, title, stale, and broken-link changes', () => {
    const changes = EmploymentChangeDetectionService.detectEmploymentChanges({
      previousSnapshot: {
        id: 'prev_1',
        title: 'Director',
        companyName: 'Old Rail',
        retrievedAt: new Date('2025-01-01T00:00:00.000Z'),
      },
      currentSnapshot: {
        title: 'VP Operations',
        companyName: 'New Rail',
        retrievedAt: new Date('2026-05-01T00:00:00.000Z'),
      },
      linkedProfileStatus: LinkedInProfileLinkStatus.broken,
    });

    expect(changes.map((change) => change.changeType)).toEqual(
      expect.arrayContaining([
        EmploymentChangeType.company_changed,
        EmploymentChangeType.departed_prior_employer,
        EmploymentChangeType.title_changed,
        EmploymentChangeType.stale_profile_data,
        EmploymentChangeType.broken_profile_link,
      ]),
    );
  });

  it('stores a snapshot, emits change events, and creates alerts', async () => {
    const db = createDbMock();

    db.employmentSnapshot.findFirst.mockResolvedValue({
      id: 'prev_1',
      title: 'Director',
      companyName: 'Old Rail',
      retrievedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    db.linkedInProfileLink.findUnique.mockResolvedValue({
      id: 'link_1',
      status: LinkedInProfileLinkStatus.active,
    });
    db.employmentSnapshot.create.mockResolvedValue({
      id: 'snap_1',
      leadId: 'ck1234567890123456789012',
      title: 'VP Operations',
      companyName: 'New Rail',
      startDate: null,
      endDate: null,
      confidenceScore: 0.91,
      sourceType: ProfileSourceType.user_provided,
      retrievedAt: new Date('2026-03-13T00:00:00.000Z'),
    });
    db.relationshipHistory.updateMany.mockResolvedValue({ count: 1 });
    db.relationshipHistory.findFirst.mockResolvedValue(null);
    db.relationshipHistory.create.mockResolvedValue({ id: 'rel_1' });
    db.contactCompanyAssociation.updateMany.mockResolvedValue({ count: 1 });
    db.contactCompanyAssociation.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'ck6234567890123456789012',
        companyName: 'New Rail',
        associationType: 'target_account',
        isStrategic: true,
        status: 'active',
      })
      .mockResolvedValueOnce({
        id: 'ck6234567890123456789012',
        companyName: 'New Rail',
        associationType: 'target_account',
        isStrategic: true,
        status: 'active',
      });
    db.contactCompanyAssociation.create.mockResolvedValue({ id: 'assoc_1' });
    db.activityLog.create.mockResolvedValue({ id: 'log_1' });
    db.contactWatchlist.findUnique.mockResolvedValue({
      priority: WatchlistPriority.high,
    });
    db.championFlag.findUnique.mockResolvedValue({
      isActive: true,
    });
    db.employmentChangeEvent.create
      .mockResolvedValueOnce({
        id: 'ck3234567890123456789012',
        leadId: 'ck1234567890123456789012',
        changeType: EmploymentChangeType.company_changed,
        companyFrom: 'Old Rail',
        companyTo: 'New Rail',
        confidenceScore: 0.92,
      })
      .mockResolvedValueOnce({
        id: 'ck4234567890123456789012',
        leadId: 'ck1234567890123456789012',
        changeType: EmploymentChangeType.departed_prior_employer,
        companyFrom: 'Old Rail',
        companyTo: 'New Rail',
        confidenceScore: 0.88,
      })
      .mockResolvedValueOnce({
        id: 'ck5234567890123456789012',
        leadId: 'ck1234567890123456789012',
        changeType: EmploymentChangeType.title_changed,
        titleFrom: 'Director',
        titleTo: 'VP Operations',
        confidenceScore: 0.84,
      });
    db.careerMovementAlert.create.mockResolvedValue({ id: 'ck8234567890123456789012' });
    db.lead.findUnique.mockResolvedValue({
      industry: 'Safety',
      repProfileId: 'ck7234567890123456789012',
    });
    db.expansionOpportunitySignal.create.mockResolvedValue({
      id: 'ck9234567890123456789012',
      leadId: 'ck1234567890123456789012',
      repProfileId: 'ck7234567890123456789012',
      opportunityType: ExpansionOpportunityType.warm_introduction,
      companyName: 'New Rail',
      priority: AlertPriority.urgent,
      summary: 'A known contact joined target account New Rail, creating a warm introduction opportunity.',
      suggestedNextStep: 'Reconnect with the contact and propose a short discovery meeting at the new company.',
      confidenceScore: 0.92,
    });
    db.repActionPrompt.create.mockResolvedValue({ id: 'ck1034567890123456789012' });

    const result = await EmploymentChangeDetectionService.refreshEmploymentSnapshot(
      {
        leadId: 'ck1234567890123456789012',
        linkedInProfileLinkId: 'ck2234567890123456789012',
        title: 'VP Operations',
        companyName: 'New Rail',
        isCurrent: true,
        sourceType: ProfileSourceType.user_provided,
        confidenceScore: 0.91,
        retrievedAt: new Date('2026-03-13T00:00:00.000Z'),
      },
      db as never,
    );

    expect(result.snapshot.id).toBe('snap_1');
    expect(result.changes).toHaveLength(3);
    expect(db.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: ActivityLogType.employment_snapshot_refreshed,
      }),
    });
    expect(db.careerMovementAlert.create).toHaveBeenCalled();
    expect(db.expansionOpportunitySignal.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'ck1234567890123456789012',
        companyName: 'New Rail',
      }),
    });
  });
});
