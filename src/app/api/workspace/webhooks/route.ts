import crypto from 'crypto';

import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

export async function GET() {
  const user = await requireAuthenticatedUser('/workspace/webhooks');

  const db = getPrismaClient();

  const webhooks = await db.webhookEndpoint.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ webhooks });
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser('/workspace/webhooks');

  const payload = await request.json().catch(() => null);

  if (
    !payload ||
    typeof payload.url !== 'string' ||
    !Array.isArray(payload.events)
  ) {
    return NextResponse.json(
      { error: 'Invalid payload. Requires url (string) and events (string[]).' },
      { status: 400 },
    );
  }

  const { url, events, description } = payload as {
    url: string;
    events: string[];
    description?: string;
  };

  const secret = crypto.randomBytes(32).toString('hex');

  const db = getPrismaClient();

  const webhook = await db.webhookEndpoint.create({
    data: {
      userId: user.id,
      url,
      events,
      secret,
      description: description ?? null,
    },
  });

  // Return the full secret only on creation
  return NextResponse.json({ webhook, secret }, { status: 201 });
}
