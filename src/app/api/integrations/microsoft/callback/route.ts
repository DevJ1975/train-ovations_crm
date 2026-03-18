import { redirect } from 'next/navigation';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { MicrosoftGraphService } from '@/lib/integrations/microsoft-graph-service';

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser('/settings/integrations');
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error || !code || !state) {
    redirect('/settings/integrations?provider=microsoft&status=error');
  }

  try {
    await MicrosoftGraphService.connectWorkspaceAccount({
      userId: user.id,
      code: code!,
      state: state!,
    });
    redirect('/settings/integrations?provider=microsoft&status=connected');
  } catch {
    redirect('/settings/integrations?provider=microsoft&status=error');
  }
}
