import { redirect } from 'next/navigation';

import { RepTaskCenter } from '@/components/workspace/rep-task-center';
import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getRepTaskSuggestions } from '@/lib/services';

import {
  scheduleRepTaskAction,
  snoozeRepTaskAction,
  unscheduleRepTaskAction,
  updateRepTaskStatusAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function WorkspaceTasksPage() {
  const user = await requireAuthenticatedUser('/workspace/tasks');

  if (user.role !== 'sales_rep') {
    redirect('/workspace');
  }

  const tasks = await getRepTaskSuggestions(user.id);

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs crumbs={[{ label: 'Task center' }]} />
          <TVSectionHeader
            eyebrow="Rep Tools"
            title="Task center"
            description="Review generated follow-up work, acknowledge what you are handling, schedule blocks, and clear completed tasks."
          />
        </div>

        <RepTaskCenter
          tasks={tasks}
          updateTaskStatusAction={updateRepTaskStatusAction}
          scheduleTaskAction={scheduleRepTaskAction}
          unscheduleTaskAction={unscheduleRepTaskAction}
          snoozeTaskAction={snoozeRepTaskAction}
        />
      </div>
    </main>
  );
}
