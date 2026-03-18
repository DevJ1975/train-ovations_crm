import { NextResponse } from 'next/server';
import type { EnrollmentStatus } from '@prisma/client';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

interface EnrollmentsRouteContext {
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

export async function GET(_request: Request, context: EnrollmentsRouteContext) {
  const { id } = await context.params;
  const access = await requireAccessibleSequence(id);

  if ('error' in access) return access.error;

  const enrollments = await access.db.followUpEnrollment.findMany({
    where: { sequenceId: id },
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
  });

  return NextResponse.json({
    enrollments: enrollments.map((e) => ({
      id: e.id,
      currentStep: e.currentStep,
      status: e.status,
      startedAt: e.startedAt.toISOString(),
      completedAt: e.completedAt?.toISOString() ?? null,
      cancelledAt: e.cancelledAt?.toISOString() ?? null,
      nextSendAt: e.nextSendAt?.toISOString() ?? null,
      lead: e.lead,
    })),
  });
}

export async function PATCH(request: Request, context: EnrollmentsRouteContext) {
  const { id } = await context.params;
  const access = await requireAccessibleSequence(id);

  if ('error' in access) return access.error;

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload.enrollmentId !== 'string' || typeof payload.status !== 'string') {
    return NextResponse.json(
      { error: 'enrollmentId and status are required' },
      { status: 400 },
    );
  }

  const validStatuses: EnrollmentStatus[] = ['active', 'paused', 'completed', 'cancelled'];
  if (!validStatuses.includes(payload.status as EnrollmentStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const enrollment = await access.db.followUpEnrollment.findFirst({
    where: { id: payload.enrollmentId, sequenceId: id },
  });

  if (!enrollment) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
  }

  const now = new Date();
  const updateData: {
    status: EnrollmentStatus;
    completedAt?: Date | null;
    cancelledAt?: Date | null;
  } = {
    status: payload.status as EnrollmentStatus,
  };

  if (payload.status === 'completed') {
    updateData.completedAt = now;
  } else if (payload.status === 'cancelled') {
    updateData.cancelledAt = now;
  } else if (payload.status === 'active') {
    updateData.completedAt = null;
    updateData.cancelledAt = null;
  }

  const updated = await access.db.followUpEnrollment.update({
    where: { id: payload.enrollmentId },
    data: updateData,
  });

  return NextResponse.json({
    enrollment: {
      id: updated.id,
      status: updated.status,
      completedAt: updated.completedAt?.toISOString() ?? null,
      cancelledAt: updated.cancelledAt?.toISOString() ?? null,
    },
  });
}
