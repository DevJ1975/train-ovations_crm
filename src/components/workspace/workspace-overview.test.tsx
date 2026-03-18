import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { WorkspaceOverview } from './workspace-overview';

vi.mock('@/components/auth/logout-button', () => ({
  LogoutButton: () => <button type="button">Sign out</button>,
}));

vi.mock('@/components/workspace/daytimer-notes-widget', () => ({
  DaytimerNotesWidget: () => <div>Mock Daytimer Notes Widget</div>,
}));

describe('WorkspaceOverview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T09:00:00.000-07:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the redesigned rep command center with action-first content', () => {
    render(
      <WorkspaceOverview
        workspace={{
          user: {
            id: 'user_1',
            name: 'Jay Jones',
            email: 'jay.jones@trainovations.com',
            role: 'sales_rep',
          },
          destination: 'rep',
          repProfile: {
            id: 'rep_1',
            displayName: 'Jay Jones',
            title: 'Safety Technology Specialist',
            slug: 'jay-jones',
            bio: 'Rep bio',
            email: 'jay.jones@trainovations.com',
            phone: '555-101-2201',
            website: 'https://trainovations.com/jay-jones',
            location: 'Phoenix, Arizona',
            photoUrl: null,
            signatureCompany: 'Trainovations',
            publicLandingPath: '/rep/jay-jones',
            vCardDownloadPath: '/api/rep/jay-jones/vcard',
            metrics: {
              totalLeads: 12,
              newLeads: 4,
              openAlerts: 2,
              meetingsProcessed: 3,
              openTasks: 2,
            },
            alertFeed: [
              {
                id: 'alert_1',
                title: 'Champion changed companies',
                message: 'A key contact moved to a new organization.',
                priority: 'urgent',
                triggeredAt: new Date('2026-03-13T00:00:00.000Z'),
                lead: {
                  id: 'lead_1',
                  firstName: 'Alex',
                  lastName: 'Stone',
                  company: 'Metro Transit Systems',
                },
              },
            ],
            recentLeads: [
              {
                id: 'lead_1',
                firstName: 'Alex',
                lastName: 'Stone',
                company: 'Metro Transit Systems',
                status: 'new',
                createdAt: new Date('2026-03-13T00:00:00.000Z'),
                email: 'alex.stone@metrotransit.com',
                interest: 'Pilot rollout',
              },
            ],
            recentMeetings: [
              {
                id: 'meeting_1',
                topic: 'Metro Transit Demo',
                startAt: new Date('2026-03-12T15:00:00.000Z'),
                endAt: new Date('2026-03-12T15:30:00.000Z'),
                company: 'Metro Transit Systems',
                leadName: 'Alex Stone',
                summary: 'Aligned on a pilot rollout.',
                recommendedNextStep: 'Send pricing recap and proposal timing.',
                actionItems: [
                  {
                    id: 'action_1',
                    description: 'Send recap email',
                    status: 'open',
                  },
                ],
                draft: {
                  id: 'draft_1',
                  subject: 'Great meeting today',
                  bodyText: 'Thanks for the time today.',
                  status: 'draft',
                },
              },
            ],
            onboarding: {
              isComplete: true,
              nextStep: null,
              step1: true,
              step2: true,
              step3: true,
            },
            leadMapPoints: [],
            travelCalendarCandidates: [
              {
                id: 'cal_1',
                title: 'Chicago travel hold',
                description:
                  'Flight itinerary: AA4455. Hotel: Hilton Chicago. Hotel confirmation: HC7788.',
                startAt: new Date('2026-04-09T17:00:00.000Z'),
                endAt: new Date('2026-04-11T20:00:00.000Z'),
                sourceUrl: 'https://calendar.google.com',
              },
            ],
            repTasks: [
              {
                id: 'task_1',
                type: 'send_follow_up',
                status: 'generated',
                priority: 'high',
                title: 'Respond to new lead',
                reason: 'This lead is still new and needs a first response.',
                explanation: 'Generated because no first-response workflow has been completed yet.',
                recommendedDueAt: new Date('2026-03-15T12:00:00.000Z'),
                scheduledAt: null,
                scheduledEndAt: null,
                snoozedUntil: null,
                lead: {
                  id: 'lead_1',
                  firstName: 'Alex',
                  lastName: 'Stone',
                  company: 'Metro Transit Systems',
                },
              },
            ],
          },
        }}
      />,
    );

    expect(screen.getByText(/rep command center/i)).toBeInTheDocument();
    expect(screen.getByText(/good morning, jay jones/i)).toBeInTheDocument();
    expect(screen.getAllByText(/next best action/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/open tasks/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/metro transit systems/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/triage queue/i)).toBeInTheDocument();
    expect(screen.getByText(/meeting action center/i)).toBeInTheDocument();
    expect(screen.getAllByText(/champion changed companies/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/great meeting today/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to main page/i })).toHaveAttribute(
      'href',
      '/',
    );
    expect(
      screen
        .getAllByRole('link', { name: /open lead inbox/i })
        .every((link) => link.getAttribute('href') === '/workspace/leads'),
    ).toBe(true);
    expect(
      screen
        .getAllByRole('link', { name: /open tasks/i })
        .every((link) => link.getAttribute('href') === '/workspace/tasks'),
    ).toBe(true);
    expect(screen.getByRole('link', { name: /calendar workspace/i })).toHaveAttribute(
      'href',
      '/workspace/calendar',
    );
    expect(screen.getByRole('link', { name: /open calendar/i })).toHaveAttribute(
      'href',
      '/workspace/calendar',
    );
    expect(screen.getByRole('button', { name: /capture business card/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view public page/i })).toHaveAttribute(
      'href',
      '/rep/jay-jones',
    );
    expect(screen.getByText(/reach out to alex stone/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/jay jones landing page qr code/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /download qr svg/i })).toHaveAttribute(
      'href',
      '/api/rep/jay-jones/qr',
    );
  });
});
