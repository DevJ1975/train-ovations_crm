import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

export async function GET() {
  const user = await requireAuthenticatedUser('/workspace/quota');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!repProfile) {
    return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });
  }

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const quota = await db.repQuota.findUnique({
    where: { repProfileId_period: { repProfileId: repProfile.id, period } },
  });

  return NextResponse.json({ quota });
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser('/workspace/quota');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload.period !== 'string' || typeof payload.targetCents !== 'number') {
    return NextResponse.json({ error: 'Invalid payload. Requires period (string) and targetCents (number).' }, { status: 400 });
  }

  const { period, targetCents } = payload as { period: string; targetCents: number };

  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!repProfile) {
    return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });
  }

  const quota = await db.repQuota.upsert({
    where: { repProfileId_period: { repProfileId: repProfile.id, period } },
    create: { repProfileId: repProfile.id, period, targetCents },
    update: { targetCents },
  });

  return NextResponse.json({ quota }, { status: 200 });
}
