import {
  ActivityLogType,
  AlertPriority,
  CompanyAssociationType,
  ExpansionOpportunityStatus,
  ExpansionOpportunityType,
  Prisma,
  RecordOriginType,
  type ContactCompanyAssociation,
  type EmploymentChangeEvent,
} from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  expansionOpportunitySignalSchema,
  type ExpansionOpportunitySignalInput,
} from '@/lib/validation/relationship-intelligence';

import { createActivityLogEntry } from './activity-log-service';
import { RepActionPromptService } from './rep-action-prompt-service';
import type { DatabaseClient } from './types';

type DestinationAccountContext = Pick<
  ContactCompanyAssociation,
  'id' | 'companyName' | 'associationType' | 'isStrategic' | 'status'
>;

export class ExpansionOpportunityService {
  static evaluateEmploymentChangeOpportunity(input: {
    changeEvent: Pick<
      EmploymentChangeEvent,
      'leadId' | 'changeType' | 'companyTo' | 'companyFrom' | 'confidenceScore' | 'id'
    >;
    destinationAccount?: DestinationAccountContext | null;
    isChampion?: boolean;
    leadIndustry?: string | null;
  }) {
    const destination = input.destinationAccount;

    if (!destination || !input.changeEvent.companyTo) {
      return null;
    }

    const priority =
      destination.isStrategic ||
      destination.associationType === CompanyAssociationType.strategic_account
        ? AlertPriority.urgent
        : destination.associationType === CompanyAssociationType.target_account ||
            destination.associationType === CompanyAssociationType.client_account
          ? AlertPriority.high
          : AlertPriority.medium;

    if (destination.associationType === CompanyAssociationType.competitor_account) {
      return null;
    }

    const opportunityType =
      destination.associationType === CompanyAssociationType.former_client
        ? ExpansionOpportunityType.recovery
        : destination.associationType === CompanyAssociationType.client_account
          ? ExpansionOpportunityType.expansion
          : destination.associationType === CompanyAssociationType.target_account
            ? ExpansionOpportunityType.warm_introduction
            : destination.associationType === CompanyAssociationType.strategic_account
              ? ExpansionOpportunityType.strategic_account
              : ExpansionOpportunityType.named_account;

    const summary =
      opportunityType === ExpansionOpportunityType.recovery
        ? `A known contact moved to former customer ${destination.companyName}, creating a recovery opportunity.`
        : opportunityType === ExpansionOpportunityType.expansion
          ? `A known contact joined current customer ${destination.companyName}, creating an account expansion opportunity.`
          : opportunityType === ExpansionOpportunityType.warm_introduction
            ? `A known contact joined target account ${destination.companyName}, creating a warm introduction opportunity.`
            : `A known contact joined strategically relevant account ${destination.companyName}.`;

    const suggestedNextStep =
      input.isChampion || opportunityType === ExpansionOpportunityType.warm_introduction
        ? 'Reconnect with the contact and propose a short discovery meeting at the new company.'
        : opportunityType === ExpansionOpportunityType.expansion
          ? 'Share relationship context with the owning rep and identify an expansion entry point.'
          : 'Review the new company context and decide whether to reopen outreach.';

    const rationaleParts = [
      `Detected employment move from ${input.changeEvent.companyFrom ?? 'a prior company'} to ${destination.companyName}.`,
      `Association type: ${destination.associationType.replace(/_/g, ' ')}.`,
    ];

    if (destination.isStrategic) {
      rationaleParts.push('Destination account is marked strategic.');
    }

    if (input.leadIndustry?.toLowerCase().includes('safety')) {
      rationaleParts.push('Lead industry indicates strong product relevance.');
    }

    return {
      opportunityType,
      priority,
      title: `Relationship opportunity at ${destination.companyName}`,
      companyName: destination.companyName,
      summary,
      suggestedNextStep,
      rationale: rationaleParts.join(' '),
      confidenceScore: Math.max(input.changeEvent.confidenceScore, 0.75),
      contactCompanyAssociationId: destination.id,
      employmentChangeEventId: input.changeEvent.id,
    };
  }

  static async createSignal(
    input: ExpansionOpportunitySignalInput,
    options: {
      actorUserId?: string;
      repProfileId?: string;
    } = {},
    db: DatabaseClient = getPrismaClient(),
  ) {
    const validated = expansionOpportunitySignalSchema.parse(input);

    const signal = await db.expansionOpportunitySignal.create({
      data: {
        ...validated,
        metadata: validated.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    await createActivityLogEntry(
      {
        type: ActivityLogType.expansion_opportunity_detected,
        description: 'Relationship expansion opportunity detected.',
        actorUserId: options.actorUserId,
        repProfileId: options.repProfileId ?? validated.repProfileId,
        leadId: validated.leadId,
        metadata: {
          expansionOpportunitySignalId: signal.id,
          opportunityType: signal.opportunityType,
          companyName: signal.companyName,
          priority: signal.priority,
          confidenceScore: signal.confidenceScore,
        } satisfies Prisma.InputJsonValue,
      },
      db,
    );

    await RepActionPromptService.createPromptForExpansionSignal(
      {
        id: signal.id,
        leadId: signal.leadId,
        repProfileId: signal.repProfileId ?? null,
        opportunityType: signal.opportunityType,
        companyName: signal.companyName,
        priority: signal.priority,
        summary: signal.summary,
        suggestedNextStep: signal.suggestedNextStep,
      },
      db,
    );

    return signal;
  }

  static async evaluateAndCreateFromEmploymentChange(
    input: {
      changeEvent: Pick<
        EmploymentChangeEvent,
        | 'id'
        | 'leadId'
        | 'changeType'
        | 'companyTo'
        | 'companyFrom'
        | 'confidenceScore'
      >;
      repProfileId?: string | null;
      isChampion?: boolean;
    },
    db: DatabaseClient = getPrismaClient(),
  ) {
    if (!input.changeEvent.companyTo) {
      return null;
    }

    const [destinationAccount, lead] = await Promise.all([
      db.contactCompanyAssociation.findFirst({
        where: {
          leadId: input.changeEvent.leadId,
          companyName: input.changeEvent.companyTo,
          associationType: {
            in: [
              CompanyAssociationType.target_account,
              CompanyAssociationType.strategic_account,
              CompanyAssociationType.client_account,
              CompanyAssociationType.former_client,
              CompanyAssociationType.prospect_account,
              CompanyAssociationType.competitor_account,
            ],
          },
        },
        orderBy: [{ isStrategic: 'desc' }, { updatedAt: 'desc' }],
      }),
      db.lead.findUnique({
        where: { id: input.changeEvent.leadId },
        select: {
          industry: true,
          repProfileId: true,
        },
      }),
    ]);

    const evaluation = this.evaluateEmploymentChangeOpportunity({
      changeEvent: input.changeEvent,
      destinationAccount,
      isChampion: input.isChampion,
      leadIndustry: lead?.industry ?? null,
    });

    if (!evaluation) {
      return null;
    }

    return this.createSignal(
      {
        leadId: input.changeEvent.leadId,
        repProfileId: input.repProfileId ?? lead?.repProfileId ?? undefined,
        contactCompanyAssociationId: evaluation.contactCompanyAssociationId,
        employmentChangeEventId: evaluation.employmentChangeEventId,
        opportunityType: evaluation.opportunityType,
        status: ExpansionOpportunityStatus.open,
        originType: RecordOriginType.system_generated,
        priority: evaluation.priority,
        companyName: evaluation.companyName,
        title: evaluation.title,
        summary: evaluation.summary,
        suggestedNextStep: evaluation.suggestedNextStep,
        rationale: evaluation.rationale,
        confidenceScore: evaluation.confidenceScore,
        metadata: {
          changeType: input.changeEvent.changeType,
          companyFrom: input.changeEvent.companyFrom,
          companyTo: input.changeEvent.companyTo,
        },
      },
      {
        repProfileId: input.repProfileId ?? lead?.repProfileId ?? undefined,
      },
      db,
    );
  }
}
