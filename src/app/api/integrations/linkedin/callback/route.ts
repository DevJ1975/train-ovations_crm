import { redirect } from 'next/navigation';
import { ConnectedProvider, ConnectionStatus } from '@prisma/client';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { upsertConnectedAccount } from '@/lib/integrations';

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser('/settings/integrations');
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    redirect('/settings/integrations?provider=linkedin&status=error');
  }

  try {
    const credentials = {
      clientId: process.env.LINKEDIN_CLIENT_ID ?? '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? '',
      redirectUri:
        process.env.LINKEDIN_OAUTH_REDIRECT_URI ??
        `${url.origin}/api/integrations/linkedin/callback`,
    };

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: credentials.redirectUri,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      redirect('/settings/integrations?provider=linkedin&status=error');
    }

    const tokenPayload = (await tokenResponse.json()) as {
      access_token: string;
      expires_in?: number;
    };

    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    });

    const profile = profileResponse.ok
      ? ((await profileResponse.json()) as { sub?: string; email?: string; name?: string })
      : null;

    const expiresAt = tokenPayload.expires_in
      ? new Date(Date.now() + tokenPayload.expires_in * 1000)
      : null;

    await upsertConnectedAccount({
      userId: user.id,
      provider: ConnectedProvider.linkedin,
      providerAccountId: profile?.sub ?? `${user.id}:linkedin`,
      accountEmail: profile?.email ?? undefined,
      displayName: profile?.name ?? undefined,
      accessToken: tokenPayload.access_token,
      accessTokenExpiresAt: expiresAt ?? undefined,
      scopes: ['openid', 'profile', 'email', 'w_member_social'],
      connectionStatus: ConnectionStatus.connected,
    });

    redirect('/settings/integrations?provider=linkedin&status=connected');
  } catch {
    redirect('/settings/integrations?provider=linkedin&status=error');
  }
}
