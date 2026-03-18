import { ActivityLogType, Prisma, RelationshipMilestoneType } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  watchlistSettingsSchema,
  type WatchlistSettingsInput,
} from '@/lib/validation/linkedin-identity';

import { createActivityLogEntry } from './activity-log-service';
import type { DatabaseClient } from './types';

export class ContactWatchlistService {
  static async updateWatchlist(
    input: WatchlistSettingsInput,
    options: {
      actorUserId?: string;
      createMilestone?: boolean;
    } = {},
    db: DatabaseClient = getPrismaClient(),
  ) {
    const existing = await db.contactWatchlist.findUnique({
      where: { leadId: input.leadId },
    });
    const validated = watchlistSettingsSchema.parse(input);
    const now = new Date();
    const activationChanged = !existing || existing.isActive !== validated.isActive;

    const watchlist = await db.contactWatchlist.upsert({
      where: { leadId: validated.leadId },
      update: {
        ...validated,
      },
      create: validated,
    });

    await createActivityLogEntry(
      {
        type: ActivityLogType.watchlist_updated,
        description: watchlist.isActive
          ? 'Contact watchlist settings updated.'
          : 'Contact removed from watchlist monitoring.',
        actorUserId: options.actorUserId,
        leadId: watchlist.leadId,
        metadata: {
          contactWatchlistId: watchlist.id,
          previousPriority: existing?.priority ?? null,
          nextPriority: watchlist.priority,
          category: watchlist.category,
          originType: watchlist.originType,
          notifyOnEmploymentChange: watchlist.notifyOnEmploymentChange,
          notifyOnTitleChange: watchlist.notifyOnTitleChange,
          notifyOnBrokenLink: watchlist.notifyOnBrokenLink,
          notifyOnStaleData: watchlist.notifyOnStaleData,
          notifyOnTargetCompanyMatch: watchlist.notifyOnTargetCompanyMatch,
        } as Prisma.InputJsonValue,
      },
      db,
    );

    if (options.createMilestone !== false && watchlist.isActive && activationChanged) {
      await db.relationshipMilestone.create({
        data: {
          leadId: watchlist.leadId,
          milestoneType: RelationshipMilestoneType.watchlist_added,
          title: 'Contact added to strategic watchlist',
          description: watchlist.reason ?? undefined,
          occurredAt: now,
          originType: watchlist.originType,
          confidenceScore: 1,
          metadata: {
            contactWatchlistId: watchlist.id,
            priority: watchlist.priority,
            category: watchlist.category,
          } as Prisma.InputJsonValue,
        },
      });
    }

    return watchlist;
  }
}
