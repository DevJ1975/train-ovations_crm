import { redirect } from 'next/navigation';

import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { RepAnalyticsDashboard } from '@/components/workspace/rep-analytics-dashboard';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import {
  getRepAnalytics,
  getRepActivityTimeline,
  getRepConversionFunnel,
} from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const user = await requireAuthenticatedUser('/workspace/reports');

  if (user.role !== 'sales_rep') redirect('/workspace');

  const [analytics, timeline, funnel] = await Promise.all([
    getRepAnalytics(user.id),
    getRepActivityTimeline(user.id, 40),
    getRepConversionFunnel(user.id),
  ]);

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs crumbs={[{ label: 'Reports & Analytics' }]} />
          <TVSectionHeader
            description="Pipeline performance, lead funnel, activity summary, and trend data for your rep profile."
            eyebrow="Rep Tools"
            title="Reports & Analytics"
          />
        </div>

        <RepAnalyticsDashboard analytics={analytics} timeline={timeline} funnel={funnel} />
      </div>
    </main>
  );
}
