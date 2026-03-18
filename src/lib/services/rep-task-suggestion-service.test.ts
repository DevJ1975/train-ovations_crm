import {
  AlertPriority,
  LeadStatus,
  RepTaskSuggestionStatus,
  RepTaskSuggestionType,
} from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { RepTaskSuggestionService } from './rep-task-suggestion-service';

describe('RepTaskSuggestionService', () => {
  it('generates task suggestions from new-lead state and open prompts', async () => {
    const db = {
      lead: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'ck1234567890123456789012',
          repProfileId: 'ck2234567890123456789012',
          status: LeadStatus.new,
          repActionPrompts: [
            {
              id: 'ck3234567890123456789012',
              promptType: 'schedule_discovery',
              priority: AlertPriority.high,
              title: 'Schedule discovery',
              message: 'Reconnect and schedule discovery.',
              suggestedAction: 'Book a 30-minute call.',
            },
          ],
          careerMovementAlerts: [
            {
              id: 'ck4234567890123456789012',
              priority: AlertPriority.high,
              message: 'Contact moved companies.',
              confidenceScore: 0.83,
            },
          ],
          repTaskSuggestions: [],
        }),
      },
      repTaskSuggestion: {
        create: vi
          .fn()
          .mockResolvedValueOnce({ id: 'ck5234567890123456789012' })
          .mockResolvedValueOnce({ id: 'ck6234567890123456789012' })
          .mockResolvedValueOnce({ id: 'ck7234567890123456789012' }),
        update: vi.fn().mockResolvedValue({
          id: 'ck5234567890123456789012',
          status: RepTaskSuggestionStatus.acknowledged,
        }),
      },
    } as any;

    const result = await RepTaskSuggestionService.generateSuggestionsForLead(
      'ck1234567890123456789012',
      db,
    );

    expect(result).toHaveLength(3);
    expect(db.repTaskSuggestion.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          type: RepTaskSuggestionType.send_follow_up,
        }),
      }),
    );
  });

  it('updates task suggestion status', async () => {
    const db = {
      repTaskSuggestion: {
        update: vi.fn().mockResolvedValue({
          id: 'ck5234567890123456789012',
          status: RepTaskSuggestionStatus.converted,
        }),
      },
    } as any;

    await RepTaskSuggestionService.updateSuggestionStatus(
      'ck5234567890123456789012',
      RepTaskSuggestionStatus.converted,
      db,
    );

    expect(db.repTaskSuggestion.update).toHaveBeenCalledWith({
      where: { id: 'ck5234567890123456789012' },
      data: {
        status: RepTaskSuggestionStatus.converted,
      },
    });
  });
});
