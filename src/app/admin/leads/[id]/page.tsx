import { notFound } from 'next/navigation';

import { LeadDetailPanel } from '@/components/admin/lead-detail-panel';
import { TVSectionHeader } from '@/components/trainovations';
import { requireAdminUser } from '@/lib/auth/server';
import { getLeadActivityTimeline, getLeadById } from '@/lib/services';

import {
  confirmProfileMatchCandidateAction,
  generateLeadOutreachDraftAction,
  generateLeadTaskSuggestionsAction,
  linkManualLinkedInProfileAction,
  updateOutreachDraftStatusAction,
  updateChampionFlagAction,
  updateContactWatchlistAction,
  updateRepTaskSuggestionStatusAction,
} from './actions';

export const dynamic = 'force-dynamic';

interface LeadDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const user = await requireAdminUser('/admin/leads');
  const { id } = await params;
  const [lead, activity] = await Promise.all([
    getLeadById(user, id),
    getLeadActivityTimeline(user, id),
  ]);

  if (!lead) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <TVSectionHeader
        eyebrow="Lead Detail"
        title={`${lead.firstName} ${lead.lastName}`}
        description="Review contact context, source details, duplicate flags, and the recorded activity timeline."
      />
      <LeadDetailPanel
        lead={lead}
        activity={activity}
        actions={{
          linkManualLinkedInProfileAction,
          confirmProfileMatchCandidateAction,
          updateChampionFlagAction,
          updateContactWatchlistAction,
          generateLeadOutreachDraftAction,
          updateOutreachDraftStatusAction,
          generateLeadTaskSuggestionsAction,
          updateRepTaskSuggestionStatusAction,
        }}
      />
    </div>
  );
}
