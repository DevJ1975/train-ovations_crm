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
  if (!repProfile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const opp = await db.opportunity.findFirst({
    where: { id, ownerRepProfileId: repProfile.id },
  });
  if (!opp) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });

  return NextResponse.json({
    id: opp.id,
    name: opp.name,
    stage: opp.stage,
    amountCents: opp.amountCents,
    currency: opp.currency,
    targetCloseDate: opp.targetCloseDate?.toISOString() ?? null,
    accountId: opp.accountId,
    ownerRepProfileId: opp.ownerRepProfileId,
    createdAt: opp.createdAt.toISOString(),
    updatedAt: opp.updatedAt.toISOString(),
  });
}
