import { notFound, redirect } from 'next/navigation';

import { RepLeadDetail } from '@/components/workspace/rep-lead-detail';
import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getRepLeadActivityTimeline, getRepLeadById } from '@/lib/services';

import {
  addRepLeadNoteAction,
  deleteRepLeadAction,
  updateRepLeadStatusAction,
} from './actions';

export const dynamic = 'force-dynamic';

interface WorkspaceLeadDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WorkspaceLeadDetailPage({
  params,
}: WorkspaceLeadDetailPageProps) {
  const user = await requireAuthenticatedUser('/workspace/leads');

  if (user.role !== 'sales_rep') {
    redirect('/workspace');
  }

  const { id } = await params;
  const [lead, activity] = await Promise.all([
    getRepLeadById(user.id, id),
    getRepLeadActivityTimeline(user.id, id),
  ]);

  if (!lead) {
    notFound();
  }

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-7xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs
            crumbs={[
              { label: 'Leads', href: '/workspace/leads' },
              { label: `${lead.firstName} ${lead.lastName}` },
            ]}
          />
          <TVSectionHeader
            eyebrow="Rep Tools"
            title="Lead detail"
            description="Work a single contact with rep-safe notes, status changes, alerts, and meeting context."
          />
        </div>

        <RepLeadDetail
          actions={{
            updateLeadStatusAction: updateRepLeadStatusAction,
            addLeadNoteAction: addRepLeadNoteAction,
            deleteLeadAction: deleteRepLeadAction,
          }}
          activity={activity}
          lead={lead}
        />
      </div>
    </main>
  );
}
