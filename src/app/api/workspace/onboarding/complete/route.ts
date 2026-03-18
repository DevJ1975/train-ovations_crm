import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

export async function POST() {
  const user = await requireAuthenticatedUser('/workspace');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getPrismaClient();
  await db.repProfile.update({
    where: { userId: user.id },
    data: { onboardingComplete: true },
  });

  return NextResponse.json({ success: true });
}
