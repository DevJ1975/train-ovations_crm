'use server';

import { revalidatePath } from 'next/cache';
import { NoteTemplateType } from '@prisma/client';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { createRepNote, deleteRepNote } from '@/lib/services';

const VALID_TEMPLATES = Object.values(NoteTemplateType);

export async function createRepNoteAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/notes');

  if (user.role !== 'sales_rep') {
    throw new Error('Forbidden');
  }

  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const templateTypeRaw = String(formData.get('templateType') ?? 'blank');
  const leadId = String(formData.get('leadId') ?? '').trim() || undefined;
  const accountId = String(formData.get('accountId') ?? '').trim() || undefined;
  const opportunityId = String(formData.get('opportunityId') ?? '').trim() || undefined;

  if (!body) {
    throw new Error('Note body is required');
  }

  const templateType = VALID_TEMPLATES.includes(templateTypeRaw as NoteTemplateType)
    ? (templateTypeRaw as NoteTemplateType)
    : NoteTemplateType.blank;

  await createRepNote(user.id, {
    title: title || undefined,
    body,
    templateType,
    leadId,
    accountId,
    opportunityId,
  });

  revalidatePath('/workspace/notes');
}

export async function deleteRepNoteAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/notes');

  if (user.role !== 'sales_rep') {
    throw new Error('Forbidden');
  }

  const noteId = String(formData.get('noteId') ?? '');

  if (!noteId) {
    throw new Error('noteId is required');
  }

  await deleteRepNote(user.id, noteId);

  revalidatePath('/workspace/notes');
}
