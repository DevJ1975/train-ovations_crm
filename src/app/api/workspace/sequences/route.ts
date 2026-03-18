import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

export async function GET() {
  const user = await requireAuthenticatedUser('/workspace/sequences');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!repProfile) {
    return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });
  }

  const sequences = await db.followUpSequence.findMany({
    where: { repProfileId: repProfile.id },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    sequences: sequences.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      steps: s.steps.map((step) => ({
        id: step.id,
        stepNumber: step.stepNumber,
        delayDays: step.delayDays,
        subject: step.subject,
        bodyTemplate: step.bodyTemplate,
      })),
      enrollmentCount: s._count.enrollments,
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser('/workspace/sequences');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload.name !== 'string' || !payload.name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  if (!Array.isArray(payload.steps) || payload.steps.length === 0) {
    return NextResponse.json({ error: 'At least one step is required' }, { status: 400 });
  }

  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!repProfile) {
    return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });
  }

  const sequence = await db.$transaction(async (tx) => {
    const seq = await tx.followUpSequence.create({
      data: {
        repProfileId: repProfile.id,
        name: payload.name.trim(),
        description: payload.description?.trim() ?? null,
      },
    });

    await tx.followUpStep.createMany({
      data: (payload.steps as Array<{ delayDays: number; subject?: string; bodyTemplate: string }>).map(
        (step, index) => ({
          sequenceId: seq.id,
          stepNumber: index + 1,
          delayDays: Number(step.delayDays),
          subject: step.subject?.trim() ?? null,
          bodyTemplate: step.bodyTemplate,
        }),
      ),
    });

    return tx.followUpSequence.findUnique({
      where: { id: seq.id },
      include: {
        steps: { orderBy: { stepNumber: 'asc' } },
        _count: { select: { enrollments: true } },
      },
    });
  });

  if (!sequence) {
    return NextResponse.json({ error: 'Failed to create sequence' }, { status: 500 });
  }

  return NextResponse.json(
    {
      sequence: {
        id: sequence.id,
        name: sequence.name,
        description: sequence.description,
        isActive: sequence.isActive,
        createdAt: sequence.createdAt.toISOString(),
        updatedAt: sequence.updatedAt.toISOString(),
        steps: sequence.steps.map((step) => ({
          id: step.id,
          stepNumber: step.stepNumber,
          delayDays: step.delayDays,
          subject: step.subject,
          bodyTemplate: step.bodyTemplate,
        })),
        enrollmentCount: sequence._count.enrollments,
      },
    },
    { status: 201 },
  );
}
