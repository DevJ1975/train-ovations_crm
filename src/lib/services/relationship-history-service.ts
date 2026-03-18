import {
  CompanyAssociationType,
  ContactAssociationStatus,
  Prisma,
  RecordOriginType,
  RelationshipStage,
  type EmploymentSnapshot,
} from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  contactCompanyAssociationSchema,
  relationshipMilestoneSchema,
  type ContactCompanyAssociationInput,
  type RelationshipMilestoneInput,
} from '@/lib/validation/relationship-intelligence';

import type { DatabaseClient } from './types';

export class RelationshipHistoryService {
  static async syncFromEmploymentSnapshot(
    snapshot: Pick<
      EmploymentSnapshot,
      | 'leadId'
      | 'linkedInProfileLinkId'
      | 'companyName'
      | 'title'
      | 'startDate'
      | 'endDate'
      | 'confidenceScore'
      | 'sourceType'
      | 'retrievedAt'
    > & {
      repProfileId?: string | null;
      externalProfileSourceId?: string | null;
      originType?: RecordOriginType;
    },
    db: DatabaseClient = getPrismaClient(),
  ) {
    const originType = snapshot.originType ?? RecordOriginType.external_source;

    await db.relationshipHistory.updateMany({
      where: {
        leadId: snapshot.leadId,
        stage: RelationshipStage.current,
        companyName: {
          not: snapshot.companyName,
        },
      },
      data: {
        stage: RelationshipStage.historical,
        endDate: snapshot.endDate ?? snapshot.retrievedAt,
      },
    });

    const existing = await db.relationshipHistory.findFirst({
      where: {
        leadId: snapshot.leadId,
        companyName: snapshot.companyName,
        stage: RelationshipStage.current,
      },
    });

    const relationshipHistory = existing
      ? await db.relationshipHistory.update({
          where: { id: existing.id },
          data: {
            repProfileId: snapshot.repProfileId ?? undefined,
            linkedInProfileLinkId: snapshot.linkedInProfileLinkId ?? undefined,
            externalProfileSourceId: snapshot.externalProfileSourceId ?? undefined,
            title: snapshot.title,
            startDate: snapshot.startDate,
            endDate: snapshot.endDate,
            confidenceScore: snapshot.confidenceScore,
            sourceType: snapshot.sourceType,
            originType,
          },
        })
      : await db.relationshipHistory.create({
          data: {
            leadId: snapshot.leadId,
            repProfileId: snapshot.repProfileId ?? undefined,
            linkedInProfileLinkId: snapshot.linkedInProfileLinkId ?? undefined,
            externalProfileSourceId: snapshot.externalProfileSourceId ?? undefined,
            companyName: snapshot.companyName,
            title: snapshot.title,
            startDate: snapshot.startDate,
            endDate: snapshot.endDate,
            confidenceScore: snapshot.confidenceScore,
            sourceType: snapshot.sourceType,
            originType,
            stage: RelationshipStage.current,
          },
        });

    const companyAssociation = await this.upsertCompanyAssociation(
      {
        leadId: snapshot.leadId,
        companyName: snapshot.companyName,
        associationType: CompanyAssociationType.current_employer,
        status: ContactAssociationStatus.active,
        isCurrent: true,
        sourceType: snapshot.sourceType,
        originType,
        confidenceScore: snapshot.confidenceScore,
        startDate: snapshot.startDate ?? undefined,
        endDate: snapshot.endDate ?? undefined,
        lastVerifiedAt: snapshot.retrievedAt,
        externalProfileSourceId: snapshot.externalProfileSourceId ?? undefined,
        isStrategic: false,
      },
      db,
    );

    return {
      relationshipHistory,
      companyAssociation,
    };
  }

  static async upsertCompanyAssociation(
    input: ContactCompanyAssociationInput,
    db: DatabaseClient = getPrismaClient(),
  ) {
    const validated = contactCompanyAssociationSchema.parse(input);

    if (
      validated.associationType === CompanyAssociationType.current_employer &&
      validated.isCurrent
    ) {
      await db.contactCompanyAssociation.updateMany({
        where: {
          leadId: validated.leadId,
          associationType: CompanyAssociationType.current_employer,
          companyName: {
            not: validated.companyName,
          },
        },
        data: {
          isCurrent: false,
          status: ContactAssociationStatus.historical,
          endDate: validated.endDate ?? validated.lastVerifiedAt ?? new Date(),
        },
      });
    }

    const existing = await db.contactCompanyAssociation.findFirst({
      where: {
        leadId: validated.leadId,
        companyName: validated.companyName,
        associationType: validated.associationType,
      },
    });

    const { metadata, ...validatedRest } = validated;
    const prismaMetadata = metadata as Prisma.InputJsonValue | undefined;

    if (existing) {
      return db.contactCompanyAssociation.update({
        where: { id: existing.id },
        data: {
          ...validatedRest,
          metadata: prismaMetadata,
        },
      });
    }

    return db.contactCompanyAssociation.create({
      data: {
        ...validatedRest,
        metadata: prismaMetadata,
      },
    });
  }

  static async createRelationshipMilestone(
    input: RelationshipMilestoneInput,
    db: DatabaseClient = getPrismaClient(),
  ) {
    const validated = relationshipMilestoneSchema.parse(input);

    return db.relationshipMilestone.create({
      data: {
        ...validated,
        metadata: validated.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  static async getLeadRelationshipTimeline(
    leadId: string,
    db: DatabaseClient = getPrismaClient(),
  ) {
    const [history, milestones, companyAssociations] = await Promise.all([
      db.relationshipHistory.findMany({
        where: { leadId },
        orderBy: [{ stage: 'asc' }, { startDate: 'desc' }],
      }),
      db.relationshipMilestone.findMany({
        where: { leadId },
        orderBy: { occurredAt: 'desc' },
      }),
      db.contactCompanyAssociation.findMany({
        where: { leadId },
        orderBy: [{ isCurrent: 'desc' }, { updatedAt: 'desc' }],
      }),
    ]);

    return {
      history,
      milestones,
      companyAssociations,
    };
  }
}
