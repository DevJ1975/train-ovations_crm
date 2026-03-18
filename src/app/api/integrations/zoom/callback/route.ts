import { redirect } from 'next/navigation';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { ZoomService } from '@/lib/integrations';

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser('/settings/integrations');
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    redirect('/settings/integrations?provider=zoom&status=error');
  }

  try {
    const payload = await ZoomService.exchangeAuthorizationCode(code);
    await ZoomService.connectZoomAccount({
      userId: user.id,
      providerAccountId: `${user.id}:zoom`,
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      scopes: payload.scope?.split(' '),
      expiresIn: payload.expires_in,
      accountEmail: user.email ?? undefined,
    });
    redirect('/settings/integrations?provider=zoom&status=connected');
  } catch {
    redirect('/settings/integrations?provider=zoom&status=error');
  }
}
