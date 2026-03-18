import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

interface MergeLeadRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, context: MergeLeadRouteContext) {
  const { id } = await context.params;

  const user = await requireAuthenticatedUser('/workspace/leads');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const keepLeadId: string | undefined = payload?.keepLeadId;

  if (!keepLeadId || typeof keepLeadId !== 'string') {
    return NextResponse.json({ error: 'keepLeadId is required' }, { status: 400 });
  }

  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!repProfile) {
    return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });
  }

  // The two lead IDs are `id` (the route param) and `keepLeadId`.
  // Fetch both and confirm they belong to this rep and that one is a duplicate of the other.
  const [leadA, leadB] = await Promise.all([
    db.lead.findFirst({
      where: { id, repProfileId: repProfile.id },
      select: { id: true, duplicateOfLeadId: true },
    }),
    db.lead.findFirst({
      where: { id: keepLeadId, repProfileId: repProfile.id },
      select: { id: true, duplicateOfLeadId: true },
    }),
  ]);

  if (!leadA || !leadB) {
    return NextResponse.json({ error: 'One or both leads not found' }, { status: 404 });
  }

  // Determine which is the duplicate (the one with duplicateOfLeadId set)
  let duplicateLeadId: string;
  if (leadA.duplicateOfLeadId === leadB.id) {
    duplicateLeadId = leadA.id;
  } else if (leadB.duplicateOfLeadId === leadA.id) {
    duplicateLeadId = leadB.id;
  } else {
    return NextResponse.json(
      { error: 'Neither lead is marked as a duplicate of the other' },
      { status: 400 },
    );
  }

  if (duplicateLeadId === keepLeadId) {
    return NextResponse.json(
      { error: 'Cannot keep the lead that is marked as a duplicate' },
      { status: 400 },
    );
  }

  // Transfer notes and activities from the duplicate to the kept lead, then delete the duplicate
  await db.$transaction([
    db.leadNote.updateMany({
      where: { leadId: duplicateLeadId },
      data: { leadId: keepLeadId },
    }),
    db.activityLog.updateMany({
      where: { leadId: duplicateLeadId },
      data: { leadId: keepLeadId },
    }),
    db.lead.delete({
      where: { id: duplicateLeadId },
    }),
  ]);

  return NextResponse.json({ merged: true, keptLeadId: keepLeadId });
}
