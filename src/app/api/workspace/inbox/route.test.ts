import { ConnectedProvider } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  requireAuthenticatedUser,
  getRepInboxThreads,
  getPrismaClient,
} = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  getRepInboxThreads: vi.fn(),
  getPrismaClient: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({ requireAuthenticatedUser }));
vi.mock('@/lib/services', () => ({ getRepInboxThreads }));
vi.mock('@/lib/prisma', () => ({ getPrismaClient }));
vi.mock('@/lib/integrations', () => ({
  GmailService: {
    canCompose: (account: { scopes: string[] }) =>
      account.scopes.includes('https://www.googleapis.com/auth/gmail.compose'),
  },
}));

import { GET } from './route';

const baseThread = {
  id: 'thread_1',
  mailbox: { id: 'mb_1', label: 'Jay inbox', emailAddress: 'jay@trainovations.com', provider: 'gmail' },
  subject: 'Pilot follow-up',
  snippet: 'Can you send pricing?',
  unreadCount: 1,
  status: 'open',
  awaitingReply: false,
  followUpNeeded: false,
  snoozedUntil: null,
  lastMessageAt: new Date('2026-03-14T16:00:00.000Z'),
  participants: ['alex@metro.com'],
  lead: null,
  account: null,
  opportunity: null,
  messages: [
    {
      id: 'msg_1',
      direction: 'inbound',
      fromEmail: 'alex@metro.com',
      toEmails: ['jay@trainovations.com'],
      bodyText: 'Can you send pricing?',
      sentAt: new Date('2026-03-14T16:00:00.000Z'),
      isRead: false,
    },
  ],
};

describe('/api/workspace/inbox', () => {
  beforeEach(() => {
    requireAuthenticatedUser.mockResolvedValue({ id: 'user_1', role: 'sales_rep' });
    getRepInboxThreads.mockResolvedValue([baseThread]);
    getPrismaClient.mockReturnValue({
      connectedAccount: {
        findFirst: vi.fn().mockResolvedValue({
          scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
        }),
      },
    });
  });

  it('returns threads and canCompose=false when compose scope missing', async () => {
    const response = await GET(new Request('http://localhost/api/workspace/inbox'));
    const payload = await response.json();

    expect(payload.threads).toHaveLength(1);
    expect(payload.threads[0].lastMessageAt).toBe('2026-03-14T16:00:00.000Z');
    expect(payload.canCompose).toBe(false);
    expect(getRepInboxThreads).toHaveBeenCalledWith('user_1', 'open');
  });

  it('returns canCompose=true when gmail.compose scope is present', async () => {
    getPrismaClient.mockReturnValue({
      connectedAccount: {
        findFirst: vi.fn().mockResolvedValue({
          scopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.compose',
          ],
        }),
      },
    });

    const response = await GET(new Request('http://localhost/api/workspace/inbox'));
    const payload = await response.json();

    expect(payload.canCompose).toBe(true);
  });

  it('passes the status filter query param to the service', async () => {
    await GET(new Request('http://localhost/api/workspace/inbox?status=awaiting_reply'));
    expect(getRepInboxThreads).toHaveBeenCalledWith('user_1', 'awaiting_reply');
  });

  it('falls back to open filter for unknown status values', async () => {
    await GET(new Request('http://localhost/api/workspace/inbox?status=invalid'));
    expect(getRepInboxThreads).toHaveBeenCalledWith('user_1', 'open');
  });

  it('returns 403 for non-sales-rep users', async () => {
    requireAuthenticatedUser.mockResolvedValue({ id: 'user_1', role: 'sales_manager' });
    const response = await GET(new Request('http://localhost/api/workspace/inbox'));
    expect(response.status).toBe(403);
  });
});
