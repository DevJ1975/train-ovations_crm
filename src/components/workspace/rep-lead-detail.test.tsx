import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RepLeadDetail } from './rep-lead-detail';

describe('RepLeadDetail', () => {
  it('renders rep-safe lead context and actions', () => {
    render(
      <RepLeadDetail
        actions={{
          updateLeadStatusAction: vi.fn(async () => {}),
          addLeadNoteAction: vi.fn(async () => {}),
          deleteLeadAction: vi.fn(async () => {}),
        }}
        activity={[
          {
            id: 'log_1',
            type: 'lead_created',
            description: 'Lead created.',
            createdAt: new Date('2026-03-14T12:00:00.000Z'),
            actorUser: {
              name: 'Jay Jones',
              email: 'jay.jones@trainovations.com',
            },
          },
        ]}
        lead={{
          id: 'lead_1',
          repProfileId: 'rep_1',
          firstName: 'Alex',
          lastName: 'Stone',
          company: 'Metro Transit Systems',
          jobTitle: 'Training Director',
          email: 'alex@metrotransit.com',
          phone: '555-101-2201',
          repLocation: 'Phoenix, Arizona',
          location: 'Dallas, Texas',
          industry: 'Transit',
          interest: 'Pilot rollout',
          notes: 'Met at expo.',
          consent: true,
          status: 'new',
          sourceType: 'manual',
          submittedAt: new Date('2026-03-14T12:00:00.000Z'),
          landingPage: {
            slug: 'jay-jones',
            title: 'Jay Jones | Trainovations',
          },
          duplicateOfLead: null,
          notesList: [
            {
              id: 'note_1',
              content: 'Reached out by email.',
              createdAt: new Date('2026-03-14T13:00:00.000Z'),
              author: {
                name: 'Jay Jones',
                email: 'jay.jones@trainovations.com',
              },
            },
          ],
          alerts: [
            {
              id: 'alert_1',
              title: 'Champion changed companies',
              message: 'A key contact moved to a new organization.',
              priority: 'urgent',
              status: 'open',
              suggestedNextStep: 'Reconnect this week.',
              triggeredAt: new Date('2026-03-14T12:00:00.000Z'),
              resolvedAt: null,
              lead: {
                id: 'lead_1',
                firstName: 'Alex',
                lastName: 'Stone',
                company: 'Metro Transit Systems',
                email: 'alex@metrotransit.com',
              },
            },
          ],
          meetings: [
            {
              id: 'meeting_1',
              topic: 'Metro Transit Demo',
              startAt: new Date('2026-03-13T12:00:00.000Z'),
              summary: 'Aligned on pilot next steps.',
              recommendedNextStep: 'Send proposal timing.',
              actionItems: [],
              draft: {
                id: 'draft_1',
                subject: 'Great meeting today',
                bodyText: 'Thanks for the time today.',
                status: 'draft',
              },
            },
          ],
          accounts: [
            {
              id: 'account_1',
              name: 'Metro Transit Systems',
              relationshipLabel: 'Primary contact',
            },
          ],
          opportunities: [
            {
              id: 'opportunity_1',
              name: 'Metro Transit Pilot Rollout',
              stage: 'discovery',
              amountCents: 8500000,
            },
          ],
          repTaskSuggestions: [
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
        }}
      />,
    );

    expect(screen.getByText(/alex stone/i)).toBeInTheDocument();
    expect(screen.getByText(/linked accounts and pipeline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lead stage progress: new/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lead time comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/champion changed companies/i)).toBeInTheDocument();
    expect(screen.getByText(/suggested tasks/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /contacted/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save note/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete lead/i })).toBeInTheDocument();
  });
});
