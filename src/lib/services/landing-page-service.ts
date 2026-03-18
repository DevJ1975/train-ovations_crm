import { ActivityLogType } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  createLandingPageSchema,
  type CreateLandingPageInput,
} from '@/lib/validation/crm';

import { createActivityLogEntry } from './activity-log-service';
import type { DatabaseClient } from './types';

export async function createLandingPage(
  input: CreateLandingPageInput,
  db: DatabaseClient = getPrismaClient(),
) {
  const validated = createLandingPageSchema.parse(input);

  const landingPage = await db.landingPage.create({
    data: validated,
  });

  await createActivityLogEntry(
    {
      type: ActivityLogType.landing_page_created,
      description: `Landing page ${landingPage.slug} created.`,
      repProfileId: landingPage.repProfileId,
    },
    db,
  );

  return landingPage;
}

export async function getLandingPageBySlug(
  slug: string,
  db: DatabaseClient = getPrismaClient(),
) {
  return db.landingPage.findUnique({
    where: { slug },
    include: {
      repProfile: {
        include: {
          signatureProfile: true,
          socialLinks: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  });
}
