'use server';

import { revalidatePath } from 'next/cache';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { moveRepOpportunityStage, updateRepOpportunityNextStep } from '@/lib/services';

export async function moveOpportunityStageAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/opportunities');

  if (user.role !== 'sales_rep') {
    throw new Error('Forbidden');
  }

  const opportunityId = String(formData.get('opportunityId') ?? '');
  const stage = String(formData.get('stage') ?? '');

  const validStages = [
    'prospecting',
    'discovery',
    'demo',
    'proposal',
    'negotiation',
    'closed_won',
    'closed_lost',
  ];

  if (!opportunityId || !validStages.includes(stage)) {
    throw new Error('Invalid opportunityId or stage');
  }

  await moveRepOpportunityStage(user.id, opportunityId, stage);

  revalidatePath('/workspace');
  revalidatePath('/workspace/opportunities');
  revalidatePath('/workspace/accounts');
}

export async function updateOpportunityNextStepAction(formData: FormData) {
  const user = await requireAuthenticatedUser('/workspace/opportunities');

  if (user.role !== 'sales_rep') {
    throw new Error('Forbidden');
  }

  const opportunityId = String(formData.get('opportunityId') ?? '');
  const description = String(formData.get('description') ?? '');

  if (!opportunityId) {
    throw new Error('opportunityId is required');
  }

  await updateRepOpportunityNextStep(user.id, opportunityId, description);

  revalidatePath('/workspace');
  revalidatePath('/workspace/opportunities');
}
