import { redirect } from 'next/navigation';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { GoogleAuthService } from '@/lib/integrations';

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser('/settings/integrations');
  const scopeSet =
    (new URL(request.url).searchParams.get('scopeSet') as
      | 'basic'
      | 'gmail'
      | 'calendar'
      | 'drive'
      | 'workspace_basic'
      | null) ?? 'workspace_basic';

  redirect(
    GoogleAuthService.getAuthorizationUrl({
      userId: user.id,
      scopeSet,
    }),
  );
}
