import { ActivityLogType } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  createRepProfileSchema,
  updateRepProfileSchema,
  type CreateRepProfileInput,
  type UpdateRepProfileInput,
} from '@/lib/validation/crm';

import { createActivityLogEntry } from './activity-log-service';
import type { DatabaseClient } from './types';

export async function createRepProfile(
  input: CreateRepProfileInput,
  db: DatabaseClient = getPrismaClient(),
) {
  const validated = createRepProfileSchema.parse(input);

  const repProfile = await db.repProfile.create({
    data: validated,
  });

  await createActivityLogEntry(
    {
      type: ActivityLogType.rep_profile_created,
      description: `Rep profile created for ${repProfile.displayName}.`,
      repProfileId: repProfile.id,
      actorUserId: repProfile.userId,
    },
    db,
  );

  return repProfile;
}

export async function updateRepProfile(
  repProfileId: string,
  input: UpdateRepProfileInput,
  db: DatabaseClient = getPrismaClient(),
) {
  const validated = updateRepProfileSchema.parse(input);

  const repProfile = await db.repProfile.update({
    where: { id: repProfileId },
    data: validated,
  });

  await createActivityLogEntry(
    {
      type: ActivityLogType.rep_profile_updated,
      description: `Rep profile updated for ${repProfile.displayName}.`,
      repProfileId: repProfile.id,
      actorUserId: repProfile.userId,
    },
    db,
  );

  return repProfile;
}

export async function getRepProfileBySlug(
  slug: string,
  db: DatabaseClient = getPrismaClient(),
) {
  return db.repProfile.findUnique({
    where: { slug },
    include: {
      signatureProfile: true,
      socialLinks: {
        orderBy: { sortOrder: 'asc' },
      },
      landingPages: {
        orderBy: { createdAt: 'asc' },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}
