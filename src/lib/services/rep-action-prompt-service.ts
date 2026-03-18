import {
  ActivityLogType,
  AlertPriority,
  EmploymentChangeType,
  ExpansionOpportunityType,
  Prisma,
  RecordOriginType,
  RepActionPromptStatus,
  RepActionPromptType,
  type CareerMovementAlert,
  type ExpansionOpportunitySignal,
} from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  repActionPromptSchema,
  type RepActionPromptInput,
} from '@/lib/validation/relationship-intelligence';

import { createActivityLogEntry } from './activity-log-service';
import type { DatabaseClient } from './types';

export class RepActionPromptService {
  static derivePromptFromCareerMovement(input: {
    changeType: EmploymentChangeType;
    companyTo?: string | null;
    titleTo?: string | null;
    isChampion?: boolean;
    priority?: AlertPriority;
  }) {
    if (input.changeType === EmploymentChangeType.title_changed) {
      return {
        promptType: RepActionPromptType.congratulate,
        title: 'Congratulate contact on role change',
        message: `Reach out to acknowledge the new role${input.titleTo ? ` as ${input.titleTo}` : ''} and reopen the conversation while the transition is fresh.`,
        suggestedAction: 'Send a short congratulations note and propose a follow-up conversation.',
        priority: input.priority ?? AlertPriority.medium,
      };
    }

    if (input.changeType === EmploymentChangeType.company_changed) {
      return {
        promptType:
          input.isChampion || input.priority === AlertPriority.urgent
            ? RepActionPromptType.introduce_trainovations
            : RepActionPromptType.reconnect,
        title: input.isChampion
          ? 'Reconnect with champion at new company'
          : 'Reconnect after company move',
        message: `A known contact moved${input.companyTo ? ` to ${input.companyTo}` : ' to a new company'}. Re-establish the relationship while context is current.`,
        suggestedAction: input.isChampion
          ? 'Reintroduce Trainovations and identify whether the new company has a safety-training need.'
          : 'Reach out with a contextual follow-up and ask about the new role.',
        priority: input.priority ?? AlertPriority.high,
      };
    }

    if (input.changeType === EmploymentChangeType.broken_profile_link) {
      return {
        promptType: RepActionPromptType.update_relationship_notes,
        title: 'Review relationship data quality',
        message: 'Profile data needs review before acting on relationship intelligence.',
        suggestedAction: 'Confirm the profile link and update the contact context.',
        priority: AlertPriority.low,
      };
    }

    return null;
  }

  static derivePromptFromExpansionSignal(
    signal: Pick<
      ExpansionOpportunitySignal,
      'opportunityType' | 'companyName' | 'priority' | 'summary' | 'suggestedNextStep'
    >,
  ) {
    const promptType =
      signal.opportunityType === ExpansionOpportunityType.warm_introduction
        ? RepActionPromptType.schedule_discovery
        : signal.opportunityType === ExpansionOpportunityType.recovery
          ? RepActionPromptType.revive_conversation
          : RepActionPromptType.introduce_trainovations;

    return {
      promptType,
      title: `Act on relationship opportunity at ${signal.companyName}`,
      message: signal.summary,
      suggestedAction:
        signal.suggestedNextStep ??
        'Review the account context and decide on the best rep-led follow-up.',
      priority: signal.priority,
    };
  }

  static async createPrompt(
    input: RepActionPromptInput,
    options: {
      actorUserId?: string;
      repProfileId?: string;
    } = {},
    db: DatabaseClient = getPrismaClient(),
  ) {
    const validated = repActionPromptSchema.parse(input);

    const prompt = await db.repActionPrompt.create({
      data: {
        ...validated,
        metadata: validated.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    await createActivityLogEntry(
      {
        type: ActivityLogType.rep_action_prompt_created,
        description: 'Rep action prompt created.',
        actorUserId: options.actorUserId,
        repProfileId: options.repProfileId ?? validated.repProfileId,
        leadId: validated.leadId,
        metadata: {
          repActionPromptId: prompt.id,
          promptType: prompt.promptType,
          priority: prompt.priority,
          careerMovementAlertId: prompt.careerMovementAlertId,
          expansionOpportunitySignalId: prompt.expansionOpportunitySignalId,
        } satisfies Prisma.InputJsonValue,
      },
      db,
    );

    return prompt;
  }

  static async createPromptForCareerMovement(
    input: {
      leadId: string;
      repProfileId?: string | null;
      alert: Pick<CareerMovementAlert, 'id' | 'priority' | 'title' | 'message'>;
      changeType: EmploymentChangeType;
      companyTo?: string | null;
      titleTo?: string | null;
      isChampion?: boolean;
    },
    db: DatabaseClient = getPrismaClient(),
  ) {
    const derived = this.derivePromptFromCareerMovement({
      changeType: input.changeType,
      companyTo: input.companyTo,
      titleTo: input.titleTo,
      isChampion: input.isChampion,
      priority: input.alert.priority,
    });

    if (!derived) {
      return null;
    }

    return this.createPrompt(
      {
        leadId: input.leadId,
        repProfileId: input.repProfileId ?? undefined,
        careerMovementAlertId: input.alert.id,
        promptType: derived.promptType,
        status: RepActionPromptStatus.open,
        originType: RecordOriginType.system_generated,
        confidenceScore: 0.5,
        priority: derived.priority,
        title: derived.title,
        message: derived.message,
        suggestedAction: derived.suggestedAction,
        metadata: {
          source: 'career_movement',
          alertTitle: input.alert.title,
        },
      },
      {
        repProfileId: input.repProfileId ?? undefined,
      },
      db,
    );
  }

  static async createPromptForExpansionSignal(
    signal: Pick<
      ExpansionOpportunitySignal,
      'id' | 'leadId' | 'repProfileId' | 'opportunityType' | 'companyName' | 'priority' | 'summary' | 'suggestedNextStep'
    >,
    db: DatabaseClient = getPrismaClient(),
  ) {
    const derived = this.derivePromptFromExpansionSignal(signal);

    return this.createPrompt(
      {
        leadId: signal.leadId,
        repProfileId: signal.repProfileId ?? undefined,
        expansionOpportunitySignalId: signal.id,
        promptType: derived.promptType,
        status: RepActionPromptStatus.open,
        originType: RecordOriginType.system_generated,
        confidenceScore: 0.5,
        priority: derived.priority,
        title: derived.title,
        message: derived.message,
        suggestedAction: derived.suggestedAction,
        metadata: {
          source: 'expansion_opportunity',
          companyName: signal.companyName,
          opportunityType: signal.opportunityType,
        },
      },
      {
        repProfileId: signal.repProfileId ?? undefined,
      },
      db,
    );
  }
}
