import { NextResponse } from 'next/server';
import { requireMobileAuth } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const db = getPrismaClient();

  const user = await db.user.findUnique({
    where: { id: auth.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      mustChangePassword: true,
      repProfile: {
        select: {
          id: true,
          userId: true,
          displayName: true,
          slug: true,
          firstName: true,
          lastName: true,
          title: true,
          bio: true,
          email: true,
          phone: true,
          website: true,
          location: true,
          photoUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    repProfile: user.repProfile
      ? {
          ...user.repProfile,
          createdAt: user.repProfile.createdAt.toISOString(),
          updatedAt: user.repProfile.updatedAt.toISOString(),
        }
      : null,
  });
}
