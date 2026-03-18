import { NextResponse } from 'next/server';
import { NoteTemplateType } from '@prisma/client';
import { requireMobileAuth } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

function serializeNote(note: {
  id: string; title: string | null; body: string; templateType: string;
  repProfileId: string; leadId: string | null; accountId: string | null;
  opportunityId: string | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    templateType: note.templateType,
    repProfileId: note.repProfileId,
    leadId: note.leadId,
    accountId: note.accountId,
    opportunityId: note.opportunityId,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id: leadId } = await ctx.params;
  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json([], { status: 200 });

  // Verify lead belongs to this rep
  const lead = await db.lead.findFirst({
    where: { id: leadId, repProfileId: repProfile.id },
    select: { id: true },
  });
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const notes = await db.repNote.findMany({
    where: { repProfileId: repProfile.id, leadId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(notes.map(serializeNote));
}

export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id: leadId } = await ctx.params;
  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });

  const lead = await db.lead.findFirst({
    where: { id: leadId, repProfileId: repProfile.id },
    select: { id: true },
  });
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.body || typeof body.body !== 'string') {
    return NextResponse.json({ error: 'body is required' }, { status: 400 });
  }

  const templateTypeMap: Record<string, NoteTemplateType> = {
    general: NoteTemplateType.blank,
    blank: NoteTemplateType.blank,
    call: NoteTemplateType.meeting_notes,
    meeting: NoteTemplateType.meeting_notes,
    meeting_notes: NoteTemplateType.meeting_notes,
    follow_up: NoteTemplateType.follow_up_plan,
    follow_up_plan: NoteTemplateType.follow_up_plan,
    account_brief: NoteTemplateType.account_brief,
  };

  const note = await db.repNote.create({
    data: {
      repProfileId: repProfile.id,
      leadId,
      title: body.title ? String(body.title) : null,
      body: body.body,
      templateType: templateTypeMap[String(body.templateType ?? 'general')] ?? NoteTemplateType.blank,
    },
  });

  return NextResponse.json(serializeNote(note), { status: 201 });
}
