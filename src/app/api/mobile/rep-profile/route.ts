import { NextResponse } from 'next/server';
import { requireMobileAuth } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function serializeProfile(p: {
  id: string; userId: string; displayName: string; slug: string;
  firstName: string | null; lastName: string | null; title: string | null;
  bio: string | null; email: string | null; phone: string | null;
  website: string | null; location: string | null; photoUrl: string | null;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    id: p.id,
    userId: p.userId,
    displayName: p.displayName,
    slug: p.slug,
    firstName: p.firstName,
    lastName: p.lastName,
    title: p.title,
    bio: p.bio,
    email: p.email,
    phone: p.phone,
    website: p.website,
    location: p.location,
    photoUrl: p.photoUrl,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const db = getPrismaClient();
  const profile = await db.repProfile.findUnique({
    where: { userId: auth.id },
  });
  if (!profile) return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });

  return NextResponse.json(serializeProfile(profile));
}

export async function PATCH(request: Request) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const db = getPrismaClient();
  const profile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updated = await db.repProfile.update({
    where: { id: profile.id },
    data: {
      ...(body.displayName != null && { displayName: String(body.displayName) }),
      ...(body.title != null && { title: String(body.title) }),
      ...(body.bio != null && { bio: String(body.bio) }),
      ...(body.phone !== undefined && { phone: body.phone ? String(body.phone) : null }),
      ...(body.website !== undefined && { website: body.website ? String(body.website) : null }),
      ...(body.location !== undefined && { location: body.location ? String(body.location) : null }),
    },
  });

  return NextResponse.json(serializeProfile(updated));
}
