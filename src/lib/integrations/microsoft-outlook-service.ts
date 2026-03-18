import { ConnectedProvider, MailboxProvider } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import { MicrosoftGraphService } from './microsoft-graph-service';

export class MicrosoftOutlookService {
  /**
   * Sync the user's Outlook inbox into the EmailMailbox / EmailThread / EmailMessage models.
   */
  static async syncInbox(userId: string): Promise<{ synced: number }> {
    const accessToken = await MicrosoftGraphService.getAccessToken(
      userId,
      ConnectedProvider.microsoft_outlook,
    );
    if (!accessToken) throw new Error('No Outlook access token found for user');

    const prisma = getPrismaClient();

    // Ensure mailbox record exists
    const account = await prisma.connectedAccount.findUnique({
      where: { userId_provider: { userId, provider: ConnectedProvider.microsoft_outlook } },
    });
    if (!account) throw new Error('No Outlook connected account found');

    const mailbox = await prisma.emailMailbox.upsert({
      where: { userId_emailAddress: { userId, emailAddress: account.accountEmail ?? userId } },
      update: { connectionStatus: 'connected', lastSyncedAt: new Date() },
      create: {
        userId,
        connectedAccountId: account.id,
        provider: MailboxProvider.outlook,
        connectionStatus: 'connected',
        label: 'Outlook Inbox',
        emailAddress: account.accountEmail ?? userId,
        syncEnabled: true,
        lastSyncedAt: new Date(),
      },
    });

    const { value: messages } = await MicrosoftGraphService.listInboxMessages(accessToken, 50);

    let synced = 0;

    for (const msg of messages) {
      const fromEmail = msg.from?.emailAddress?.address ?? '';
      const toEmails = (msg.toRecipients ?? []).map((r) => r.emailAddress?.address ?? '');
      const isInbound = fromEmail !== account.accountEmail;

      // Find a matching lead by email
      const lead = await prisma.lead.findFirst({
        where: {
          repProfileId: { not: null },
          OR: [
            { email: fromEmail },
            ...(isInbound ? [] : [{ email: { in: toEmails } }]),
          ],
        },
        select: { id: true, repProfileId: true },
      });

      // Upsert thread by conversationId
      const existingThread = await prisma.emailThread.findFirst({
        where: { mailboxId: mailbox.id, providerThreadId: msg.conversationId },
      });

      const thread = existingThread
        ? existingThread
        : await prisma.emailThread.create({
            data: {
              mailboxId: mailbox.id,
              repProfileId: lead?.repProfileId ?? null,
              leadId: lead?.id ?? null,
              providerThreadId: msg.conversationId,
              subject: msg.subject ?? '(no subject)',
              snippet: msg.bodyPreview ?? '',
              participants: [fromEmail, ...toEmails].filter(Boolean),
              unreadCount: msg.isRead ? 0 : 1,
              lastMessageAt: new Date(msg.receivedDateTime),
              status: 'open',
            },
          });

      // Check if message already exists
      const existingMsg = await prisma.emailMessage.findFirst({
        where: { threadId: thread.id, providerMessageId: msg.id },
      });

      if (!existingMsg) {
        await prisma.emailMessage.create({
          data: {
            threadId: thread.id,
            providerMessageId: msg.id,
            direction: isInbound ? 'inbound' : 'outbound',
            subject: msg.subject ?? '(no subject)',
            snippet: msg.bodyPreview ?? '',
            bodyText: msg.bodyPreview ?? '',
            fromEmail,
            toEmails,
            isRead: msg.isRead,
            sentAt: new Date(msg.receivedDateTime),
          },
        });
        synced++;
      }
    }

    // Update last synced timestamp
    await prisma.connectedAccount.update({
      where: { id: account.id },
      data: { lastSyncedAt: new Date() },
    });

    return { synced };
  }
}
