import { notFound, redirect } from 'next/navigation';

import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { RepOpportunityDetail } from '@/components/workspace/rep-opportunity-detail';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getRepOpportunityDetail } from '@/lib/services';

export const dynamic = 'force-dynamic';

interface OpportunityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({ params }: OpportunityDetailPageProps) {
  const user = await requireAuthenticatedUser('/workspace/opportunities');

  if (user.role !== 'sales_rep') redirect('/workspace');

  const { id } = await params;
  const opp = await getRepOpportunityDetail(user.id, id);

  if (!opp) notFound();

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs
            crumbs={[
              { label: 'Pipeline', href: '/workspace/opportunities' },
              { label: opp.name },
            ]}
          />
          <TVSectionHeader
            description="Deal details, linked notes, proposals, and account context."
            eyebrow="Rep Tools"
            title={opp.name}
          />
        </div>

        <RepOpportunityDetail opp={opp} />
      </div>
    </main>
  );
}
