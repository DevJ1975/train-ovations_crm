import {
  ActivityLogType,
  AlertPriority,
  EmploymentChangeType,
  Prisma,
  RecordOriginType,
  type EmploymentChangeEvent,
} from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  careerMovementAlertSchema,
  type CareerMovementAlertInput,
} from '@/lib/validation/linkedin-identity';

import { createActivityLogEntry } from './activity-log-service';
import { RepActionPromptService } from './rep-action-prompt-service';
import type { DatabaseClient } from './types';

export class CareerMovementAlertService {
  static derivePriority(input: {
    changeType: EmploymentChangeType;
    isChampion?: boolean;
    watchlistPriority?: 'normal' | 'high' | 'critical' | null;
  }) {
    if (input.isChampion && input.changeType === EmploymentChangeType.company_changed) {
      return AlertPriority.urgent;
    }

    if (input.watchlistPriority === 'critical') {
      return AlertPriority.urgent;
    }

    if (
      input.watchlistPriority === 'high' ||
      input.changeType === EmploymentChangeType.company_changed
    ) {
      return AlertPriority.high;
    }

    if (input.changeType === EmploymentChangeType.broken_profile_link) {
      return AlertPriority.medium;
    }

    return AlertPriority.low;
  }

  static async createAlert(
    input: CareerMovementAlertInput,
    db: DatabaseClient = getPrismaClient(),
  ) {
    const validated = careerMovementAlertSchema.parse(input);

    return db.careerMovementAlert.create({
      data: {
        ...validated,
        metadata: validated.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  static async createAlertForEmploymentChange(
    changeEvent: EmploymentChangeEvent,
    options: {
      linkedInProfileLinkId?: string;
      isChampion?: boolean;
      watchlistPriority?: 'normal' | 'high' | 'critical' | null;
      actorUserId?: string;
      repProfileId?: string;
      destinationCompanyStrategic?: boolean;
    } = {},
    db: DatabaseClient = getPrismaClient(),
  ) {
    const priority = this.derivePriority({
      changeType: changeEvent.changeType,
      isChampion: options.isChampion,
      watchlistPriority: options.watchlistPriority ?? null,
    });
    const alertInput: CareerMovementAlertInput = {
      leadId: changeEvent.leadId,
      linkedInProfileLinkId: options.linkedInProfileLinkId,
      employmentChangeEventId: changeEvent.id,
      priority,
      title:
        changeEvent.changeType === EmploymentChangeType.company_changed
          ? options.destinationCompanyStrategic
            ? 'Strategic company movement detected'
            : 'Company movement detected'
          : changeEvent.changeType === EmploymentChangeType.title_changed
            ? 'Title change detected'
            : changeEvent.changeType === EmploymentChangeType.broken_profile_link
              ? 'LinkedIn profile needs review'
              : 'Employment update detected',
      message:
        changeEvent.changeType === EmploymentChangeType.company_changed
          ? options.destinationCompanyStrategic
            ? `Contact moved from ${changeEvent.companyFrom ?? 'a previous company'} to strategically relevant company ${changeEvent.companyTo ?? 'a new company'}.`
            : `Contact moved from ${changeEvent.companyFrom ?? 'a previous company'} to ${changeEvent.companyTo ?? 'a new company'}.`
          : changeEvent.changeType === EmploymentChangeType.title_changed
            ? `Contact title changed from ${changeEvent.titleFrom ?? 'a prior title'} to ${changeEvent.titleTo ?? 'a new title'}.`
            : changeEvent.changeType === EmploymentChangeType.broken_profile_link
              ? 'A linked LinkedIn profile is unresolved or broken and should be reviewed.'
              : 'Employment data changed and should be reviewed.',
      suggestedNextStep:
        changeEvent.changeType === EmploymentChangeType.company_changed
          ? options.destinationCompanyStrategic
            ? 'Review whether this move creates an account-entry or expansion opportunity.'
            : 'Review the destination company and decide whether the relationship should be reactivated.'
          : changeEvent.changeType === EmploymentChangeType.title_changed
            ? 'Consider whether the new role warrants a congratulatory follow-up.'
            : undefined,
      confidenceScore: 0.5,
      originType: RecordOriginType.system_generated,
      metadata: {
        changeType: changeEvent.changeType,
        confidenceScore: changeEvent.confidenceScore,
        destinationCompanyStrategic: options.destinationCompanyStrategic ?? false,
      },
    };
    const alert = await this.createAlert(alertInput, db);

    await createActivityLogEntry(
      {
        type: ActivityLogType.career_movement_alert_created,
        description: 'Career movement alert created for contact.',
        leadId: changeEvent.leadId,
        actorUserId: options.actorUserId,
        repProfileId: options.repProfileId,
        metadata: {
          careerMovementAlertId: alert.id,
          changeType: changeEvent.changeType,
          priority,
          companyFrom: changeEvent.companyFrom,
          companyTo: changeEvent.companyTo,
        },
      },
      db,
    );

    if (options.isChampion && changeEvent.changeType === EmploymentChangeType.company_changed) {
      await createActivityLogEntry(
        {
          type: ActivityLogType.champion_moved_companies,
          description: 'Champion contact changed companies.',
          leadId: changeEvent.leadId,
          actorUserId: options.actorUserId,
          repProfileId: options.repProfileId,
          metadata: {
            alertId: alert.id,
            companyFrom: changeEvent.companyFrom,
            companyTo: changeEvent.companyTo,
          },
        },
        db,
      );
    }

    await RepActionPromptService.createPromptForCareerMovement(
      {
        leadId: changeEvent.leadId,
        repProfileId: options.repProfileId,
        alert: {
          id: alert.id,
          priority,
          title: alertInput.title,
          message: alertInput.message,
        },
        changeType: changeEvent.changeType,
        companyTo: changeEvent.companyTo,
        titleTo: changeEvent.titleTo,
        isChampion: options.isChampion,
      },
      db,
    );

    return alert;
  }
}
