import { NextResponse } from 'next/server';
import { requireMobileAuth, paginated } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const db = getPrismaClient();
  const { searchParams } = new URL(request.url);
  const stage = searchParams.get('stage') ?? '';
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
    ...(stage ? { stage: stage as never } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
  };

  const [total, opps] = await Promise.all([
    db.opportunity.count({ where }),
    db.opportunity.findMany({
      where,
      orderBy: [{ targetCloseDate: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        stage: true,
        amountCents: true,
        currency: true,
        targetCloseDate: true,
      },
    }),
  ]);

  return NextResponse.json(
    paginated(
      opps.map((o) => ({
        ...o,
        targetCloseDate: o.targetCloseDate?.toISOString() ?? null,
      })),
      total,
      page,
      pageSize,
    ),
  );
}
