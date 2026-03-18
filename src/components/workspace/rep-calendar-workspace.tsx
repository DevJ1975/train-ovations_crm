import Link from 'next/link';
import { CalendarClock, CalendarCheck, ExternalLink, Sparkles } from 'lucide-react';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVEmptyState,
} from '@/components/trainovations';
import type {
  RepCalendarItem,
  RepCalendarView,
  RepCalendarWorkspace,
} from '@/lib/services/workspace-service';
import { cn } from '@/lib/utils';
import { formatDateLabel, formatTimeLabel, formatDateTimeRange } from '@/lib/format';

function getViewWindow(view: RepCalendarView, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);

  if (view === 'day') {
    end.setDate(end.getDate() + 1);
    end.setMilliseconds(-1);
    return { start, end };
  }

  if (view === 'week') {
    end.setDate(end.getDate() + 7);
    end.setMilliseconds(-1);
    return { start, end };
  }

  if (view === 'month') {
    end.setDate(end.getDate() + 30);
    end.setMilliseconds(-1);
    return { start, end };
  }

  return null;
}

function getFilteredItems(items: RepCalendarItem[], view: RepCalendarView, now = new Date()) {
  if (view === 'list') {
    return items;
  }

  const window = getViewWindow(view, now);

  if (!window) {
    return items;
  }

  return items.filter(
    (item) =>
      item.startAt.getTime() >= window.start.getTime() &&
      item.startAt.getTime() <= window.end.getTime(),
  );
}

function getGroupedItems(items: RepCalendarItem[]) {
  const groups = new Map<string, RepCalendarItem[]>();

  items.forEach((item) => {
    const key = item.startAt.toISOString().slice(0, 10);
    const existingItems = groups.get(key) ?? [];
    existingItems.push(item);
    groups.set(key, existingItems);
  });

  return Array.from(groups.entries()).map(([key, groupedItems]) => ({
    key,
    date: groupedItems[0].startAt,
    items: groupedItems,
  }));
}

function getItemTone(item: RepCalendarItem, isOverdue: boolean) {
  if (isOverdue) {
    return {
      badgeClassName: 'bg-destructive/15 text-destructive',
      panelClassName: 'border-destructive/30 bg-destructive/5',
      label: 'Overdue',
    };
  }

  if (item.kind === 'task_follow_up') {
    return item.isScheduled
      ? {
          badgeClassName: 'bg-success/15 text-success',
          panelClassName: 'border-success/20 bg-success/5',
          label: 'Scheduled block',
        }
      : {
          badgeClassName: 'bg-primary/10 text-primary',
          panelClassName: 'border-primary/20 bg-primary/5',
          label: 'Follow-up',
        };
  }

  return {
    badgeClassName: 'bg-success/15 text-success',
    panelClassName: 'border-success/20 bg-success/5',
    label: 'Scheduled',
  };
}

function RescheduleForm({
  item,
  rescheduleAction,
}: {
  item: RepCalendarItem;
  rescheduleAction: (formData: FormData) => Promise<void>;
}) {
  const defaultValue = new Date(item.startAt.getTime() - item.startAt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <form action={rescheduleAction} className="flex flex-wrap items-end gap-2">
      <input name="taskId" type="hidden" value={item.id} />
      <input name="duration" type="hidden" value="30" />
      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
          Reschedule to
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
        <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />
        Reschedule
      </TVButton>
    </form>
  );
}

export function RepCalendarWorkspace({
  calendar,
  selectedView,
  rescheduleTaskAction,
}: {
  calendar: RepCalendarWorkspace;
  selectedView: RepCalendarView;
  rescheduleTaskAction: (formData: FormData) => Promise<void>;
}) {
  const now = new Date();
  const filteredItems = getFilteredItems(calendar.items, selectedView, now);
  const groupedItems = getGroupedItems(filteredItems);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TVCard className="space-y-2">
          <TVCardTitle>Today</TVCardTitle>
          <TVCardDescription>{calendar.summary.todayCount} scheduled items</TVCardDescription>
        </TVCard>
        <TVCard className="space-y-2">
          <TVCardTitle>Next 7 days</TVCardTitle>
          <TVCardDescription>{calendar.summary.weekCount} items on deck</TVCardDescription>
        </TVCard>
        <TVCard className="space-y-2">
          <TVCardTitle>Calendar events</TVCardTitle>
          <TVCardDescription>{calendar.summary.scheduledCount} synced meetings and holds</TVCardDescription>
        </TVCard>
        <TVCard className="space-y-2">
          <TVCardTitle>Follow-up blocks</TVCardTitle>
          <TVCardDescription>{calendar.summary.followUpCount} due tasks with a date</TVCardDescription>
        </TVCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <TVCard className="space-y-5 rounded-[2rem] border-white/60 bg-white/90">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <TVCardTitle>Calendar workspace</TVCardTitle>
              <TVCardDescription>
                Work scheduled meetings and timed follow-up from one rep-owned calendar surface.
              </TVCardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['day', 'week', 'month', 'list'] as const).map((view) => (
                <TVButton
                  key={view}
                  asChild
                  size="sm"
                  variant={selectedView === view ? 'primary' : 'secondary'}
                >
                  <Link href={view === 'week' ? '/workspace/calendar' : `/workspace/calendar?view=${view}`}>
                    {view === 'list' ? 'Agenda' : view.charAt(0).toUpperCase() + view.slice(1)}
                  </Link>
                </TVButton>
              ))}
            </div>
          </div>

          {groupedItems.length ? (
            <div className="space-y-4">
              {groupedItems.map((group) => (
                <div key={group.key} className="rounded-[1.5rem] border bg-surface-muted/45 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{formatDateLabel(group.date)}</p>
                    <TVBadge variant="default">{group.items.length}</TVBadge>
                  </div>

                  <div className="mt-4 space-y-3">
                    {group.items.map((item) => {
                      const overdue = item.kind === 'task_follow_up' && item.startAt < now;
                      const tone = getItemTone(item, overdue);

                      return (
                        <div
                          key={item.id}
                          className={cn('rounded-2xl border p-4', tone.panelClassName)}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <TVBadge className={tone.badgeClassName} variant="default">
                                  {tone.label}
                                </TVBadge>
                                <p className="text-sm text-muted-foreground">
                                  {formatDateTimeRange(item.startAt, item.endAt)}
                                </p>
                              </div>
                              <p className="mt-2 text-base font-semibold text-foreground">{item.title}</p>
                              {item.description ? (
                                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {item.lead ? (
                                <TVButton asChild size="sm" variant="secondary">
                                  <Link href={`/workspace/leads/${item.lead.id}`}>Open lead</Link>
                                </TVButton>
                              ) : null}
                              {item.sourceUrl && item.kind === 'calendar_event' ? (
                                <TVButton asChild size="sm" variant="ghost">
                                  <Link href={item.sourceUrl}>
                                    Open
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                  </Link>
                                </TVButton>
                              ) : null}
                            </div>
                          </div>

                          {item.lead || item.meeting ? (
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <div className="rounded-xl border bg-white/70 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                  Linked lead
                                </p>
                                <p className="mt-2 text-sm text-foreground">
                                  {item.lead
                                    ? `${item.lead.firstName} ${item.lead.lastName}${item.lead.company ? ` • ${item.lead.company}` : ''}`
                                    : 'No linked lead'}
                                </p>
                              </div>
                              <div className="rounded-xl border bg-white/70 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                  Meeting context
                                </p>
                                <p className="mt-2 text-sm text-foreground">
                                  {item.meeting?.summary ?? item.meeting?.topic ?? 'No meeting brief yet'}
                                </p>
                              </div>
                            </div>
                          ) : null}

                          {item.kind === 'task_follow_up' ? (
                            <div className="mt-4">
                              <RescheduleForm item={item} rescheduleAction={rescheduleTaskAction} />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <TVEmptyState
              title="No scheduled items in this view"
              description="Connect calendars, schedule follow-up from the task center, or keep working until the next block lands here."
              action={
                <div className="flex flex-wrap gap-3">
                  <TVButton asChild size="sm">
                    <Link href="/settings/integrations">Manage Integrations</Link>
                  </TVButton>
                  <TVButton asChild size="sm" variant="secondary">
                    <Link href="/workspace/tasks">Open Tasks</Link>
                  </TVButton>
                </div>
              }
            />
          )}
        </TVCard>

        <div className="space-y-6">
          <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-5 w-5 text-primary" />
              <div>
                <TVCardTitle>Recent meeting briefs</TVCardTitle>
                <TVCardDescription>
                  Keep meeting intelligence close to the calendar so scheduled follow-up stays grounded in context.
                </TVCardDescription>
              </div>
            </div>

            {calendar.recentMeetings.length ? (
              <div className="space-y-3">
                {calendar.recentMeetings.map((meeting) => (
                  <div key={meeting.id} className="rounded-2xl border bg-surface-muted/45 p-4">
                    <p className="text-sm font-medium text-foreground">{meeting.topic}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {meeting.leadName ?? 'Unlinked contact'}
                      {meeting.startAt ? ` • ${formatDateLabel(meeting.startAt)}` : ''}
                    </p>
                    <p className="mt-3 text-sm text-foreground">
                      {meeting.summary ?? meeting.recommendedNextStep ?? 'Meeting processed and ready for follow-up.'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <TVCardDescription>No processed meeting briefs are ready yet.</TVCardDescription>
            )}
          </TVCard>

          <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <TVCardTitle>What Stage 2 adds</TVCardTitle>
                <TVCardDescription>
                  Phase 14 Stage 2 wires task management into the calendar so scheduled follow-up and timed work live in one rep surface.
                </TVCardDescription>
              </div>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Schedule follow-up tasks to a specific date and time from the task center.</li>
              <li>Reschedule or remove scheduled blocks directly from the calendar.</li>
              <li>Snooze tasks to tomorrow, three days, or next week without dismissing them.</li>
              <li>Overdue blocks are highlighted in both the calendar and task center.</li>
            </ul>

            <div className="flex flex-wrap gap-3">
              <TVButton asChild size="sm">
                <Link href="/workspace/tasks">Task Center</Link>
              </TVButton>
              <TVButton asChild size="sm" variant="secondary">
                <Link href="/settings/integrations">Connect calendar tools</Link>
              </TVButton>
            </div>
          </TVCard>
        </div>
      </div>
    </div>
  );
}
