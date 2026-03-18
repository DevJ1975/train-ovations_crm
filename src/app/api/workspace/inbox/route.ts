import { ConnectedProvider } from '@prisma/client';
import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { GmailService } from '@/lib/integrations';
import { getPrismaClient } from '@/lib/prisma';
import { getRepInboxThreads, type InboxStatusFilter } from '@/lib/services';

const VALID_STATUS_FILTERS: InboxStatusFilter[] = [
  'open',
  'awaiting_reply',
  'follow_up_needed',
  'snoozed',
  'archived',
];

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser('/workspace/inbox');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status') as InboxStatusFilter | null;
  const statusFilter: InboxStatusFilter =
    statusParam && VALID_STATUS_FILTERS.includes(statusParam) ? statusParam : 'open';

  const prisma = getPrismaClient();
  const [threads, gmailAccount] = await Promise.all([
    getRepInboxThreads(user.id, statusFilter),
    prisma.connectedAccount.findFirst({
      where: { userId: user.id, provider: ConnectedProvider.google_gmail },
      select: { scopes: true },
    }),
  ]);

  const canCompose = gmailAccount ? GmailService.canCompose(gmailAccount) : false;

  return NextResponse.json({
    threads: threads.map((thread) => ({
      ...thread,
      lastMessageAt: thread.lastMessageAt.toISOString(),
      snoozedUntil: thread.snoozedUntil?.toISOString() ?? null,
      messages: thread.messages.map((message) => ({
        ...message,
        sentAt: message.sentAt.toISOString(),
      })),
    })),
    canCompose,
  });
}
