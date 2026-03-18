import { ActivityLogType, LeadStatus, type Prisma } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  createLeadNoteSchema,
  createPublicLeadSubmissionSchema,
  createLeadSchema,
  updateManualLeadSchema,
  type CreateLeadInput,
  type CreateLeadNoteInput,
  type CreatePublicLeadSubmissionInput,
  type UpdateManualLeadInput,
} from '@/lib/validation/crm';

import { createActivityLogEntry } from './activity-log-service';
import type { DatabaseClient } from './types';

interface CreateLeadNoteOptions {
  activityType?: ActivityLogType;
  activityDescription?: string;
  activityMetadata?: Prisma.InputJsonValue;
  actorUserId?: string;
  repProfileId?: string;
}

function isLeadNoteOptions(value: unknown): value is CreateLeadNoteOptions {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (
    'activityType' in value ||
    'activityDescription' in value ||
    'activityMetadata' in value ||
    'actorUserId' in value ||
    'repProfileId' in value
  );
}

function normalizeLeadMatchValue(value?: string | null) {
  return value?.trim().toLowerCase() || undefined;
}

export async function findPotentialDuplicateLead(
  input: Pick<CreateLeadInput, 'email' | 'phone' | 'repProfileId' | 'company'> & {
    excludeLeadId?: string;
  },
  db: DatabaseClient = getPrismaClient(),
) {
  const email = normalizeLeadMatchValue(input.email);
  const phone = input.phone?.trim();
  const company = input.company?.trim();

  if (!email && !phone) {
    return null;
  }

  return db.lead.findFirst({
    where: {
      repProfileId: input.repProfileId,
      ...(input.excludeLeadId
        ? {
            id: {
              not: input.excludeLeadId,
            },
          }
        : {}),
      OR: [
        ...(email
          ? [{ email }, ...(company ? [{ email, company }] : [])]
          : []),
        ...(phone ? [{ phone }] : []),
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function createLead(
  input: CreateLeadInput,
  db: DatabaseClient = getPrismaClient(),
) {
  const validated = createLeadSchema.parse(input);
  const normalizedEmail = validated.email.trim().toLowerCase();
  const duplicate = await findPotentialDuplicateLead(
    {
      email: normalizedEmail,
      phone: validated.phone,
      repProfileId: validated.repProfileId,
      company: validated.company,
    },
    db,
  );

  const data: Prisma.LeadUncheckedCreateInput = {
    ...validated,
    email: normalizedEmail,
    status: validated.status ?? LeadStatus.new,
    duplicateOfLeadId: duplicate?.id,
  };

  const lead = await db.lead.create({
    data,
  });

  await createActivityLogEntry(
    {
      type: ActivityLogType.lead_created,
      description: `Lead created for ${lead.firstName} ${lead.lastName}.`,
      repProfileId: lead.repProfileId ?? undefined,
      leadId: lead.id,
      metadata: {
        duplicateOfLeadId: duplicate?.id ?? null,
        sourceType: lead.sourceType,
      },
    },
    db,
  );

  if (duplicate) {
    await createActivityLogEntry(
      {
        type: ActivityLogType.lead_duplicate_detected,
        description: `Potential duplicate lead detected for ${lead.firstName} ${lead.lastName}.`,
        repProfileId: lead.repProfileId ?? undefined,
        leadId: lead.id,
        metadata: {
          duplicateOfLeadId: duplicate.id,
          matchedBy: {
            email: normalizedEmail,
            company: validated.company ?? null,
            phone: validated.phone ?? null,
          },
        },
      },
      db,
    );
  }

  return lead;
}

export async function createLeadFromPublicLandingPage(
  input: CreatePublicLeadSubmissionInput,
  db: DatabaseClient = getPrismaClient(),
) {
  const validated = createPublicLeadSubmissionSchema.parse(input);

  if (validated.companyEmailWebsite?.trim()) {
    return {
      outcome: 'spam' as const,
    };
  }

  const landingPage = await db.landingPage.findUnique({
    where: { id: validated.landingPageId },
    include: {
      repProfile: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  if (!landingPage?.repProfile || landingPage.repProfile.slug !== validated.repSlug) {
    return {
      outcome: 'not_found' as const,
    };
  }

  const lead = await createLead(
    {
      repProfileId: landingPage.repProfile.id,
      landingPageId: landingPage.id,
      firstName: validated.firstName,
      lastName: validated.lastName,
      company: validated.company,
      jobTitle: validated.jobTitle,
      email: validated.email,
      phone: validated.phone,
      industry: validated.industry,
      interest: validated.interest,
      notes: validated.notes,
      consent: validated.consent,
      status: LeadStatus.new,
      sourceType: 'landing_page',
      queryParams: validated.queryParams,
      submittedAt: validated.submittedAt
        ? new Date(validated.submittedAt)
        : undefined,
    },
    db,
  );

  return {
    outcome: 'created' as const,
    lead,
  };
}

export async function createLeadNote(
  input: CreateLeadNoteInput,
  optionsOrDb: CreateLeadNoteOptions | DatabaseClient = {},
  dbArg?: DatabaseClient,
) {
  const options = isLeadNoteOptions(optionsOrDb) ? optionsOrDb : {};
  const db =
    dbArg ?? (isLeadNoteOptions(optionsOrDb) ? getPrismaClient() : optionsOrDb);
  const validated = createLeadNoteSchema.parse(input);

  const note = await db.leadNote.create({
    data: {
      ...validated,
      metadata: validated.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  await createActivityLogEntry(
    {
      type: options.activityType ?? ActivityLogType.lead_note_added,
      description: options.activityDescription ?? 'Lead note added.',
      leadId: note.leadId,
      actorUserId: options.actorUserId ?? note.authorId ?? undefined,
      repProfileId: options.repProfileId,
      metadata: options.activityMetadata,
    },
    db,
  );

  return note;
}

export async function updateLeadStatus(
  input: {
    leadId: string;
    status: LeadStatus;
    actorUserId?: string;
    repProfileId?: string;
  },
  db: DatabaseClient = getPrismaClient(),
) {
  const lead = await db.lead.update({
    where: {
      id: input.leadId,
    },
    data: {
      status: input.status,
    },
  });

  await createActivityLogEntry(
    {
      type: ActivityLogType.lead_status_changed,
      description: `Lead status updated to ${input.status.replace('_', ' ')}.`,
      leadId: lead.id,
      actorUserId: input.actorUserId,
      repProfileId: input.repProfileId ?? lead.repProfileId ?? undefined,
      metadata: {
        status: input.status,
      },
    },
    db,
  );

  return lead;
}

export async function updateLead(
  input: {
    leadId: string;
    actorUserId?: string;
    repProfileId?: string;
    data: UpdateManualLeadInput;
  },
  db: DatabaseClient = getPrismaClient(),
) {
  const validated = updateManualLeadSchema.parse(input.data);
  const existingLead = await db.lead.findUnique({
    where: {
      id: input.leadId,
    },
    select: {
      id: true,
      repProfileId: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!existingLead) {
    throw new Error('Lead not found');
  }

  const normalizedEmail = validated.email.trim().toLowerCase();
  const duplicate = await findPotentialDuplicateLead(
    {
      email: normalizedEmail,
      phone: validated.phone,
      repProfileId: existingLead.repProfileId ?? undefined,
      company: validated.company,
      excludeLeadId: existingLead.id,
    },
    db,
  );

  const lead = await db.lead.update({
    where: {
      id: input.leadId,
    },
    data: {
      ...validated,
      email: normalizedEmail,
      duplicateOfLeadId: duplicate?.id ?? null,
    },
  });

  if (duplicate) {
    await createActivityLogEntry(
      {
        type: ActivityLogType.lead_duplicate_detected,
        description: `Potential duplicate lead detected for ${lead.firstName} ${lead.lastName}.`,
        repProfileId: input.repProfileId ?? lead.repProfileId ?? undefined,
        leadId: lead.id,
        metadata: {
          duplicateOfLeadId: duplicate.id,
          matchedBy: {
            email: normalizedEmail,
            company: validated.company ?? null,
            phone: validated.phone ?? null,
          },
        },
      },
      db,
    );
  }

  return lead;
}

export async function deleteLead(
  input: {
    leadId: string;
    actorUserId?: string;
    repProfileId?: string;
  },
  db: DatabaseClient = getPrismaClient(),
) {
  const existingLead = await db.lead.findUnique({
    where: {
      id: input.leadId,
    },
    select: {
      id: true,
      repProfileId: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!existingLead) {
    throw new Error('Lead not found');
  }

  await db.lead.delete({
    where: {
      id: input.leadId,
    },
  });
}
