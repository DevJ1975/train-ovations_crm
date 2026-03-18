import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { MicrosoftCalendarService } from '@/lib/integrations/microsoft-calendar-service';

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser('/settings/integrations');

  const body = await request.json().catch(() => ({})) as { daysAhead?: number };

  try {
    const result = await MicrosoftCalendarService.syncEvents(user.id, body.daysAhead ?? 30);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Calendar sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
