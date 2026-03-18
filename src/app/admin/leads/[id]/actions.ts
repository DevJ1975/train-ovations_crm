'use server';

import { revalidatePath } from 'next/cache';

import { requireAdminUser } from '@/lib/auth/server';
import {
  ChampionTrackingService,
  ContactWatchlistService,
  getLeadById,
  LinkedInIdentityService,
  OutreachDraftService,
  RepTaskSuggestionService,
} from '@/lib/services';
import { OutreachDraftStatus, RepTaskSuggestionStatus } from '@prisma/client';

function getLeadPath(leadId: string) {
  return `/admin/leads/${leadId}`;
}

async function requireAccessibleLead(leadId: string) {
  const user = await requireAdminUser('/admin/leads');
  const lead = await getLeadById(user, leadId);

  if (!lead) {
    throw new Error('Forbidden');
  }

  return user;
}

export async function linkManualLinkedInProfileAction(formData: FormData) {
  const leadId = String(formData.get('leadId') ?? '');
  await requireAccessibleLead(leadId);

  await LinkedInIdentityService.attachManualProfileUrl({
    leadId,
    profileUrl: String(formData.get('profileUrl') ?? ''),
    confidenceScore: 0.95,
    humanConfirmed: true,
  });

  revalidatePath(getLeadPath(leadId));
}

export async function confirmProfileMatchCandidateAction(formData: FormData) {
  const leadId = String(formData.get('leadId') ?? '');
  await requireAccessibleLead(leadId);

  await LinkedInIdentityService.confirmProfileMatch({
    leadId,
    candidateId: String(formData.get('candidateId') ?? ''),
  });

  revalidatePath(getLeadPath(leadId));
}

export async function updateChampionFlagAction(formData: FormData) {
  const leadId = String(formData.get('leadId') ?? '');
  const user = await requireAccessibleLead(leadId);

  await ChampionTrackingService.updateChampionFlag({
    leadId,
    isActive: formData.get('isActive') === 'true',
    priority: 'medium',
    rationale: String(formData.get('rationale') ?? ''),
    confidenceScore: Number(formData.get('confidenceScore') ?? '0.75'),
    originType: 'user_input',
  }, {
    actorUserId: user.id,
  });

  revalidatePath(getLeadPath(leadId));
}

export async function updateContactWatchlistAction(formData: FormData) {
  const leadId = String(formData.get('leadId') ?? '');
  const user = await requireAccessibleLead(leadId);

  await ContactWatchlistService.updateWatchlist({
    leadId,
    isActive: formData.get('isActive') === 'true',
    category: 'strategic_contact',
    priority:
      (formData.get('priority') as 'normal' | 'high' | 'critical' | null) ?? 'normal',
    reason: String(formData.get('reason') ?? ''),
    notifyOnEmploymentChange: formData.get('notifyOnEmploymentChange') === 'true',
    notifyOnBrokenLink: formData.get('notifyOnBrokenLink') === 'true',
    notifyOnTitleChange: true,
    notifyOnStaleData: true,
    notifyOnTargetCompanyMatch: true,
    originType: 'user_input',
  }, {
    actorUserId: user.id,
  });

  revalidatePath(getLeadPath(leadId));
}

export async function generateLeadOutreachDraftAction(formData: FormData) {
  const leadId = String(formData.get('leadId') ?? '');
  const user = await requireAccessibleLead(leadId);

  await OutreachDraftService.generateDraftForLead(leadId, user.id);

  revalidatePath(getLeadPath(leadId));
}

export async function updateOutreachDraftStatusAction(formData: FormData) {
  const leadId = String(formData.get('leadId') ?? '');
  const user = await requireAccessibleLead(leadId);
  const draftId = String(formData.get('draftId') ?? '');
  const status = String(formData.get('status') ?? '') as OutreachDraftStatus;

  await OutreachDraftService.updateDraftStatus(draftId, status, user.id);

  revalidatePath(getLeadPath(leadId));
}

export async function generateLeadTaskSuggestionsAction(formData: FormData) {
  const leadId = String(formData.get('leadId') ?? '');
  await requireAccessibleLead(leadId);

  await RepTaskSuggestionService.generateSuggestionsForLead(leadId);

  revalidatePath(getLeadPath(leadId));
}

export async function updateRepTaskSuggestionStatusAction(formData: FormData) {
  const leadId = String(formData.get('leadId') ?? '');
  await requireAccessibleLead(leadId);
  const suggestionId = String(formData.get('suggestionId') ?? '');
  const status = String(formData.get('status') ?? '') as RepTaskSuggestionStatus;

  await RepTaskSuggestionService.updateSuggestionStatus(suggestionId, status);

  revalidatePath(getLeadPath(leadId));
}
