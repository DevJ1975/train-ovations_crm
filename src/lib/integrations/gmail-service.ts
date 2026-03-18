import type { ConnectedAccount } from '@prisma/client';

import { GoogleClientFactory } from './google-client-factory';

const GMAIL_COMPOSE_SCOPE = 'https://www.googleapis.com/auth/gmail.compose';

export class GmailService {
  static getConnectionSummary(account: Pick<ConnectedAccount, 'accountEmail' | 'scopes'>) {
    return {
      accountEmail: account.accountEmail,
      scopes: account.scopes,
      features: ['Message search', 'Thread lookup', 'Future email logging'],
      canCompose: account.scopes.includes(GMAIL_COMPOSE_SCOPE),
    };
  }

  static canCompose(account: Pick<ConnectedAccount, 'scopes'>): boolean {
    return account.scopes.includes(GMAIL_COMPOSE_SCOPE);
  }

  static createClient(account: Pick<ConnectedAccount, 'accessToken' | 'refreshToken'>) {
    return GoogleClientFactory.createGmailClient({
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
    });
  }

  static async listLabelNames(
    account: Pick<ConnectedAccount, 'accessToken' | 'refreshToken'>,
  ) {
    const client = this.createClient(account);
    const response = await client.users.labels.list({
      userId: 'me',
    });

    return response.data.labels?.map((label) => label.name).filter(Boolean) ?? [];
  }

  /**
   * Creates a Gmail draft reply in an existing thread.
   * Requires gmail.compose scope on the connected account.
   */
  static async createDraftReply(
    account: Pick<ConnectedAccount, 'accessToken' | 'refreshToken' | 'scopes'>,
    options: {
      providerThreadId: string;
      to: string;
      subject: string;
      bodyText: string;
      inReplyToMessageId?: string;
    },
  ): Promise<{ draftId: string }> {
    if (!this.canCompose(account)) {
      throw new Error('Gmail compose scope not granted. Reconnect with gmail_compose scope set.');
    }

    const client = this.createClient(account);

    const replyPrefix = options.subject.toLowerCase().startsWith('re:') ? '' : 'Re: ';
    const subject = `${replyPrefix}${options.subject}`;

    // Build MIME message
    const mimeLines = [
      `To: ${options.to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=UTF-8',
      'MIME-Version: 1.0',
    ];

    if (options.inReplyToMessageId) {
      mimeLines.push(`In-Reply-To: ${options.inReplyToMessageId}`);
      mimeLines.push(`References: ${options.inReplyToMessageId}`);
    }

    mimeLines.push('');
    mimeLines.push(options.bodyText);

    const raw = Buffer.from(mimeLines.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await client.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw,
          threadId: options.providerThreadId,
        },
      },
    });

    return { draftId: response.data.id ?? '' };
  }

  /**
   * Sends a reply in an existing thread.
   * Requires gmail.compose scope on the connected account.
   */
  static async sendReply(
    account: Pick<ConnectedAccount, 'accessToken' | 'refreshToken' | 'scopes'>,
    options: {
      providerThreadId: string;
      to: string;
      subject: string;
      bodyText: string;
      inReplyToMessageId?: string;
    },
  ): Promise<{ messageId: string }> {
    if (!this.canCompose(account)) {
      throw new Error('Gmail compose scope not granted. Reconnect with gmail_compose scope set.');
    }

    const client = this.createClient(account);

    const replyPrefix = options.subject.toLowerCase().startsWith('re:') ? '' : 'Re: ';
    const subject = `${replyPrefix}${options.subject}`;

    const mimeLines = [
      `To: ${options.to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=UTF-8',
      'MIME-Version: 1.0',
    ];

    if (options.inReplyToMessageId) {
      mimeLines.push(`In-Reply-To: ${options.inReplyToMessageId}`);
      mimeLines.push(`References: ${options.inReplyToMessageId}`);
    }

    mimeLines.push('');
    mimeLines.push(options.bodyText);

    const raw = Buffer.from(mimeLines.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await client.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
        threadId: options.providerThreadId,
      },
    });

    return { messageId: response.data.id ?? '' };
  }
}
