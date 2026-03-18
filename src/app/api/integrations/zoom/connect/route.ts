import { redirect } from 'next/navigation';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { ZoomService } from '@/lib/integrations';

export async function GET() {
  const user = await requireAuthenticatedUser('/settings/integrations');

  redirect(ZoomService.getAuthorizationUrl(user.id));
}
