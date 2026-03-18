import { NextResponse } from 'next/server';
import { ActivityLogType, LeadNoteSourceType } from '@prisma/client';
import { requireMobileAuth } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
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

  // Return the last 10 activity log entries that have durationSeconds metadata
  const entries = await db.activityLog.findMany({
    where: {
      leadId,
      repProfileId: repProfile.id,
      type: ActivityLogType.lead_note_added,
    },
    orderBy: { createdAt: 'desc' },
    take: 50, // fetch more and filter client-side for metadata match
  });

  // Filter to only call-log entries (those with durationSeconds in metadata)
  const calls = entries
    .filter((e) => {
      const meta = e.metadata as Record<string, unknown> | null;
      return meta && typeof meta.durationSeconds === 'number';
    })
    .slice(0, 10)
    .map((e) => ({
      id: e.id,
      description: e.description,
      metadata: e.metadata,
      createdAt: e.createdAt.toISOString(),
    }));

  return NextResponse.json(calls);
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

  const durationSeconds =
    typeof body.durationSeconds === 'number' ? Math.max(0, Math.floor(body.durationSeconds)) : null;

  if (durationSeconds === null) {
    return NextResponse.json({ error: 'durationSeconds is required and must be a number' }, { status: 400 });
  }

  const notes = body.notes && typeof body.notes === 'string' ? body.notes.trim() : null;
  const duration = formatDuration(durationSeconds);
  const description = `Call logged: ${duration}`;

  const metadata = {
    durationSeconds,
    ...(notes ? { notes } : {}),
  };

  const noteContent = `📞 Call logged — Duration: ${duration}${notes ? `. Notes: ${notes}` : ''}`;

  // Run both creates in parallel
  const [activityLog] = await Promise.all([
    db.activityLog.create({
      data: {
        type: ActivityLogType.lead_note_added,
        description,
        actorUserId: auth.id,
        repProfileId: repProfile.id,
        leadId,
        metadata,
      },
    }),
    db.leadNote.create({
      data: {
        leadId,
        authorId: auth.id,
        sourceType: LeadNoteSourceType.user_authored,
        content: noteContent,
        metadata,
      },
    }),
  ]);

  return NextResponse.json(
    {
      id: activityLog.id,
      description: activityLog.description,
      metadata: activityLog.metadata,
      createdAt: activityLog.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
