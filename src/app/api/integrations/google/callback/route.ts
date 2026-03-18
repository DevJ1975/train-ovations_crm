import { redirect } from 'next/navigation';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { GoogleAuthService } from '@/lib/integrations';

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser('/settings/integrations');
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    redirect('/settings/integrations?provider=google&status=error');
  }

  try {
    await GoogleAuthService.connectWorkspaceAccount({
      userId: user.id,
      code,
      state,
    });
    redirect('/settings/integrations?provider=google&status=connected');
  } catch {
    redirect('/settings/integrations?provider=google&status=error');
  }
}
