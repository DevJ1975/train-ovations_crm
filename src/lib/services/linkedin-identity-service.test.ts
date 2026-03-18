import {
  ActivityLogType,
  LinkedInProfileLinkStatus,
  ProfileMatchStatus,
  ProfileSourceType,
} from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import {
  LinkedInIdentityService,
  normalizeLinkedInProfileUrl,
} from './linkedin-identity-service';

function createDbMock() {
  return {
    externalProfileSource: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    linkedInProfileLink: {
      upsert: vi.fn(),
    },
    profileMatchCandidate: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
  } as const;
}

describe('LinkedInIdentityService', () => {
  it('normalizes LinkedIn profile URLs safely', () => {
    expect(
      normalizeLinkedInProfileUrl(
        'https://www.linkedin.com/in/Jay-Jones/?trk=public_profile',
      ),
    ).toBe('https://www.linkedin.com/in/jay-jones');
  });

  it('attaches a manual LinkedIn profile link with provenance metadata', async () => {
    const db = createDbMock();

    db.externalProfileSource.findFirst.mockResolvedValue(null);
    db.externalProfileSource.create.mockResolvedValue({ id: 'source_1' });
    db.linkedInProfileLink.upsert.mockResolvedValue({
      id: 'link_1',
      profileUrl: 'https://www.linkedin.com/in/jay-jones',
      sourceType: ProfileSourceType.user_provided,
      confidenceScore: 0.95,
      humanConfirmed: true,
    });
    db.activityLog.create.mockResolvedValue({ id: 'log_1' });

    const result = await LinkedInIdentityService.attachManualProfileUrl(
      {
        leadId: 'ck1234567890123456789012',
        profileUrl: 'https://www.linkedin.com/in/Jay-Jones/',
        confidenceScore: 0.95,
        humanConfirmed: true,
      },
      db as never,
    );

    expect(db.linkedInProfileLink.upsert).toHaveBeenCalledWith({
      where: {
        leadId_normalizedProfileUrl: {
          leadId: 'ck1234567890123456789012',
          normalizedProfileUrl: 'https://www.linkedin.com/in/jay-jones',
        },
      },
      update: expect.objectContaining({
        sourceType: ProfileSourceType.user_provided,
        status: LinkedInProfileLinkStatus.active,
      }),
      create: expect.objectContaining({
        leadId: 'ck1234567890123456789012',
        normalizedProfileUrl: 'https://www.linkedin.com/in/jay-jones',
      }),
    });
    expect(db.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: ActivityLogType.linkedin_profile_linked,
        metadata: expect.objectContaining({
          linkedInProfileLinkId: 'link_1',
          humanConfirmed: true,
        }),
      }),
    });
    expect(result.id).toBe('link_1');
  });

  it('confirms a profile match candidate and creates a linked profile record', async () => {
    const db = createDbMock();

    db.profileMatchCandidate.findUnique.mockResolvedValue({
      id: 'ck2234567890123456789012',
      leadId: 'ck1234567890123456789012',
      profileUrl: 'https://www.linkedin.com/in/jay-jones',
      normalizedProfileUrl: 'https://www.linkedin.com/in/jay-jones',
      memberId: 'member_123',
      title: 'Safety Technology Specialist',
      location: 'Dallas, TX',
      sourceType: ProfileSourceType.ai_inference,
      confidenceScore: 0.82,
    });
    db.externalProfileSource.findFirst.mockResolvedValue({
      id: 'source_1',
    });
    db.profileMatchCandidate.updateMany.mockResolvedValue({ count: 2 });
    db.profileMatchCandidate.update.mockResolvedValue({
      id: 'ck2234567890123456789012',
      leadId: 'ck1234567890123456789012',
      profileUrl: 'https://www.linkedin.com/in/jay-jones',
      normalizedProfileUrl: 'https://www.linkedin.com/in/jay-jones',
      memberId: 'member_123',
      title: 'Safety Technology Specialist',
      location: 'Dallas, TX',
      sourceType: ProfileSourceType.ai_inference,
      confidenceScore: 0.82,
    });
    db.linkedInProfileLink.upsert.mockResolvedValue({
      id: 'link_1',
    });
    db.activityLog.create.mockResolvedValue({ id: 'log_1' });

    const result = await LinkedInIdentityService.confirmProfileMatch(
      {
        leadId: 'ck1234567890123456789012',
        candidateId: 'ck2234567890123456789012',
        matchStatus: ProfileMatchStatus.confirmed,
      },
      db as never,
    );

    expect(db.profileMatchCandidate.update).toHaveBeenCalledWith({
      where: { id: 'ck2234567890123456789012' },
      data: expect.objectContaining({
        matchStatus: ProfileMatchStatus.confirmed,
        humanReviewed: true,
      }),
    });
    expect(db.linkedInProfileLink.upsert).toHaveBeenCalled();
    expect(db.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: ActivityLogType.profile_match_confirmed,
      }),
    });
    expect(result).toEqual({ id: 'link_1' });
  });
});
