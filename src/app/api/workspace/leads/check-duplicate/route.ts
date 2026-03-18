import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser('/workspace/leads');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') ?? '';
  const firstName = searchParams.get('firstName') ?? '';
  const lastName = searchParams.get('lastName') ?? '';

  if (!email && (!firstName || !lastName)) {
    return NextResponse.json({ duplicates: [] });
  }

  const db = getPrismaClient();
  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json({ duplicates: [] });

  const orClauses = [];
  if (email) orClauses.push({ email: { equals: email, mode: 'insensitive' as const } });
  if (firstName && lastName) {
    orClauses.push({
      firstName: { equals: firstName, mode: 'insensitive' as const },
      lastName: { equals: lastName, mode: 'insensitive' as const },
    });
  }

  const duplicates = await db.lead.findMany({
    where: { repProfileId: repProfile.id, OR: orClauses },
    select: { id: true, firstName: true, lastName: true, email: true, status: true, company: true },
    take: 3,
  });

  return NextResponse.json({ duplicates });
}
