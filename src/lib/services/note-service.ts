import { NoteTemplateType } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';

import type { DatabaseClient } from './types';

interface NoteDatabaseClient extends DatabaseClient {
  user: ReturnType<typeof getPrismaClient>['user'];
  repNote: ReturnType<typeof getPrismaClient>['repNote'];
}

export interface RepNoteContext {
  leadId?: string | null;
  accountId?: string | null;
  opportunityId?: string | null;
}

export interface RepNoteItem {
  id: string;
  title: string | null;
  body: string;
  templateType: NoteTemplateType;
  createdAt: Date;
  updatedAt: Date;
  lead: { id: string; firstName: string; lastName: string } | null;
  account: { id: string; name: string } | null;
  opportunity: { id: string; name: string } | null;
}

async function getRepProfileIdForUser(
  userId: string,
  db: NoteDatabaseClient,
): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { repProfile: { select: { id: true } } },
  });
  return user?.repProfile?.id ?? null;
}

export async function getRepNotes(
  userId: string,
  context?: RepNoteContext,
  db: NoteDatabaseClient = getPrismaClient() as NoteDatabaseClient,
): Promise<RepNoteItem[]> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) return [];

  return db.repNote.findMany({
    where: {
      repProfileId,
      ...(context?.leadId ? { leadId: context.leadId } : {}),
      ...(context?.accountId ? { accountId: context.accountId } : {}),
      ...(context?.opportunityId ? { opportunityId: context.opportunityId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      account: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true } },
    },
  });
}

export async function createRepNote(
  userId: string,
  input: {
    title?: string;
    body: string;
    templateType?: NoteTemplateType;
    leadId?: string;
    accountId?: string;
    opportunityId?: string;
  },
  db: NoteDatabaseClient = getPrismaClient() as NoteDatabaseClient,
): Promise<RepNoteItem> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) throw new Error('Rep profile not found');

  return db.repNote.create({
    data: {
      repProfileId,
      title: input.title || null,
      body: input.body,
      templateType: input.templateType ?? NoteTemplateType.blank,
      leadId: input.leadId || null,
      accountId: input.accountId || null,
      opportunityId: input.opportunityId || null,
    },
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      account: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true } },
    },
  });
}

export async function updateRepNote(
  userId: string,
  noteId: string,
  input: { title?: string; body: string },
  db: NoteDatabaseClient = getPrismaClient() as NoteDatabaseClient,
): Promise<RepNoteItem> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) throw new Error('Rep profile not found');

  const existing = await db.repNote.findFirst({
    where: { id: noteId, repProfileId },
  });
  if (!existing) throw new Error('Note not found or access denied');

  return db.repNote.update({
    where: { id: noteId },
    data: {
      title: input.title || null,
      body: input.body,
    },
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      account: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true } },
    },
  });
}

export async function deleteRepNote(
  userId: string,
  noteId: string,
  db: NoteDatabaseClient = getPrismaClient() as NoteDatabaseClient,
): Promise<void> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) throw new Error('Rep profile not found');

  const existing = await db.repNote.findFirst({
    where: { id: noteId, repProfileId },
  });
  if (!existing) throw new Error('Note not found or access denied');

  await db.repNote.delete({ where: { id: noteId } });
}
