import { type EmploymentSnapshot } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  championFlagSchema,
  watchlistSettingsSchema,
  type ChampionFlagInput,
  type WatchlistSettingsInput,
} from '@/lib/validation/linkedin-identity';

import { ChampionTrackingService } from './champion-tracking-service';
import { ContactWatchlistService } from './contact-watchlist-service';
import { RelationshipHistoryService } from './relationship-history-service';
import type { DatabaseClient } from './types';

export class RelationshipGraphService {
  static async syncRelationshipHistoryFromSnapshot(
    snapshot: Pick<
      EmploymentSnapshot,
      'leadId' | 'companyName' | 'title' | 'startDate' | 'endDate' | 'confidenceScore' | 'sourceType'
    > & {
      repProfileId?: string | null;
      linkedInProfileLinkId?: string | null;
      externalProfileSourceId?: string | null;
    },
    db: DatabaseClient = getPrismaClient(),
  ) {
    const { linkedInProfileLinkId, ...snapshotRest } = snapshot;
    return RelationshipHistoryService.syncFromEmploymentSnapshot(
      {
        ...snapshotRest,
        linkedInProfileLinkId: linkedInProfileLinkId ?? null,
        retrievedAt: new Date(),
      },
      db,
    );
  }

  static async updateChampionFlag(
    input: ChampionFlagInput,
    db: DatabaseClient = getPrismaClient(),
  ) {
    championFlagSchema.parse(input);

    return ChampionTrackingService.updateChampionFlag(input, {}, db);
  }

  static async updateContactWatchlist(
    input: WatchlistSettingsInput,
    db: DatabaseClient = getPrismaClient(),
  ) {
    watchlistSettingsSchema.parse(input);

    return ContactWatchlistService.updateWatchlist(input, {}, db);
  }

  static async getLeadRelationshipGraph(
    leadId: string,
    db: DatabaseClient = getPrismaClient(),
  ) {
    const [lead, timeline, edges] = await Promise.all([
      db.lead.findUnique({
        where: { id: leadId },
        include: {
          repProfile: {
            select: {
              id: true,
              displayName: true,
              slug: true,
            },
          },
          championFlag: true,
          contactWatchlist: true,
        },
      }),
      RelationshipHistoryService.getLeadRelationshipTimeline(leadId, db),
      db.relationshipEdge.findMany({
        where: { leadId },
        orderBy: [{ strengthScore: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      lead,
      ...timeline,
      edges,
    };
  }

  static async getRepRelationshipContext(
    repProfileId: string,
    db: DatabaseClient = getPrismaClient(),
  ) {
    const [edges, championFlags, recentRelationshipHistory] = await Promise.all([
      db.relationshipEdge.findMany({
        where: {
          repProfileId,
        },
        orderBy: [{ strengthScore: 'desc' }, { createdAt: 'desc' }],
      }),
      db.championFlag.findMany({
        where: {
          ownerRepProfileId: repProfileId,
          isActive: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      db.relationshipHistory.findMany({
        where: {
          repProfileId,
        },
        orderBy: [{ stage: 'asc' }, { updatedAt: 'desc' }],
      }),
    ]);

    const companies = Array.from(
      new Set(
        recentRelationshipHistory
          .map((entry) => entry.companyName)
          .concat(edges.map((entry) => entry.label)),
      ),
    );

    return {
      knownContacts: edges,
      championFlags,
      recentRelationshipHistory,
      relatedCompanies: companies,
    };
  }
}
