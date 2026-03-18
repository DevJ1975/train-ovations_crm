import { NextResponse } from 'next/server';
import { OpportunityStage } from '@prisma/client';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

const OPEN_STAGES: OpportunityStage[] = [
  OpportunityStage.prospecting,
  OpportunityStage.discovery,
  OpportunityStage.demo,
  OpportunityStage.proposal,
  OpportunityStage.negotiation,
];

export async function PATCH(
  _request: Request,
  { params }: { params: { period: string } },
) {
  const user = await requireAuthenticatedUser('/workspace/quota');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { period } = params;

  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!repProfile) {
    return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });
  }

  const quota = await db.repQuota.findUnique({
    where: { repProfileId_period: { repProfileId: repProfile.id, period } },
  });

  if (!quota) {
    return NextResponse.json({ error: 'Quota not found for this period' }, { status: 404 });
  }

  // Recalculate closedCents: sum amountCents for closed_won opportunities owned by this rep
  const closedAgg = await db.opportunity.aggregate({
    _sum: { amountCents: true },
    where: {
      ownerRepProfileId: repProfile.id,
      stage: OpportunityStage.closed_won,
    },
  });

  // Recalculate pipelineCents: sum amountCents for open-stage opportunities
  const pipelineAgg = await db.opportunity.aggregate({
    _sum: { amountCents: true },
    where: {
      ownerRepProfileId: repProfile.id,
      stage: { in: OPEN_STAGES },
    },
  });

  const closedCents = closedAgg._sum.amountCents ?? 0;
  const pipelineCents = pipelineAgg._sum.amountCents ?? 0;

  const updated = await db.repQuota.update({
    where: { repProfileId_period: { repProfileId: repProfile.id, period } },
    data: { closedCents, pipelineCents },
  });

  return NextResponse.json({ quota: updated });
}
