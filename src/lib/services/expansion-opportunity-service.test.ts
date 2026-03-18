import {
  ActivityLogType,
  AlertPriority,
  CompanyAssociationType,
  ContactAssociationStatus,
  ExpansionOpportunityType,
} from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { ExpansionOpportunityService } from './expansion-opportunity-service';

describe('ExpansionOpportunityService', () => {
  it('evaluates a target-account move as a warm introduction opportunity', () => {
    const result = ExpansionOpportunityService.evaluateEmploymentChangeOpportunity({
      changeEvent: {
        id: 'change_1',
        leadId: 'lead_1',
        changeType: 'company_changed',
        companyFrom: 'Old Rail',
        companyTo: 'Target Rail',
        confidenceScore: 0.92,
      } as never,
      destinationAccount: {
        id: 'assoc_1',
        companyName: 'Target Rail',
        associationType: CompanyAssociationType.target_account,
        isStrategic: true,
        status: ContactAssociationStatus.active,
      },
      isChampion: true,
      leadIndustry: 'Safety Technology',
    });

    expect(result).toEqual(
      expect.objectContaining({
        opportunityType: ExpansionOpportunityType.warm_introduction,
        priority: AlertPriority.urgent,
        companyName: 'Target Rail',
      }),
    );
  });

  it('creates an expansion signal and logs activity', async () => {
    const db = {
      expansionOpportunitySignal: {
        create: vi.fn().mockResolvedValue({
          id: 'ck2234567890123456789012',
          leadId: 'ck1234567890123456789012',
          repProfileId: null,
          opportunityType: ExpansionOpportunityType.expansion,
          companyName: 'Current Customer Co',
          priority: AlertPriority.high,
          summary: 'Known contact joined a current customer in a relevant role.',
          suggestedNextStep: null,
          confidenceScore: 0.5,
        }),
      },
      repActionPrompt: {
        create: vi.fn().mockResolvedValue({ id: 'ck3234567890123456789012' }),
      },
      activityLog: {
        create: vi.fn().mockResolvedValue({ id: 'log_1' }),
      },
    };

    const signal = await ExpansionOpportunityService.createSignal(
      {
        leadId: 'ck1234567890123456789012',
        opportunityType: ExpansionOpportunityType.expansion,
        companyName: 'Current Customer Co',
        title: 'Expansion opportunity detected',
        summary: 'Known contact joined a current customer in a relevant role.',
        priority: AlertPriority.high,
        status: 'open',
        originType: 'system_generated',
        confidenceScore: 0.5,
      },
      {},
      db as never,
    );

    expect(signal).toMatchObject({ id: 'ck2234567890123456789012' });
    expect(db.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: ActivityLogType.expansion_opportunity_detected,
      }),
    });
    expect(db.repActionPrompt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        expansionOpportunitySignalId: 'ck2234567890123456789012',
      }),
    });
  });
});
