import { NextResponse } from 'next/server';
import { requireMobileAuth } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  const account = await db.account.findFirst({
    where: { id, ownerRepProfileId: repProfile.id },
  });
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  return NextResponse.json({
    id: account.id,
    name: account.name,
    domain: account.domain,
    industry: account.industry,
    status: account.status,
    hqLocation: account.hqLocation,
    description: account.description,
    ownerRepProfileId: account.ownerRepProfileId,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  });
}
