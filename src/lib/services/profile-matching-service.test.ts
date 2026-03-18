import { ProfileSourceType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { ProfileMatchingService } from './profile-matching-service';

describe('ProfileMatchingService', () => {
  it('scores company and title aligned profile candidates higher', () => {
    const high = ProfileMatchingService.scoreProfileMatch(
      {
        leadId: 'ck1234567890123456789012',
        firstName: 'Taylor',
        lastName: 'Brooks',
        company: 'Northstar Rail',
        jobTitle: 'Operations Director',
        email: 'taylor.brooks@northstarrail.com',
      },
      {
        profileUrl: 'https://www.linkedin.com/in/taylor-brooks',
        fullName: 'Taylor Brooks',
        companyName: 'Northstar Rail',
        title: 'Operations Director',
      },
    );

    const low = ProfileMatchingService.scoreProfileMatch(
      {
        leadId: 'ck1234567890123456789012',
        firstName: 'Taylor',
        lastName: 'Brooks',
        company: 'Northstar Rail',
        jobTitle: 'Operations Director',
        email: 'taylor.brooks@northstarrail.com',
      },
      {
        profileUrl: 'https://www.linkedin.com/in/t-brooks-123',
        fullName: 'T Brooks',
        companyName: 'Different Company',
        title: 'Coordinator',
      },
    );

    expect(high.confidenceScore).toBeGreaterThan(low.confidenceScore);
    expect(high.signals).toContain('exact_name');
  });

  it('persists scored match suggestions for later human confirmation', async () => {
    const db = {
      externalProfileSource: {
        findFirst: vi.fn().mockResolvedValue({ id: 'source_1' }),
        create: vi.fn(),
      },
      profileMatchCandidate: {
        create: vi.fn().mockResolvedValue({
          id: 'candidate_1',
          confidenceScore: 0.95,
        }),
      },
    };

    const result = await ProfileMatchingService.suggestProfileMatches(
      {
        leadId: 'ck1234567890123456789012',
        firstName: 'Taylor',
        lastName: 'Brooks',
        company: 'Northstar Rail',
        jobTitle: 'Operations Director',
      },
      [
        {
          profileUrl: 'https://www.linkedin.com/in/taylor-brooks',
          fullName: 'Taylor Brooks',
          title: 'Operations Director',
          companyName: 'Northstar Rail',
          sourceType: ProfileSourceType.ai_inference,
        },
      ],
      db as never,
    );

    expect(db.profileMatchCandidate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        normalizedProfileUrl: 'https://www.linkedin.com/in/taylor-brooks',
        matchStatus: 'suggested',
      }),
    });
    expect(result[0]?.confidenceScore).toBeGreaterThan(0.8);
  });
});
