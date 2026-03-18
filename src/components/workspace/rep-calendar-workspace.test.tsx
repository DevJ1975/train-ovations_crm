import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RepCalendarWorkspace } from './rep-calendar-workspace';

const noopRescheduleAction = vi.fn();

describe('RepCalendarWorkspace', () => {
  it('renders scheduled items, follow-up blocks, and view navigation', () => {
    render(
      <RepCalendarWorkspace
        calendar={{
          summary: {
            todayCount: 1,
            weekCount: 3,
            scheduledCount: 2,
            followUpCount: 1,
          },
          items: [
            {
              id: 'event_1',
              kind: 'calendar_event',
              title: 'Phoenix Rail kickoff',
              description: 'Review rollout scope and next steps.',
              startAt: new Date('2026-03-16T16:00:00.000Z'),
              endAt: new Date('2026-03-16T16:30:00.000Z'),
              status: 'synced',
              isScheduled: true,
              sourceUrl: 'https://calendar.google.com/event?eid=1',
              lead: {
                id: 'lead_1',
                firstName: 'Alex',
                lastName: 'Stone',
                company: 'Metro Transit Systems',
              },
              meeting: {
                id: 'meeting_1',
                topic: 'Phoenix Rail kickoff',
                summary: 'Pilot scope review is ready.',
              },
            },
            {
              id: 'task_1',
              kind: 'task_follow_up',
              title: 'Send pricing recap',
              description: 'Use the approved pricing template.',
              startAt: new Date('2026-03-17T18:00:00.000Z'),
              endAt: new Date('2026-03-17T18:30:00.000Z'),
              status: 'generated',
              isScheduled: false,
              sourceUrl: '/workspace/leads/lead_1',
              lead: {
                id: 'lead_1',
                firstName: 'Alex',
                lastName: 'Stone',
                company: 'Metro Transit Systems',
              },
              meeting: null,
            },
          ],
          recentMeetings: [
            {
              id: 'meeting_1',
              topic: 'Phoenix Rail kickoff',
              startAt: new Date('2026-03-16T16:00:00.000Z'),
              summary: 'Pilot scope review is ready.',
              recommendedNextStep: 'Send pricing recap.',
              leadName: 'Alex Stone',
            },
          ],
        }}
        selectedView="list"
        rescheduleTaskAction={noopRescheduleAction}
      />,
    );

    expect(screen.getByText(/calendar workspace/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /week/i })).toHaveAttribute(
      'href',
      '/workspace/calendar',
    );
    expect(screen.getByRole('link', { name: /month/i })).toHaveAttribute(
      'href',
      '/workspace/calendar?view=month',
    );
    expect(screen.getAllByText(/phoenix rail kickoff/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/send pricing recap/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /open lead/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/recent meeting briefs/i)).toBeInTheDocument();
  });

  it('renders a reschedule form on task follow-up items', () => {
    render(
      <RepCalendarWorkspace
        calendar={{
          summary: { todayCount: 0, weekCount: 1, scheduledCount: 0, followUpCount: 1 },
          items: [
            {
              id: 'task_2',
              kind: 'task_follow_up',
              title: 'Follow up with Delta Safety',
              description: 'Check on implementation timeline.',
              startAt: new Date('2026-03-18T14:00:00.000Z'),
              endAt: new Date('2026-03-18T14:30:00.000Z'),
              status: 'acknowledged',
              isScheduled: true,
              sourceUrl: '/workspace/leads/lead_2',
              lead: { id: 'lead_2', firstName: 'Dana', lastName: 'Lee', company: 'Delta Safety' },
              meeting: null,
            },
          ],
          recentMeetings: [],
        }}
        selectedView="list"
        rescheduleTaskAction={noopRescheduleAction}
      />,
    );

    expect(screen.getByText(/follow up with delta safety/i)).toBeInTheDocument();
    expect(screen.getByText(/reschedule to/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reschedule/i })).toBeInTheDocument();
  });

  it('shows overdue badge on past task follow-up items', () => {
    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    render(
      <RepCalendarWorkspace
        calendar={{
          summary: { todayCount: 0, weekCount: 0, scheduledCount: 0, followUpCount: 1 },
          items: [
            {
              id: 'task_3',
              kind: 'task_follow_up',
              title: 'Overdue follow-up',
              description: null,
              startAt: pastDate,
              endAt: pastDate,
              status: 'generated',
              isScheduled: false,
              sourceUrl: null,
              lead: null,
              meeting: null,
            },
          ],
          recentMeetings: [],
        }}
        selectedView="list"
        rescheduleTaskAction={noopRescheduleAction}
      />,
    );

    expect(screen.getAllByText(/overdue/i).length).toBeGreaterThan(0);
  });

  it('shows the Stage 2 feature list in the sidebar', () => {
    render(
      <RepCalendarWorkspace
        calendar={{
          summary: { todayCount: 0, weekCount: 0, scheduledCount: 0, followUpCount: 0 },
          items: [],
          recentMeetings: [],
        }}
        selectedView="week"
        rescheduleTaskAction={noopRescheduleAction}
      />,
    );

    expect(screen.getByText(/what stage 2 adds/i)).toBeInTheDocument();
    expect(screen.getByText(/schedule follow-up tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/snooze/i)).toBeInTheDocument();
  });

  it('distinguishes confirmed scheduled blocks from suggested follow-up', () => {
    render(
      <RepCalendarWorkspace
        calendar={{
          summary: { todayCount: 0, weekCount: 2, scheduledCount: 0, followUpCount: 2 },
          items: [
            {
              id: 'task_sched',
              kind: 'task_follow_up',
              title: 'Confirmed block',
              description: null,
              startAt: new Date('2026-03-20T10:00:00.000Z'),
              endAt: new Date('2026-03-20T10:30:00.000Z'),
              status: 'acknowledged',
              isScheduled: true,
              sourceUrl: null,
              lead: null,
              meeting: null,
            },
            {
              id: 'task_sugg',
              kind: 'task_follow_up',
              title: 'Suggested follow-up',
              description: null,
              startAt: new Date('2026-03-21T10:00:00.000Z'),
              endAt: new Date('2026-03-21T10:00:00.000Z'),
              status: 'generated',
              isScheduled: false,
              sourceUrl: null,
              lead: null,
              meeting: null,
            },
          ],
          recentMeetings: [],
        }}
        selectedView="list"
        rescheduleTaskAction={noopRescheduleAction}
      />,
    );

    expect(screen.getAllByText(/scheduled block/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/follow-up/i).length).toBeGreaterThan(0);
  });
});
