import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { MicrosoftTeamsService } from '@/lib/integrations/microsoft-teams-service';

/** GET /api/integrations/microsoft/teams
 *  Lists the user's joined Teams (and optionally channels for a given teamId).
 */
export async function GET(request: Request) {
  const user = await requireAuthenticatedUser('/settings/integrations');
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');

  try {
    if (teamId) {
      const channels = await MicrosoftTeamsService.listChannels(user.id, teamId);
      return NextResponse.json(channels);
    }

    const teams = await MicrosoftTeamsService.listTeams(user.id);
    return NextResponse.json(teams);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Teams request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/integrations/microsoft/teams
 *  Post a message to a Teams channel.
 *  Body: { teamId, channelId, content, contentType? }
 */
export async function POST(request: Request) {
  const user = await requireAuthenticatedUser('/settings/integrations');

  const body = await request.json() as {
    teamId?: string;
    channelId?: string;
    content?: string;
    contentType?: 'html' | 'text';
  };

  if (!body.teamId || !body.channelId || !body.content) {
    return NextResponse.json(
      { error: 'teamId, channelId, and content are required' },
      { status: 400 },
    );
  }

  try {
    const result = await MicrosoftTeamsService.postToChannel(user.id, {
      teamId: body.teamId,
      channelId: body.channelId,
      content: body.content,
      contentType: body.contentType,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to post Teams message';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
