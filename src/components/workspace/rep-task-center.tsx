'use client';

import Link from 'next/link';
import { AlarmClock, CalendarCheck, CalendarClock, X } from 'lucide-react';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVEmptyState,
} from '@/components/trainovations';
import { ToastForm } from '@/components/ui/toast-form';
import type { RepTaskItem } from '@/lib/services/workspace-service';
import { formatDate, formatDateTime, formatEnumLabel } from '@/lib/format';

function addDaysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

function isOverdue(task: RepTaskItem, now = new Date()) {
  const anchor = task.scheduledAt ?? task.recommendedDueAt;
  return Boolean(anchor && anchor < now && !['converted', 'dismissed', 'archived'].includes(task.status));
}

function ScheduleForm({
  task,
  scheduleTaskAction,
  unscheduleTaskAction,
}: {
  task: RepTaskItem;
  scheduleTaskAction: (formData: FormData) => Promise<void>;
  unscheduleTaskAction: (formData: FormData) => Promise<void>;
}) {
  const defaultValue = task.scheduledAt
    ? new Date(task.scheduledAt.getTime() - task.scheduledAt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : '';

  return (
    <div className="space-y-3">
      {task.scheduledAt ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/8 px-3 py-2">
            <CalendarCheck className="h-4 w-4 text-success" />
            <span className="text-sm text-foreground">
              Scheduled for {formatDateTime(task.scheduledAt)}
            </span>
          </div>
          <ToastForm action={unscheduleTaskAction} successMessage="Schedule removed">
            <input name="taskId" type="hidden" value={task.id} />
            <TVButton className="h-8 gap-1 whitespace-nowrap px-2 text-xs" size="sm" type="submit" variant="ghost">
              <X className="h-3 w-3" />
              Remove
            </TVButton>
          </ToastForm>
        </div>
      ) : null}

      <ToastForm action={scheduleTaskAction} successMessage="Task scheduled" className="flex flex-wrap items-end gap-2">
        <input name="taskId" type="hidden" value={task.id} />
        <input name="duration" type="hidden" value="30" />
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {task.scheduledAt ? 'Reschedule to' : 'Schedule for'}
          </label>
          <input
            className="tv-form-input"
            defaultValue={defaultValue}
            name="scheduledAt"
            required
            type="datetime-local"
          />
        </div>
        <TVButton className="whitespace-nowrap" size="sm" type="submit" variant="secondary">
          <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
          {task.scheduledAt ? 'Reschedule' : 'Schedule'}
        </TVButton>
      </ToastForm>
    </div>
  );
}

function SnoozeActions({
  task,
  snoozeTaskAction,
}: {
  task: RepTaskItem;
  snoozeTaskAction: (formData: FormData) => Promise<void>;
}) {
  const snoozeOptions = [
    { label: 'Tomorrow', value: addDaysFromNow(1) },
    { label: '3 days', value: addDaysFromNow(3) },
    { label: 'Next week', value: addDaysFromNow(7) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AlarmClock className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Snooze:</span>
      {snoozeOptions.map((option) => (
        <ToastForm key={option.label} action={snoozeTaskAction} successMessage="Task snoozed">
          <input name="taskId" type="hidden" value={task.id} />
          <input name="snoozedUntil" type="hidden" value={option.value} />
          <TVButton className="h-7 whitespace-nowrap px-2 text-xs" size="sm" type="submit" variant="ghost">
            {option.label}
          </TVButton>
        </ToastForm>
      ))}
    </div>
  );
}

export function RepTaskCenter({
  tasks,
  updateTaskStatusAction,
  scheduleTaskAction,
  unscheduleTaskAction,
  snoozeTaskAction,
}: {
  tasks: RepTaskItem[];
  updateTaskStatusAction: (formData: FormData) => Promise<void>;
  scheduleTaskAction: (formData: FormData) => Promise<void>;
  unscheduleTaskAction: (formData: FormData) => Promise<void>;
  snoozeTaskAction: (formData: FormData) => Promise<void>;
}) {
  const now = new Date();

  return (
    <div className="space-y-4">
      <TVCard className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <TVCardTitle>Task center</TVCardTitle>
            <TVCardDescription>
              Work generated follow-up tasks without bouncing between inbox, alerts, and notes.
            </TVCardDescription>
          </div>
          <TVBadge variant="primary">{tasks.length}</TVBadge>
        </div>
      </TVCard>

      {tasks.length ? (
        tasks.map((task) => {
          const overdue = isOverdue(task, now);

          return (
            <TVCard
              key={task.id}
              className={`space-y-4 ${overdue ? 'border-destructive/40 bg-destructive/5' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <TVCardTitle className="truncate">{task.title}</TVCardTitle>
                  <TVCardDescription className="mt-2">{task.reason}</TVCardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {overdue ? (
                    <TVBadge className="bg-destructive/15 text-destructive" variant="default">
                      Overdue
                    </TVBadge>
                  ) : null}
                  <TVBadge variant="accent">{formatEnumLabel(task.priority)}</TVBadge>
                  <TVBadge>{formatEnumLabel(task.status)}</TVBadge>
                </div>
              </div>

              {task.explanation ? (
                <p className="line-clamp-3 text-sm text-muted-foreground">{task.explanation}</p>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-surface-muted px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Suggested due</p>
                  <p className="mt-2 text-sm text-foreground">
                    {task.recommendedDueAt ? formatDate(task.recommendedDueAt) : 'No due date'}
                  </p>
                </div>
                <div className="rounded-lg border bg-surface-muted px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Linked lead</p>
                  <p className="mt-2 text-sm text-foreground">
                    {task.lead
                      ? `${task.lead.firstName} ${task.lead.lastName}${task.lead.company ? ` • ${task.lead.company}` : ''}`
                      : 'No linked lead'}
                  </p>
                </div>
              </div>

              <ScheduleForm
                task={task}
                scheduleTaskAction={scheduleTaskAction}
                unscheduleTaskAction={unscheduleTaskAction}
              />

              <SnoozeActions task={task} snoozeTaskAction={snoozeTaskAction} />

              <div className="flex flex-wrap gap-3">
                {task.lead ? (
                  <TVButton asChild className="whitespace-nowrap" size="sm">
                    <Link href={`/workspace/leads/${task.lead.id}`}>Open lead</Link>
                  </TVButton>
                ) : null}
                {task.status === 'generated' ? (
                  <ToastForm action={updateTaskStatusAction} successMessage="Task acknowledged">
                    <input name="taskId" type="hidden" value={task.id} />
                    <input name="status" type="hidden" value="acknowledged" />
                    <TVButton className="whitespace-nowrap" size="sm" type="submit" variant="secondary">
                      Acknowledge
                    </TVButton>
                  </ToastForm>
                ) : null}
                <ToastForm action={updateTaskStatusAction} successMessage="Task marked complete">
                  <input name="taskId" type="hidden" value={task.id} />
                  <input name="status" type="hidden" value="converted" />
                  <TVButton className="whitespace-nowrap" size="sm" type="submit" variant="secondary">
                    Mark complete
                  </TVButton>
                </ToastForm>
                <ToastForm action={updateTaskStatusAction} successMessage="Task dismissed">
                  <input name="taskId" type="hidden" value={task.id} />
                  <input name="status" type="hidden" value="dismissed" />
                  <TVButton className="whitespace-nowrap" size="sm" type="submit" variant="ghost">
                    Dismiss
                  </TVButton>
                </ToastForm>
              </div>
            </TVCard>
          );
        })
      ) : (
        <TVEmptyState title="No active rep tasks are queued right now." />
      )}
    </div>
  );
}
