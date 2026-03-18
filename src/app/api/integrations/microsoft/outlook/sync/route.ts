import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { MicrosoftOutlookService } from '@/lib/integrations/microsoft-outlook-service';

export async function POST() {
  const user = await requireAuthenticatedUser('/settings/integrations');

  try {
    const result = await MicrosoftOutlookService.syncInbox(user.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Outlook sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
