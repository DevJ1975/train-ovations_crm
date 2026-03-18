import {
  ActivityLogType,
  AlertPriority,
  ExpansionOpportunityType,
  RepActionPromptType,
} from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { RepActionPromptService } from './rep-action-prompt-service';

describe('RepActionPromptService', () => {
  it('derives a congratulatory prompt for title changes', () => {
    const prompt = RepActionPromptService.derivePromptFromCareerMovement({
      changeType: 'title_changed',
      titleTo: 'VP Safety',
      priority: AlertPriority.medium,
    });

    expect(prompt).toEqual(
      expect.objectContaining({
        promptType: RepActionPromptType.congratulate,
      }),
    );
  });

  it('creates and logs a prompt record', async () => {
    const db = {
      repActionPrompt: {
        create: vi.fn().mockResolvedValue({ id: 'prompt_1' }),
      },
      activityLog: {
        create: vi.fn().mockResolvedValue({ id: 'log_1' }),
      },
    };

    const prompt = await RepActionPromptService.createPrompt(
      {
        leadId: 'ck1234567890123456789012',
        promptType: RepActionPromptType.reconnect,
        title: 'Reconnect after company move',
        message: 'Reach out while the contact transition is fresh.',
        status: 'open',
        priority: AlertPriority.medium,
        confidenceScore: 0.5,
        originType: 'system_generated',
      },
      {},
      db as never,
    );

    expect(prompt).toEqual({ id: 'prompt_1' });
    expect(db.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: ActivityLogType.rep_action_prompt_created,
      }),
    });
  });

  it('creates an introduction prompt from an expansion signal', async () => {
    const db = {
      repActionPrompt: {
        create: vi.fn().mockResolvedValue({ id: 'prompt_1' }),
      },
      activityLog: {
        create: vi.fn().mockResolvedValue({ id: 'log_1' }),
      },
    };

    const prompt = await RepActionPromptService.createPromptForExpansionSignal(
      {
        id: 'ck2234567890123456789012',
        leadId: 'ck1234567890123456789012',
        repProfileId: 'ck3234567890123456789012',
        opportunityType: ExpansionOpportunityType.warm_introduction,
        companyName: 'Target Rail',
        priority: AlertPriority.high,
        summary: 'Known contact joined a target account.',
        suggestedNextStep: 'Reconnect and schedule discovery.',
      },
      db as never,
    );

    expect(prompt).toEqual({ id: 'prompt_1' });
    expect(db.repActionPrompt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        expansionOpportunitySignalId: 'ck2234567890123456789012',
        promptType: RepActionPromptType.schedule_discovery,
      }),
    });
  });
});
