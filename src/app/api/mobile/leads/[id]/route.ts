import { NextResponse } from 'next/server';
import { LeadStatus } from '@prisma/client';
import { requireMobileAuth } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

function serializeLead(lead: {
  id: string; firstName: string; lastName: string; email: string;
  phone: string | null; company: string | null; jobTitle: string | null;
  status: string; interest: string | null; notes: string | null;
  repProfileId: string | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    title: lead.jobTitle,
    status: lead.status,
    source: lead.interest,
    notes: lead.notes,
    repProfileId: lead.repProfileId,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

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

  const lead = await db.lead.findFirst({
    where: { id, repProfileId: repProfile.id },
  });
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  return NextResponse.json(serializeLead(lead));
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const existing = await db.lead.findFirst({
    where: { id, repProfileId: repProfile.id },
  });
  if (!existing) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const lead = await db.lead.update({
    where: { id },
    data: {
      ...(body.firstName != null && { firstName: String(body.firstName) }),
      ...(body.lastName != null && { lastName: String(body.lastName) }),
      ...(body.email != null && { email: String(body.email) }),
      ...(body.phone !== undefined && { phone: body.phone ? String(body.phone) : null }),
      ...(body.company !== undefined && { company: body.company ? String(body.company) : null }),
      ...(body.title !== undefined && { jobTitle: body.title ? String(body.title) : null }),
      ...(body.notes !== undefined && { notes: body.notes ? String(body.notes) : null }),
      ...(body.status != null && { status: body.status as LeadStatus }),
    },
  });

  return NextResponse.json(serializeLead(lead));
}
