'use server';

import { LeadStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import {
  createLeadNote,
  deleteLead,
  getRepLeadById,
  updateLeadStatus,
} from '@/lib/services';

function getLeadPath(leadId: string) {
  return `/workspace/leads/${leadId}`;
}

async function requireAccessibleRepLead(leadId: string) {
  const user = await requireAuthenticatedUser('/workspace/leads');

  if (user.role !== 'sales_rep') {
    throw new Error('Forbidden');
  }

  const lead = await getRepLeadById(user.id, leadId);

  if (!lead) {
    throw new Error('Forbidden');
  }

  return { user, lead };
}

export async function updateRepLeadStatusAction(formData: FormData) {
  const leadId = String(formData.get('leadId') ?? '');
  const { user, lead } = await requireAccessibleRepLead(leadId);
  const nextStatus = String(formData.get('status') ?? '');

  if (!Object.values(LeadStatus).includes(nextStatus as LeadStatus)) {
    throw new Error('Invalid status');
  }

  await updateLeadStatus({
    leadId,
    status: nextStatus as LeadStatus,
    actorUserId: user.id,
    repProfileId: lead.repProfileId ?? undefined,
  });

  revalidatePath('/workspace');
  revalidatePath('/workspace/leads');
  revalidatePath(getLeadPath(leadId));
}

export async function addRepLeadNoteAction(formData: FormData) {
  const leadId = String(formData.get('leadId') ?? '');
  const content = String(formData.get('content') ?? '');
  const { user, lead } = await requireAccessibleRepLead(leadId);

  await createLeadNote(
    {
      leadId,
      authorId: user.id,
      content,
      sourceType: 'user_authored',
    },
    {
      actorUserId: user.id,
      repProfileId: lead.repProfileId ?? undefined,
    },
  );

  revalidatePath('/workspace');
  revalidatePath('/workspace/leads');
  revalidatePath(getLeadPath(leadId));
}

export async function deleteRepLeadAction(formData: FormData) {
  const leadId = String(formData.get('leadId') ?? '');
  const { user, lead } = await requireAccessibleRepLead(leadId);

  await deleteLead({
    leadId,
    actorUserId: user.id,
    repProfileId: lead.repProfileId ?? undefined,
  });

  revalidatePath('/workspace');
  revalidatePath('/workspace/leads');
  redirect('/workspace/leads');
}
