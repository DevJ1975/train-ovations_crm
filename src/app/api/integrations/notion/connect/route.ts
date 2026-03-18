import { redirect } from 'next/navigation';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { NotionSyncService } from '@/lib/integrations';

export async function GET() {
  const user = await requireAuthenticatedUser('/settings/integrations');

  redirect(NotionSyncService.getAuthorizationUrl(user.id));
}
