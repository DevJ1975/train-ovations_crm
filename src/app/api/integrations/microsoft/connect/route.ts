import { redirect } from 'next/navigation';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { MicrosoftGraphService, type MicrosoftScopeSet } from '@/lib/integrations/microsoft-graph-service';

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser('/settings/integrations');
  const scopeSet =
    (new URL(request.url).searchParams.get('scopeSet') as MicrosoftScopeSet | null) ?? 'all';

  redirect(
    MicrosoftGraphService.getAuthorizationUrl({
      userId: user.id,
      scopeSet,
    }),
  );
}
