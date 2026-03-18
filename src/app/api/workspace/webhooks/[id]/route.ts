import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await requireAuthenticatedUser('/workspace/webhooks');

  const { id } = params;
  const db = getPrismaClient();

  const existing = await db.webhookEndpoint.findUnique({ where: { id } });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { url, events, description, isActive } = payload as {
    url?: string;
    events?: string[];
    description?: string;
    isActive?: boolean;
  };

  const updated = await db.webhookEndpoint.update({
    where: { id },
    data: {
      ...(typeof url === 'string' && { url }),
      ...(Array.isArray(events) && { events }),
      ...(typeof description === 'string' && { description }),
      ...(typeof isActive === 'boolean' && { isActive }),
    },
  });

  return NextResponse.json({ webhook: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const user = await requireAuthenticatedUser('/workspace/webhooks');

  const { id } = params;
  const db = getPrismaClient();

  const existing = await db.webhookEndpoint.findUnique({ where: { id } });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  await db.webhookEndpoint.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
