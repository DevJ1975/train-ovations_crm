import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getRepAlerts } from '@/lib/services';

export async function GET() {
  const user = await requireAuthenticatedUser('/workspace/alerts');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const alerts = await getRepAlerts(user.id);

  return NextResponse.json({
    alerts: alerts.map((alert) => ({
      ...alert,
      triggeredAt: alert.triggeredAt.toISOString(),
      resolvedAt: alert.resolvedAt?.toISOString() ?? null,
    })),
  });
}
