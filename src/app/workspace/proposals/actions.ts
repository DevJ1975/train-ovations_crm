'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ProposalStatus } from '@prisma/client';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import {
  createRepProposal,
  deleteRepProposal,
  markProposalSent,
  updateProposalStatus,
  updateRepProposal,
} from '@/lib/services';

export async function createProposalAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/proposals');

  if (user.role !== 'sales_rep') throw new Error('Forbidden');

  const title = String(formData.get('title') ?? '').trim();
  const leadId = String(formData.get('leadId') ?? '').trim() || undefined;
  const accountId = String(formData.get('accountId') ?? '').trim() || undefined;
  const opportunityId = String(formData.get('opportunityId') ?? '').trim() || undefined;

  if (!title) throw new Error('Title is required');

  const proposal = await createRepProposal(user.id, { title, leadId, accountId, opportunityId });

  redirect(`/workspace/proposals/${proposal.id}`);
}

export async function saveProposalFieldAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/proposals');

  if (user.role !== 'sales_rep') throw new Error('Forbidden');

  const proposalId = String(formData.get('proposalId') ?? '');
  const field = String(formData.get('field') ?? '');
  const value = String(formData.get('value') ?? '');

  const allowedFields = [
    'title',
    'executiveSummary',
    'aboutUs',
    'scopeOfWork',
    'deliverables',
    'timeline',
    'pricing',
    'terms',
    'nextSteps',
  ];

  if (!proposalId || !allowedFields.includes(field)) {
    throw new Error('Invalid proposalId or field');
  }

  await updateRepProposal(user.id, proposalId, { [field]: value });

  revalidatePath(`/workspace/proposals/${proposalId}`);
}

export async function markProposalSentAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/proposals');

  if (user.role !== 'sales_rep') throw new Error('Forbidden');

  const proposalId = String(formData.get('proposalId') ?? '');
  if (!proposalId) throw new Error('proposalId is required');

  await markProposalSent(user.id, proposalId);

  revalidatePath(`/workspace/proposals/${proposalId}`);
  revalidatePath('/workspace/proposals');
}

export async function updateProposalStatusAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/proposals');

  if (user.role !== 'sales_rep') throw new Error('Forbidden');

  const proposalId = String(formData.get('proposalId') ?? '');
  const status = String(formData.get('status') ?? '');

  const validStatuses = Object.values(ProposalStatus);
  if (!proposalId || !validStatuses.includes(status as ProposalStatus)) {
    throw new Error('Invalid proposalId or status');
  }

  await updateProposalStatus(user.id, proposalId, status as ProposalStatus);

  revalidatePath(`/workspace/proposals/${proposalId}`);
  revalidatePath('/workspace/proposals');
}

export async function deleteProposalAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/proposals');

  if (user.role !== 'sales_rep') throw new Error('Forbidden');

  const proposalId = String(formData.get('proposalId') ?? '');
  if (!proposalId) throw new Error('proposalId is required');

  await deleteRepProposal(user.id, proposalId);

  revalidatePath('/workspace/proposals');
}
