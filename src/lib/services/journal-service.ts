import { getPrismaClient } from '@/lib/prisma';
import { createRepJournalEntrySchema, type CreateRepJournalEntryInput } from '@/lib/validation/crm';

import type { DatabaseClient } from './types';

interface JournalDatabaseClient extends DatabaseClient {
  user: ReturnType<typeof getPrismaClient>['user'];
  repJournalEntry: ReturnType<typeof getPrismaClient>['repJournalEntry'];
}

export interface RepJournalEntryItem {
  id: string;
  title: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

async function getRepProfileIdForUser(
  userId: string,
  db: JournalDatabaseClient,
): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      repProfile: {
        select: {
          id: true,
        },
      },
    },
  });
  return user?.repProfile?.id ?? null;
}

export async function getRepJournalEntries(
  userId: string,
  db: JournalDatabaseClient = getPrismaClient() as JournalDatabaseClient,
): Promise<RepJournalEntryItem[]> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) return [];

  return db.repJournalEntry.findMany({
    where: { repProfileId },
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createRepJournalEntry(
  userId: string,
  input: CreateRepJournalEntryInput,
  db: JournalDatabaseClient = getPrismaClient() as JournalDatabaseClient,
): Promise<RepJournalEntryItem> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) {
    throw new Error('Rep profile not found for user');
  }

  const parsed = createRepJournalEntrySchema.parse(input);

  return db.repJournalEntry.create({
    data: {
      repProfileId,
      title: parsed.title,
      body: parsed.body,
    },
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteRepJournalEntry(
  userId: string,
  entryId: string,
  db: JournalDatabaseClient = getPrismaClient() as JournalDatabaseClient,
): Promise<void> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) {
    throw new Error('Rep profile not found for user');
  }

  const entry = await db.repJournalEntry.findUnique({
    where: { id: entryId },
    select: { repProfileId: true },
  });

  if (!entry || entry.repProfileId !== repProfileId) {
    throw new Error('Journal entry not found or access denied');
  }

  await db.repJournalEntry.delete({ where: { id: entryId } });
}
