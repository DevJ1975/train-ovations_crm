import { NextResponse } from 'next/server';
import { SourceType } from '@prisma/client';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';
import { createLead, getRepLeadInbox } from '@/lib/services';
import { createManualLeadSchema } from '@/lib/validation/crm';

export async function GET() {
  const user = await requireAuthenticatedUser('/workspace/leads');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const leads = await getRepLeadInbox(user.id);

  return NextResponse.json({
    leads: leads.map((lead) => ({
      ...lead,
      createdAt: lead.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser('/workspace/leads');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createManualLeadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid lead payload',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const db = getPrismaClient();
  const repProfile = await db.repProfile.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!repProfile) {
    return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });
  }

  // Duplicate detection before creating
  const orClauses = [{ email: parsed.data.email }] as Record<string, unknown>[];
  if (parsed.data.firstName && parsed.data.lastName) {
    orClauses.push({
      firstName: { equals: parsed.data.firstName, mode: 'insensitive' },
      lastName: { equals: parsed.data.lastName, mode: 'insensitive' },
    });
  }
  const existing = await db.lead.findFirst({
    where: { repProfileId: repProfile.id, OR: orClauses },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'duplicate', duplicate: existing },
      { status: 409 },
    );
  }

  const lead = await createLead({
    ...parsed.data,
    repProfileId: repProfile.id,
    sourceType: SourceType.manual,
  });

  return NextResponse.json(
    {
      lead: {
        ...lead,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
        submittedAt: lead.submittedAt?.toISOString() ?? null,
      },
    },
    { status: 201 },
  );
}
