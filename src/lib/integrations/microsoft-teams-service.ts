import { ConnectedProvider, ConnectionStatus } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import { MicrosoftGraphService } from './microsoft-graph-service';
import type { ProviderConnectionSummary } from './types';

export class MicrosoftTeamsService {
  static async listTeams(userId: string) {
    const accessToken = await MicrosoftGraphService.getAccessToken(
      userId,
      ConnectedProvider.microsoft_teams,
    );
    if (!accessToken) throw new Error('No Teams access token found');
    return MicrosoftGraphService.listJoinedTeams(accessToken);
  }

  static async listChannels(userId: string, teamId: string) {
    const accessToken = await MicrosoftGraphService.getAccessToken(
      userId,
      ConnectedProvider.microsoft_teams,
    );
    if (!accessToken) throw new Error('No Teams access token found');
    return MicrosoftGraphService.listTeamChannels(accessToken, teamId);
  }

  static async postToChannel(userId: string, input: {
    teamId: string;
    channelId: string;
    content: string;
    contentType?: 'html' | 'text';
  }) {
    const accessToken = await MicrosoftGraphService.getAccessToken(
      userId,
      ConnectedProvider.microsoft_teams,
    );
    if (!accessToken) throw new Error('No Teams access token found');
    return MicrosoftGraphService.postChannelMessage(accessToken, input);
  }

  static async postMeetingSummaryToChannel(userId: string, input: {
    teamId: string;
    channelId: string;
    meetingTopic: string;
    summary: string;
    leadName?: string;
    company?: string;
    actionItems?: string[];
  }) {
    const items = (input.actionItems ?? [])
      .map((item, i) => `<li>${i + 1}. ${item}</li>`)
      .join('');

    const content = `
      <h3>Meeting Summary: ${input.meetingTopic}</h3>
      ${input.leadName ? `<p><strong>Contact:</strong> ${input.leadName}${input.company ? ` · ${input.company}` : ''}</p>` : ''}
      <p>${input.summary}</p>
      ${items ? `<p><strong>Action Items:</strong></p><ul>${items}</ul>` : ''}
      <p><em>Shared via Trainovations CRM</em></p>
    `.trim();

    return this.postToChannel(userId, {
      teamId: input.teamId,
      channelId: input.channelId,
      content,
      contentType: 'html',
    });
  }

  static async listChats(userId: string) {
    const accessToken = await MicrosoftGraphService.getAccessToken(
      userId,
      ConnectedProvider.microsoft_teams,
    );
    if (!accessToken) throw new Error('No Teams access token found');
    return MicrosoftGraphService.listChats(accessToken);
  }

  static async getProviderSummary(userId: string): Promise<ProviderConnectionSummary> {
    const prisma = getPrismaClient();
    const account = await prisma.connectedAccount.findUnique({
      where: {
        userId_provider: { userId, provider: ConnectedProvider.microsoft_teams },
      },
    });

    return {
      provider: ConnectedProvider.microsoft_teams,
      label: 'Microsoft Teams',
      status: account?.connectionStatus ?? ConnectionStatus.disconnected,
      scopes: account?.scopes ?? [],
      syncEnabled: account?.syncEnabled ?? false,
      automationEnabled: account?.automationEnabled ?? false,
      lastSyncedAt: account?.lastSyncedAt,
    };
  }
}
