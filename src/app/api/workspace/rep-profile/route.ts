import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

export async function PATCH(request: Request) {
  const user = await requireAuthenticatedUser('/workspace/profile');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const db = getPrismaClient();
  const profile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });

  const updated = await db.repProfile.update({
    where: { id: profile.id },
    data: {
      ...(body.displayName != null && { displayName: String(body.displayName) }),
      ...(body.title != null && { title: String(body.title) }),
      ...(body.bio != null && { bio: String(body.bio) }),
      ...(body.phone !== undefined && { phone: body.phone ? String(body.phone) : null }),
      ...(body.website !== undefined && { website: body.website ? String(body.website) : null }),
      ...(body.location !== undefined && { location: body.location ? String(body.location) : null }),
      ...(body.bookingEnabled !== undefined && { bookingEnabled: Boolean(body.bookingEnabled) }),
      ...(body.bookingTitle !== undefined && { bookingTitle: body.bookingTitle ? String(body.bookingTitle) : null }),
      ...(body.bookingDuration != null && { bookingDuration: Number(body.bookingDuration) }),
    },
  });

  return NextResponse.json({ id: updated.id });
}
