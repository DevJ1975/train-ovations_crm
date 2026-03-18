import { redirect } from 'next/navigation';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { LinkedInService } from '@/lib/integrations';

export async function GET() {
  const user = await requireAuthenticatedUser('/settings/integrations');

  redirect(LinkedInService.getAuthorizationUrl(user.id));
}
