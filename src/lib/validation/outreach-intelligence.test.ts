import {
  AlertPriority,
  BriefStatus,
  OutreachDraftStatus,
  OutreachDraftType,
  PriorityBand,
  PriorityEntityType,
  RepTaskSuggestionStatus,
  RepTaskSuggestionType,
} from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  accountBriefSchema,
  briefGenerationRunSchema,
  contactBriefSchema,
  draftGenerationContextSchema,
  outreachDraftSchema,
  priorityReasonSchema,
  priorityScoreSchema,
  repTaskSuggestionSchema,
} from './outreach-intelligence';

describe('outreach intelligence validation schemas', () => {
  it('accepts a generated outreach draft with review metadata', () => {
    const result = outreachDraftSchema.parse({
      repProfileId: 'ck1234567890123456789012',
      leadId: 'ck2234567890123456789012',
      type: OutreachDraftType.congratulatory,
      status: OutreachDraftStatus.generated,
      subject: 'Congrats on the new role',
      bodyText: 'Wanted to say congratulations on the move and reconnect.',
      confidenceScore: 0.74,
    });

    expect(result.type).toBe(OutreachDraftType.congratulatory);
    expect(result.status).toBe(OutreachDraftStatus.generated);
  });

  it('requires a source entity for draft generation context records', () => {
    expect(
      draftGenerationContextSchema.safeParse({
        outreachDraftId: 'ck1234567890123456789012',
        sourceEntityType: '',
        sourceEntityId: '',
      }).success,
    ).toBe(false);
  });

  it('stores concise account brief content for rep prep', () => {
    const result = accountBriefSchema.parse({
      companyName: 'Apex Industrial',
      summary: 'Strategic manufacturing account with active forklift safety needs.',
      opportunityThemes: ['Forklift certification refresh', 'Supervisor training'],
      openActionItems: ['Confirm pilot dates'],
    });

    expect(result.status).toBe(BriefStatus.generated);
    expect(result.opportunityThemes).toHaveLength(2);
  });

  it('requires contact briefs to stay attached to a lead record', () => {
    expect(
      contactBriefSchema.safeParse({
        summary: 'Strong internal advocate.',
      }).success,
    ).toBe(false);
  });

  it('captures generation runs with typed brief metadata', () => {
    const result = briefGenerationRunSchema.parse({
      leadId: 'ck1234567890123456789012',
      briefType: 'contact',
      outputSummary: 'Contact brief refreshed after a title change.',
    });

    expect(result.briefType).toBe('contact');
    expect(result.status).toBe(BriefStatus.generated);
  });

  it('accepts priority scores with explanation context', () => {
    const result = priorityScoreSchema.parse({
      leadId: 'ck1234567890123456789012',
      entityType: PriorityEntityType.lead,
      entityKey: 'lead_ck1234567890123456789012',
      score: 88,
      band: PriorityBand.high,
      reasonSummary:
        'High priority because the contact moved to a strategic account and has champion history.',
      lastEvaluatedAt: new Date().toISOString(),
    });

    expect(result.band).toBe(PriorityBand.high);
    expect(result.score).toBe(88);
  });

  it('defaults priority reason weight to zero', () => {
    const result = priorityReasonSchema.parse({
      priorityScoreId: 'ck1234567890123456789012',
      code: 'champion_recent_move',
      label: 'Champion moved recently',
    });

    expect(result.weight).toBe(0);
  });

  it('creates task suggestions with urgency metadata', () => {
    const result = repTaskSuggestionSchema.parse({
      repProfileId: 'ck1234567890123456789012',
      leadId: 'ck2234567890123456789012',
      type: RepTaskSuggestionType.reconnect_contact,
      title: 'Reconnect with Jordan at the new company',
      reason: 'Jordan moved to a strategic account and was previously a champion.',
      priority: AlertPriority.high,
      confidenceScore: 0.81,
    });

    expect(result.status).toBe(RepTaskSuggestionStatus.generated);
    expect(result.priority).toBe(AlertPriority.high);
  });
});
