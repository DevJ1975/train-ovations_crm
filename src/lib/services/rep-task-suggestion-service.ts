import {
  AlertPriority,
  LeadStatus,
  RepActionPromptType,
  RepTaskSuggestionStatus,
  RepTaskSuggestionType,
  type Prisma,
} from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import { repTaskSuggestionSchema } from '@/lib/validation/outreach-intelligence';

import type { DatabaseClient } from './types';

function mapPromptTypeToSuggestionType(promptType: RepActionPromptType) {
  switch (promptType) {
    case RepActionPromptType.congratulate:
      return RepTaskSuggestionType.reconnect_contact;
    case RepActionPromptType.schedule_discovery:
      return RepTaskSuggestionType.schedule_check_in;
    case RepActionPromptType.revive_conversation:
      return RepTaskSuggestionType.revive_opportunity;
    case RepActionPromptType.update_relationship_notes:
      return RepTaskSuggestionType.update_champion_status;
    default:
      return RepTaskSuggestionType.reconnect_contact;
  }
}

export class RepTaskSuggestionService {
  static async generateSuggestionsForLead(
    leadId: string,
    db: DatabaseClient = getPrismaClient() as DatabaseClient,
  ) {
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        repActionPrompts: {
          where: {
            status: 'open',
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        careerMovementAlerts: {
          where: {
            status: 'open',
          },
          orderBy: {
            triggeredAt: 'desc',
          },
          take: 1,
        },
        repTaskSuggestions: {
          where: {
            status: {
              in: [
                RepTaskSuggestionStatus.generated,
                RepTaskSuggestionStatus.acknowledged,
              ],
            },
          },
        },
      },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    const existingKeys = new Set(
      lead.repTaskSuggestions.map((item) =>
        item.repActionPromptId
          ? `prompt:${item.repActionPromptId}`
          : `type:${item.type}`,
      ),
    );

    const toCreate: Array<Prisma.RepTaskSuggestionUncheckedCreateInput> = [];

    if (
      lead.status === LeadStatus.new &&
      !existingKeys.has(`type:${RepTaskSuggestionType.send_follow_up}`)
    ) {
      const input = repTaskSuggestionSchema.parse({
        repProfileId: lead.repProfileId ?? undefined,
        leadId,
        type: RepTaskSuggestionType.send_follow_up,
        priority: AlertPriority.high,
        title: 'Respond to new lead',
        reason: 'This lead is still new and needs a first response.',
        explanation: 'Generated because no first-response workflow has been completed yet.',
        confidenceScore: 0.92,
        recommendedDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        sourceContext: {
          leadStatus: lead.status,
        },
      });

      toCreate.push({
        ...input,
        sourceContext: input.sourceContext as Prisma.InputJsonValue | undefined,
      });
    }

    if (
      lead.careerMovementAlerts[0] &&
      !existingKeys.has(`type:${RepTaskSuggestionType.verify_company_change}`)
    ) {
      const input = repTaskSuggestionSchema.parse({
        repProfileId: lead.repProfileId ?? undefined,
        leadId,
        careerMovementAlertId: lead.careerMovementAlerts[0].id,
        type: RepTaskSuggestionType.verify_company_change,
        priority: lead.careerMovementAlerts[0].priority,
        title: 'Verify company-change context',
        reason: lead.careerMovementAlerts[0].message,
        explanation:
          'Generated from an open career-movement alert so the rep can verify context before outreach.',
        confidenceScore: lead.careerMovementAlerts[0].confidenceScore ?? 0.72,
        recommendedDueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        sourceContext: {
          careerMovementAlertId: lead.careerMovementAlerts[0].id,
        },
      });

      toCreate.push({
        ...input,
        sourceContext: input.sourceContext as Prisma.InputJsonValue | undefined,
      });
    }

    for (const prompt of lead.repActionPrompts) {
      if (existingKeys.has(`prompt:${prompt.id}`)) {
        continue;
      }

      const input = repTaskSuggestionSchema.parse({
        repProfileId: lead.repProfileId ?? undefined,
        leadId,
        repActionPromptId: prompt.id,
        type: mapPromptTypeToSuggestionType(prompt.promptType),
        priority: prompt.priority,
        title: prompt.title,
        reason: prompt.message,
        explanation: prompt.suggestedAction ?? 'Generated from an open rep action prompt.',
        confidenceScore: 0.8,
        recommendedDueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        sourceContext: {
          promptType: prompt.promptType,
        },
      });

      toCreate.push({
        ...input,
        sourceContext: input.sourceContext as Prisma.InputJsonValue | undefined,
      });
    }

    if (!toCreate.length) {
      return [];
    }

    return Promise.all(
      toCreate.map((item) =>
        db.repTaskSuggestion.create({
          data: item,
        }),
      ),
    );
  }

  static async updateSuggestionStatus(
    suggestionId: string,
    status: RepTaskSuggestionStatus,
    db: DatabaseClient = getPrismaClient() as DatabaseClient,
  ) {
    return db.repTaskSuggestion.update({
      where: { id: suggestionId },
      data: {
        status,
      },
    });
  }
}
