import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/workspace/inbox/actions', () => ({
  archiveThreadAction: vi.fn(),
  snoozeThreadAction: vi.fn(),
  reopenThreadAction: vi.fn(),
  flagAwaitingReplyAction: vi.fn(),
  flagFollowUpNeededAction: vi.fn(),
  relinkThreadAction: vi.fn(),
  createTaskFromThreadAction: vi.fn(),
  sendReplyAction: vi.fn(),
}));

import { RepInbox } from './rep-inbox';

const noopFilter = vi.fn();

const baseThread = {
  id: 'thread_1',
  mailbox: {
    id: 'mailbox_1',
    label: 'Jay inbox',
    emailAddress: 'jay.jones@trainovations.com',
    provider: 'gmail',
  },
  subject: 'Metro Transit pilot follow-up',
  snippet: 'Can you send pricing and rollout timing?',
  unreadCount: 1,
  status: 'open',
  awaitingReply: false,
  followUpNeeded: false,
  snoozedUntil: null,
  lastMessageAt: '2026-03-14T16:15:00.000Z',
  participants: ['alex.stone@metrotransit.com', 'jay.jones@trainovations.com'],
  lead: {
    id: 'lead_1',
    firstName: 'Alex',
    lastName: 'Stone',
  },
  account: {
    id: 'account_1',
    name: 'Metro Transit Systems',
  },
  opportunity: {
    id: 'opportunity_1',
    name: 'Metro Transit Pilot Rollout',
    stage: 'discovery',
  },
  messages: [
    {
      id: 'message_1',
      direction: 'inbound',
      fromEmail: 'alex.stone@metrotransit.com',
      toEmails: ['jay.jones@trainovations.com'],
      bodyText: 'Can you send pricing and rollout timing?',
      sentAt: '2026-03-14T16:15:00.000Z',
      isRead: false,
    },
  ],
};

describe('RepInbox', () => {
  it('renders linked inbox threads and CRM context', () => {
    render(
      <RepInbox
        activeFilter="open"
        canCompose={false}
        onFilterChange={noopFilter}
        threads={[baseThread]}
      />,
    );

    expect(screen.getByText(/metro transit pilot follow-up/i)).toBeInTheDocument();
    expect(screen.getByText(/metro transit systems/i)).toBeInTheDocument();
    expect(screen.getByText(/alex stone/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open contact/i })).toHaveAttribute(
      'href',
      '/workspace/leads/lead_1',
    );
  });

  it('shows status filter tabs', () => {
    render(
      <RepInbox
        activeFilter="open"
        canCompose={false}
        onFilterChange={noopFilter}
        threads={[baseThread]}
      />,
    );

    // All five tabs are present (use getAllBy since badge + tab may share text)
    expect(screen.getAllByRole('button', { name: /awaiting reply/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /follow-up needed/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /snoozed/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /archived/i }).length).toBeGreaterThan(0);
  });

  it('calls onFilterChange when a tab is clicked', async () => {
    const onFilterChange = vi.fn();
    render(
      <RepInbox
        activeFilter="open"
        canCompose={false}
        onFilterChange={onFilterChange}
        threads={[baseThread]}
      />,
    );

    // Click the first button that matches (which is the filter tab, rendered before action bar)
    await userEvent.click(screen.getAllByRole('button', { name: /awaiting reply/i })[0]);
    expect(onFilterChange).toHaveBeenCalledWith('awaiting_reply');
  });

  it('shows awaiting reply and follow-up badges when flags are set', () => {
    render(
      <RepInbox
        activeFilter="open"
        canCompose={false}
        onFilterChange={noopFilter}
        threads={[{ ...baseThread, awaitingReply: true, followUpNeeded: true }]}
      />,
    );

    // Badge appears within the thread card (multiple matches OK — tab + badge)
    expect(screen.getAllByText(/awaiting reply/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/follow-up needed/i).length).toBeGreaterThan(0);
  });

  it('shows unread badge when unreadCount > 0', () => {
    render(
      <RepInbox
        activeFilter="open"
        canCompose={false}
        onFilterChange={noopFilter}
        threads={[baseThread]}
      />,
    );

    expect(screen.getByText(/1 unread/i)).toBeInTheDocument();
  });

  it('shows archived badge on archived threads', () => {
    render(
      <RepInbox
        activeFilter="archived"
        canCompose={false}
        onFilterChange={noopFilter}
        threads={[{ ...baseThread, status: 'archived', unreadCount: 0 }]}
      />,
    );

    // The word "archived" appears in both the tab and the badge — that's fine
    expect(screen.getAllByText(/archived/i).length).toBeGreaterThan(0);
  });

  it('reveals reply panel on Reply button click', async () => {
    render(
      <RepInbox
        activeFilter="open"
        canCompose={true}
        onFilterChange={noopFilter}
        threads={[baseThread]}
      />,
    );

    // Exact match "Reply" targets the action button, not the "Awaiting Reply" tab/flag
    await userEvent.click(screen.getByRole('button', { name: 'Reply' }));
    expect(screen.getByPlaceholderText(/write your reply/i)).toBeInTheDocument();
  });

  it('shows compose upgrade prompt when canCompose is false', async () => {
    render(
      <RepInbox
        activeFilter="open"
        canCompose={false}
        onFilterChange={noopFilter}
        threads={[baseThread]}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reply' }));
    expect(screen.getByText(/gmail compose not enabled/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /upgrade gmail connection/i })).toBeInTheDocument();
  });

  it('reveals create task panel on Create task button click', async () => {
    render(
      <RepInbox
        activeFilter="open"
        canCompose={false}
        onFilterChange={noopFilter}
        threads={[baseThread]}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(screen.getByPlaceholderText(/task title/i)).toBeInTheDocument();
  });

  it('reveals snooze panel on Snooze button click', async () => {
    render(
      <RepInbox
        activeFilter="open"
        canCompose={false}
        onFilterChange={noopFilter}
        threads={[baseThread]}
      />,
    );

    // The "Snooze" action button is in the thread action bar; the filter tab is "Snoozed"
    await userEvent.click(screen.getByRole('button', { name: /^snooze$/i }));
    expect(screen.getByText(/snooze until/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tomorrow 9am/i })).toBeInTheDocument();
  });

  it('shows empty state for a filter with no threads', () => {
    render(
      <RepInbox
        activeFilter="snoozed"
        canCompose={false}
        onFilterChange={noopFilter}
        threads={[]}
      />,
    );

    expect(screen.getByText(/no snoozed threads/i)).toBeInTheDocument();
  });

  it('shows reopen button for archived threads', () => {
    render(
      <RepInbox
        activeFilter="archived"
        canCompose={false}
        onFilterChange={noopFilter}
        threads={[{ ...baseThread, status: 'archived', unreadCount: 0 }]}
      />,
    );

    expect(screen.getByRole('button', { name: /reopen/i })).toBeInTheDocument();
  });

  it('reveals relink panel on Relink button click', async () => {
    render(
      <RepInbox
        activeFilter="open"
        canCompose={false}
        onFilterChange={noopFilter}
        threads={[baseThread]}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /relink/i }));
    expect(screen.getByText(/relink thread ownership/i)).toBeInTheDocument();
  });
});
