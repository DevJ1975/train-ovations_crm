import {
  ActivityLogType,
  CompanyAssociationType,
  EmploymentChangeType,
  LinkedInProfileLinkStatus,
  Prisma,
  type EmploymentChangeEvent,
} from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  employmentSnapshotSchema,
  type EmploymentSnapshotInput,
} from '@/lib/validation/linkedin-identity';

import { createActivityLogEntry } from './activity-log-service';
import { CareerMovementAlertService } from './career-movement-alert-service';
import { ExpansionOpportunityService } from './expansion-opportunity-service';
import { RelationshipGraphService } from './relationship-graph-service';
import type { DatabaseClient } from './types';

export class EmploymentChangeDetectionService {
  static detectEmploymentChanges(input: {
    previousSnapshot?: {
      id: string;
      title: string;
      companyName: string;
      retrievedAt: Date;
    } | null;
    currentSnapshot: {
      title: string;
      companyName: string;
      retrievedAt: Date;
    };
    linkedProfileStatus?: LinkedInProfileLinkStatus;
  }) {
    const changes: Array<{
      changeType: EmploymentChangeType;
      titleFrom?: string;
      titleTo?: string;
      companyFrom?: string;
      companyTo?: string;
      confidenceScore: number;
    }> = [];

    if (!input.previousSnapshot) {
      if (input.linkedProfileStatus === LinkedInProfileLinkStatus.broken) {
        changes.push({
          changeType: EmploymentChangeType.broken_profile_link,
          confidenceScore: 0.95,
        });
      }

      return changes;
    }

    if (input.previousSnapshot.companyName !== input.currentSnapshot.companyName) {
      changes.push({
        changeType: EmploymentChangeType.company_changed,
        companyFrom: input.previousSnapshot.companyName,
        companyTo: input.currentSnapshot.companyName,
        confidenceScore: 0.92,
      });
      changes.push({
        changeType: EmploymentChangeType.departed_prior_employer,
        companyFrom: input.previousSnapshot.companyName,
        companyTo: input.currentSnapshot.companyName,
        confidenceScore: 0.88,
      });
    }

    if (input.previousSnapshot.title !== input.currentSnapshot.title) {
      changes.push({
        changeType: EmploymentChangeType.title_changed,
        titleFrom: input.previousSnapshot.title,
        titleTo: input.currentSnapshot.title,
        confidenceScore: 0.84,
      });
    }

    const ageMs =
      input.currentSnapshot.retrievedAt.getTime() - input.previousSnapshot.retrievedAt.getTime();
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;

    if (ageMs > ninetyDays) {
      changes.push({
        changeType: EmploymentChangeType.stale_profile_data,
        confidenceScore: 0.7,
      });
    }

    if (input.linkedProfileStatus === LinkedInProfileLinkStatus.broken) {
      changes.push({
        changeType: EmploymentChangeType.broken_profile_link,
        confidenceScore: 0.95,
      });
    }

    return changes;
  }

  static async refreshEmploymentSnapshot(
    input: EmploymentSnapshotInput,
    db: DatabaseClient = getPrismaClient(),
  ) {
    const validated = employmentSnapshotSchema.parse(input);
    const previousSnapshot = await db.employmentSnapshot.findFirst({
      where: { leadId: validated.leadId },
      orderBy: { retrievedAt: 'desc' },
    });
    const profileLink = validated.linkedInProfileLinkId
      ? await db.linkedInProfileLink.findUnique({
          where: { id: validated.linkedInProfileLinkId },
        })
      : null;

    const snapshot = await db.employmentSnapshot.create({
      data: {
        ...validated,
        metadata: validated.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    await RelationshipGraphService.syncRelationshipHistoryFromSnapshot(
      {
        ...snapshot,
        linkedInProfileLinkId: validated.linkedInProfileLinkId,
      },
      db,
    );

    await createActivityLogEntry(
      {
        type: ActivityLogType.employment_snapshot_refreshed,
        description: 'Employment snapshot refreshed for lead.',
        leadId: validated.leadId,
        metadata: {
          employmentSnapshotId: snapshot.id,
          companyName: snapshot.companyName,
          title: snapshot.title,
          sourceType: snapshot.sourceType,
          confidenceScore: snapshot.confidenceScore,
        },
      },
      db,
    );

    const changes = this.detectEmploymentChanges({
      previousSnapshot,
      currentSnapshot: snapshot,
      linkedProfileStatus: profileLink?.status,
    });

    const watchlist = await db.contactWatchlist.findUnique({
      where: { leadId: validated.leadId },
    });
    const championFlag = await db.championFlag.findUnique({
      where: { leadId: validated.leadId },
    });
    const destinationStrategicAssociation =
      snapshot.companyName && previousSnapshot?.companyName !== snapshot.companyName
        ? await db.contactCompanyAssociation.findFirst({
            where: {
              leadId: validated.leadId,
              companyName: snapshot.companyName,
              associationType: {
                in: [
                  CompanyAssociationType.target_account,
                  CompanyAssociationType.strategic_account,
                  CompanyAssociationType.client_account,
                  CompanyAssociationType.former_client,
                ],
              },
            },
            orderBy: [{ isStrategic: 'desc' }, { updatedAt: 'desc' }],
          })
        : null;

    const createdEvents: EmploymentChangeEvent[] = [];

    for (const change of changes) {
      const event = await db.employmentChangeEvent.create({
        data: {
          leadId: validated.leadId,
          linkedInProfileLinkId: validated.linkedInProfileLinkId,
          priorSnapshotId: previousSnapshot?.id,
          currentSnapshotId: snapshot.id,
          changeType: change.changeType,
          titleFrom: change.titleFrom,
          titleTo: change.titleTo,
          companyFrom: change.companyFrom,
          companyTo: change.companyTo,
          confidenceScore: change.confidenceScore,
          metadata: {
            sourceType: validated.sourceType,
          } as Prisma.InputJsonValue,
        },
      });

      createdEvents.push(event);

      if (change.changeType === EmploymentChangeType.title_changed) {
        await createActivityLogEntry(
          {
            type: ActivityLogType.employment_title_changed,
            description: 'Employment title change detected.',
            leadId: validated.leadId,
            metadata: {
              employmentChangeEventId: event.id,
              titleFrom: change.titleFrom,
              titleTo: change.titleTo,
            },
          },
          db,
        );
      }

      if (change.changeType === EmploymentChangeType.company_changed) {
        await createActivityLogEntry(
          {
            type: ActivityLogType.employment_company_changed,
            description: 'Employment company change detected.',
            leadId: validated.leadId,
            metadata: {
              employmentChangeEventId: event.id,
              companyFrom: change.companyFrom,
              companyTo: change.companyTo,
            },
          },
          db,
        );
      }

      await CareerMovementAlertService.createAlertForEmploymentChange(
        event,
        {
          linkedInProfileLinkId: validated.linkedInProfileLinkId,
          isChampion: championFlag?.isActive,
          watchlistPriority: watchlist?.priority ?? null,
          destinationCompanyStrategic: Boolean(destinationStrategicAssociation),
        },
        db,
      );

      if (change.changeType === EmploymentChangeType.company_changed) {
        await ExpansionOpportunityService.evaluateAndCreateFromEmploymentChange(
          {
            changeEvent: event,
            repProfileId: null,
            isChampion: championFlag?.isActive,
          },
          db,
        );
      }
    }

    return {
      snapshot,
      changes: createdEvents,
    };
  }
}
