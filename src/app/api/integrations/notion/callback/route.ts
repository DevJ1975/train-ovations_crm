import { redirect } from 'next/navigation';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { NotionSyncService } from '@/lib/integrations';

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser('/settings/integrations');
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    redirect('/settings/integrations?provider=notion&status=error');
  }

  try {
    await NotionSyncService.connectNotionAccount({
      userId: user.id,
      providerAccountId: `${user.id}:notion`,
      accessToken: code,
      accountEmail: user.email ?? undefined,
      scopes: ['notes:write'],
    });
    redirect('/settings/integrations?provider=notion&status=connected');
  } catch {
    redirect('/settings/integrations?provider=notion&status=error');
  }
}
