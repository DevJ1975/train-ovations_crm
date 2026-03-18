import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

interface EnrollRouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: EnrollRouteContext) {
  const { id } = await context.params;
  const user = await requireAuthenticatedUser('/workspace/sequences');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload.leadId !== 'string') {
    return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
  }

  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!repProfile) {
    return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });
  }

  const sequence = await db.followUpSequence.findFirst({
    where: { id, repProfileId: repProfile.id },
    include: {
      steps: { orderBy: { stepNumber: 'asc' }, take: 1 },
    },
  });

  if (!sequence) {
    return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
  }

  // Verify lead belongs to this rep
  const lead = await db.lead.findFirst({
    where: { id: payload.leadId, repProfileId: repProfile.id },
    select: { id: true },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Check for existing active enrollment
  const existing = await db.followUpEnrollment.findFirst({
    where: {
      sequenceId: id,
      leadId: payload.leadId,
      status: { in: ['active', 'paused'] },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'Lead is already enrolled in this sequence' },
      { status: 409 },
    );
  }

  const firstStep = sequence.steps[0];
  const nextSendAt = firstStep
    ? new Date(Date.now() + firstStep.delayDays * 24 * 60 * 60 * 1000)
    : null;

  await db.followUpEnrollment.create({
    data: {
      sequenceId: id,
      leadId: payload.leadId,
      nextSendAt,
    },
  });

  return NextResponse.json({ enrolled: true }, { status: 201 });
}
