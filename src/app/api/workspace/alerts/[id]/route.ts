import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { updateRepAlertStatus } from '@/lib/services';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuthenticatedUser('/workspace/alerts');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const payload = (await request.json().catch(() => null)) as
    | { status?: string }
    | null;

  if (payload?.status !== 'dismissed' && payload?.status !== 'resolved') {
    return NextResponse.json({ error: 'Invalid alert status' }, { status: 400 });
  }

  const alert = await updateRepAlertStatus(user.id, id, payload.status);

  if (!alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  return NextResponse.json({
    alert: {
      ...alert,
      triggeredAt: alert.triggeredAt.toISOString(),
      resolvedAt: alert.resolvedAt?.toISOString() ?? null,
    },
  });
}
