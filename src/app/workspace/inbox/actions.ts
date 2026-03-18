'use server';

import { revalidatePath } from 'next/cache';
import { ConnectedProvider, EmailThreadStatus } from '@prisma/client';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { GmailService } from '@/lib/integrations';
import { getPrismaClient } from '@/lib/prisma';
import {
  createTaskFromEmailThread,
  relinkEmailThread,
  setEmailThreadFlag,
  setEmailThreadStatus,
} from '@/lib/services';

function revalidateInbox() {
  revalidatePath('/workspace/inbox');
  revalidatePath('/workspace');
}

export async function archiveThreadAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/inbox');
  if (user.role !== 'sales_rep') throw new Error('Forbidden');

  const threadId = String(formData.get('threadId') ?? '');
  if (!threadId) return;

  await setEmailThreadStatus(user.id, threadId, EmailThreadStatus.archived);
  revalidateInbox();
}

export async function snoozeThreadAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/inbox');
  if (user.role !== 'sales_rep') throw new Error('Forbidden');

  const threadId = String(formData.get('threadId') ?? '');
  const snoozedUntilRaw = String(formData.get('snoozedUntil') ?? '');
  if (!threadId || !snoozedUntilRaw) return;

  const snoozedUntil = new Date(snoozedUntilRaw);
  if (isNaN(snoozedUntil.getTime())) return;

  await setEmailThreadStatus(user.id, threadId, EmailThreadStatus.snoozed, snoozedUntil);
  revalidateInbox();
}

export async function reopenThreadAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/inbox');
  if (user.role !== 'sales_rep') throw new Error('Forbidden');

  const threadId = String(formData.get('threadId') ?? '');
  if (!threadId) return;

  await setEmailThreadStatus(user.id, threadId, EmailThreadStatus.open, null);
  revalidateInbox();
}

export async function flagAwaitingReplyAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/inbox');
  if (user.role !== 'sales_rep') throw new Error('Forbidden');

  const threadId = String(formData.get('threadId') ?? '');
  const value = formData.get('value') === 'true';
  if (!threadId) return;

  await setEmailThreadFlag(user.id, threadId, 'awaitingReply', value);
  revalidateInbox();
}

export async function flagFollowUpNeededAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/inbox');
  if (user.role !== 'sales_rep') throw new Error('Forbidden');

  const threadId = String(formData.get('threadId') ?? '');
  const value = formData.get('value') === 'true';
  if (!threadId) return;

  await setEmailThreadFlag(user.id, threadId, 'followUpNeeded', value);
  revalidateInbox();
}

export async function relinkThreadAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/inbox');
  if (user.role !== 'sales_rep') throw new Error('Forbidden');

  const threadId = String(formData.get('threadId') ?? '');
  if (!threadId) return;

  const leadId = (formData.get('leadId') as string | null) || null;
  const accountId = (formData.get('accountId') as string | null) || null;
  const opportunityId = (formData.get('opportunityId') as string | null) || null;

  await relinkEmailThread(user.id, threadId, { leadId, accountId, opportunityId });
  revalidateInbox();
}

export async function sendReplyAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/inbox');
  if (user.role !== 'sales_rep') throw new Error('Forbidden');

  const threadId = String(formData.get('threadId') ?? '');
  const providerThreadId = String(formData.get('providerThreadId') ?? '');
  const to = String(formData.get('to') ?? '').trim();
  const subject = String(formData.get('subject') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();

  if (!threadId || !to || !body) return;

  const prisma = getPrismaClient();
  const account = await prisma.connectedAccount.findFirst({
    where: { userId: user.id, provider: ConnectedProvider.google_gmail },
  });

  if (!account) throw new Error('No Gmail account connected.');

  await GmailService.sendReply(account, {
    providerThreadId,
    to,
    subject: subject || '(no subject)',
    bodyText: body,
  });

  // Mark as no longer awaiting reply after sending
  await setEmailThreadFlag(user.id, threadId, 'awaitingReply', false);
  revalidateInbox();
}

export async function createTaskFromThreadAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/inbox');
  if (user.role !== 'sales_rep') throw new Error('Forbidden');

  const threadId = String(formData.get('threadId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  if (!threadId || !title) return;

  const priority = (formData.get('priority') as 'low' | 'medium' | 'high' | 'urgent') || 'medium';
  const dueAtRaw = formData.get('dueAt') as string | null;
  const dueAt = dueAtRaw ? new Date(dueAtRaw) : undefined;

  await createTaskFromEmailThread(user.id, threadId, { title, priority, dueAt });

  revalidateInbox();
  revalidatePath('/workspace/tasks');
}
