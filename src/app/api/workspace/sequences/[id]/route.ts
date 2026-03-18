import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

interface SequenceRouteContext {
  params: Promise<{ id: string }>;
}

async function requireAccessibleSequence(id: string) {
  const user = await requireAuthenticatedUser('/workspace/sequences');

  if (user.role !== 'sales_rep') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const;
  }

  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!repProfile) {
    return { error: NextResponse.json({ error: 'Rep profile not found' }, { status: 404 }) } as const;
  }

  const sequence = await db.followUpSequence.findFirst({
    where: { id, repProfileId: repProfile.id },
  });

  if (!sequence) {
    return { error: NextResponse.json({ error: 'Sequence not found' }, { status: 404 }) } as const;
  }

  return { user, repProfile, sequence, db } as const;
}

export async function GET(_request: Request, context: SequenceRouteContext) {
  const { id } = await context.params;
  const access = await requireAccessibleSequence(id);

  if ('error' in access) return access.error;

  const sequence = await access.db.followUpSequence.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { stepNumber: 'asc' } },
      enrollments: {
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
      },
    },
  });

  if (!sequence) {
    return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
  }

  return NextResponse.json({
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
      enrollments: sequence.enrollments.map((e) => ({
        id: e.id,
        currentStep: e.currentStep,
        status: e.status,
        startedAt: e.startedAt.toISOString(),
        completedAt: e.completedAt?.toISOString() ?? null,
        cancelledAt: e.cancelledAt?.toISOString() ?? null,
        nextSendAt: e.nextSendAt?.toISOString() ?? null,
        lead: e.lead,
      })),
    },
  });
}

export async function PATCH(request: Request, context: SequenceRouteContext) {
  const { id } = await context.params;
  const access = await requireAccessibleSequence(id);

  if ('error' in access) return access.error;

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const data: { name?: string; description?: string | null; isActive?: boolean } = {};

  if (typeof payload.name === 'string') data.name = payload.name.trim();
  if ('description' in payload) data.description = payload.description ?? null;
  if (typeof payload.isActive === 'boolean') data.isActive = payload.isActive;

  const updated = await access.db.followUpSequence.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    sequence: {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(_request: Request, context: SequenceRouteContext) {
  const { id } = await context.params;
  const access = await requireAccessibleSequence(id);

  if ('error' in access) return access.error;

  await access.db.followUpSequence.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
