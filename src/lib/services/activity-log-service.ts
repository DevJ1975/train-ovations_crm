import { ActivityLogType, type Prisma } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';

import type { DatabaseClient } from './types';

export interface CreateActivityLogEntryInput {
  type: ActivityLogType;
  description: string;
  actorUserId?: string;
  repProfileId?: string;
  leadId?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createActivityLogEntry(
  input: CreateActivityLogEntryInput,
  db: DatabaseClient = getPrismaClient(),
) {
  return db.activityLog.create({
    data: input,
  });
}
