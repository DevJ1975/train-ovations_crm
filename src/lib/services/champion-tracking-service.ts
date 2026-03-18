import {
  ActivityLogType,
  ChampionStatus,
  Prisma,
  RelationshipMilestoneType,
  type ChampionFlag,
} from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  championFlagSchema,
  type ChampionFlagInput,
} from '@/lib/validation/linkedin-identity';

import { createActivityLogEntry } from './activity-log-service';
import type { DatabaseClient } from './types';

function getDefaultChampionStatus(input: {
  isActive: boolean;
  explicitStatus?: ChampionStatus;
  previous?: Pick<ChampionFlag, 'status' | 'isActive'> | null;
}) {
  if (input.explicitStatus) {
    return input.explicitStatus;
  }

  if (input.isActive) {
    return ChampionStatus.active;
  }

  if (input.previous?.isActive) {
    return ChampionStatus.former;
  }

  return input.previous?.status ?? ChampionStatus.archived;
}

export class ChampionTrackingService {
  static resolveChampionState(
    input: ChampionFlagInput,
    previous?: Pick<ChampionFlag, 'status' | 'isActive'> | null,
  ) {
    const validated = championFlagSchema.parse(input);
    const isActive = validated.isActive;
    const status = getDefaultChampionStatus({
      isActive,
      explicitStatus: validated.status,
      previous: previous ?? null,
    });

    return { ...validated, isActive, status };
  }

  static async updateChampionFlag(
    input: ChampionFlagInput,
    options: {
      actorUserId?: string;
      createMilestone?: boolean;
    } = {},
    db: DatabaseClient = getPrismaClient(),
  ) {
    const existing = await db.championFlag.findUnique({
      where: { leadId: input.leadId },
    });
    const validated = this.resolveChampionState(input, existing ?? null);
    const now = new Date();
    const statusChanged =
      !existing ||
      existing.status !== validated.status ||
      existing.isActive !== validated.isActive;

    const championFlag = await db.championFlag.upsert({
      where: { leadId: validated.leadId },
      update: {
        ...validated,
        lastStatusChangedAt: statusChanged
          ? now
          : existing?.lastStatusChangedAt ?? now,
      },
      create: {
        ...validated,
        lastStatusChangedAt: now,
      },
    });

    await createActivityLogEntry(
      {
        type: ActivityLogType.champion_flag_updated,
        description: championFlag.isActive
          ? 'Champion tracking updated for contact.'
          : 'Champion flag removed from contact.',
        actorUserId: options.actorUserId,
        repProfileId: championFlag.ownerRepProfileId ?? undefined,
        leadId: championFlag.leadId,
        metadata: {
          championFlagId: championFlag.id,
          previousStatus: existing?.status ?? null,
          nextStatus: championFlag.status,
          priority: championFlag.priority,
          confidenceScore: championFlag.confidenceScore,
          originType: championFlag.originType,
        } satisfies Prisma.InputJsonValue,
      },
      db,
    );

    if (options.createMilestone !== false && statusChanged) {
      await db.relationshipMilestone.create({
        data: {
          leadId: championFlag.leadId,
          repProfileId: championFlag.ownerRepProfileId ?? undefined,
          milestoneType: RelationshipMilestoneType.champion_status,
          title: championFlag.isActive
            ? 'Champion status activated'
            : 'Champion status changed',
          description: championFlag.rationale ?? championFlag.notes ?? undefined,
          occurredAt: now,
          originType: championFlag.originType,
          confidenceScore: championFlag.confidenceScore,
          metadata: {
            championFlagId: championFlag.id,
            previousStatus: existing?.status ?? null,
            nextStatus: championFlag.status,
          } satisfies Prisma.InputJsonValue,
        },
      });
    }

    return championFlag;
  }
}
