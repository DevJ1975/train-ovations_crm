import { NextResponse } from 'next/server';
import { requireMobileAuth, paginated } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const db = getPrismaClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '20'));

  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json(paginated([], 0, page, pageSize));

  const where = {
    ownerRepProfileId: repProfile.id,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { domain: { contains: search, mode: 'insensitive' as const } },
            { industry: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, accounts] = await Promise.all([
    db.account.count({ where }),
    db.account.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        domain: true,
        industry: true,
        status: true,
      },
    }),
  ]);

  return NextResponse.json(paginated(accounts, total, page, pageSize));
}
