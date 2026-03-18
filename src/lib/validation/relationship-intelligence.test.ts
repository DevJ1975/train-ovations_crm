import {
  ChampionPriority,
  ChampionStatus,
  CompanyAssociationType,
  ExpansionOpportunityType,
  RecordOriginType,
  RelationshipEdgeType,
  RelationshipMilestoneType,
  RepActionPromptType,
  WatchlistCategory,
} from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  championFlagSchema,
  watchlistSettingsSchema,
} from './linkedin-identity';
import {
  contactCompanyAssociationSchema,
  expansionOpportunitySignalSchema,
  relationshipEdgeSchema,
  relationshipMilestoneSchema,
  repActionPromptSchema,
} from './relationship-intelligence';

describe('relationship intelligence validation schemas', () => {
  it('accepts an expanded champion tracking payload', () => {
    const result = championFlagSchema.safeParse({
      leadId: 'ck1234567890123456789012',
      ownerRepProfileId: 'ck2234567890123456789012',
      isActive: true,
      priority: ChampionPriority.strategic,
      status: ChampionStatus.active,
      rationale: 'Primary buyer-side advocate across rail compliance initiatives.',
      notes: 'Previously championed Trainovations at a former employer.',
      confidenceScore: 0.92,
      originType: RecordOriginType.user_input,
    });

    expect(result.success).toBe(true);
  });

  it('defaults new watchlist fields safely', () => {
    const result = watchlistSettingsSchema.parse({
      leadId: 'ck1234567890123456789012',
    });

    expect(result.category).toBe(WatchlistCategory.strategic_contact);
    expect(result.notifyOnTitleChange).toBe(true);
    expect(result.notifyOnTargetCompanyMatch).toBe(true);
  });

  it('validates relationship milestones with provenance', () => {
    const result = relationshipMilestoneSchema.safeParse({
      leadId: 'ck1234567890123456789012',
      milestoneType: RelationshipMilestoneType.employment_change,
      title: 'Moved from Old Rail to New Rail',
      occurredAt: '2026-03-13T12:00:00.000Z',
      originType: RecordOriginType.external_source,
      confidenceScore: 0.81,
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid company association URLs', () => {
    const result = contactCompanyAssociationSchema.safeParse({
      leadId: 'ck1234567890123456789012',
      companyName: 'Trainovations',
      companyLinkedInUrl: 'not-a-url',
      associationType: CompanyAssociationType.target_account,
    });

    expect(result.success).toBe(false);
  });

  it('accepts expansion opportunity signals with next-step guidance', () => {
    const result = expansionOpportunitySignalSchema.safeParse({
      leadId: 'ck1234567890123456789012',
      opportunityType: ExpansionOpportunityType.warm_introduction,
      companyName: 'New Rail Logistics',
      title: 'Former champion joined a target account',
      summary: 'A known advocate moved into a safety leadership role at a strategic target account.',
      suggestedNextStep: 'Reconnect and propose a discovery call within seven days.',
    });

    expect(result.success).toBe(true);
  });

  it('accepts rep action prompts and relationship edges', () => {
    expect(
      repActionPromptSchema.safeParse({
        leadId: 'ck1234567890123456789012',
        promptType: RepActionPromptType.congratulate,
        title: 'Congratulate on promotion',
        message: 'Reach out with a short congratulations note and reopen the relationship.',
      }).success,
    ).toBe(true);

    expect(
      relationshipEdgeSchema.safeParse({
        leadId: 'ck1234567890123456789012',
        edgeType: RelationshipEdgeType.rep_to_contact,
        label: 'Known by Jay Jones through two prior meetings',
        strengthScore: 0.84,
      }).success,
    ).toBe(true);
  });
});
