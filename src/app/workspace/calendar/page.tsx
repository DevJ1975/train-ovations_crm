import { redirect } from 'next/navigation';

import { RepCalendarWorkspace } from '@/components/workspace/rep-calendar-workspace';
import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getRepCalendarWorkspace, type RepCalendarView } from '@/lib/services';
import { scheduleRepTaskAction } from '../tasks/actions';

export const dynamic = 'force-dynamic';

function resolveCalendarView(value: string | string[] | undefined): RepCalendarView {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (candidate === 'day' || candidate === 'month' || candidate === 'list') {
    return candidate;
  }

  return 'week';
}

export default async function WorkspaceCalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string | string[] }>;
}) {
  const user = await requireAuthenticatedUser('/workspace/calendar');

  if (user.role !== 'sales_rep') {
    redirect('/workspace');
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedView = resolveCalendarView(resolvedSearchParams.view);
  const calendar = await getRepCalendarWorkspace(user.id);

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-7xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs crumbs={[{ label: 'Calendar' }]} />
          <TVSectionHeader
            eyebrow="Rep Tools"
            title="Calendar workspace"
            description="Plan the day, work time-based follow-up, and keep scheduled execution inside the CRM."
          />
        </div>

        <RepCalendarWorkspace
          calendar={calendar}
          selectedView={selectedView}
          rescheduleTaskAction={scheduleRepTaskAction}
        />
      </div>
    </main>
  );
}
