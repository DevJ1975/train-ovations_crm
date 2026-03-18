import { NextResponse } from 'next/server';
import { AlertPriority, RepTaskSuggestionStatus } from '@prisma/client';
import { requireMobileAuth } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

function dbStatusToMobile(status: RepTaskSuggestionStatus): string {
  switch (status) {
    case RepTaskSuggestionStatus.converted: return 'completed';
    case RepTaskSuggestionStatus.dismissed:
    case RepTaskSuggestionStatus.archived: return 'cancelled';
    default: return 'pending';
  }
}

function serializeTask(t: {
  id: string; title: string; explanation: string | null; status: RepTaskSuggestionStatus;
  priority: AlertPriority; recommendedDueAt: Date | null; repProfileId: string | null;
  leadId: string | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    id: t.id,
    title: t.title,
    description: t.explanation,
    status: dbStatusToMobile(t.status),
    priority: t.priority,
    dueDate: t.recommendedDueAt?.toISOString() ?? null,
    repProfileId: t.repProfileId,
    leadId: t.leadId,
    accountId: null,
    opportunityId: null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
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

  const task = await db.repTaskSuggestion.findFirst({
    where: { id, repProfileId: repProfile.id },
  });
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  return NextResponse.json(serializeTask(task));
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

  const existing = await db.repTaskSuggestion.findFirst({
    where: { id, repProfileId: repProfile.id },
  });
  if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const mobileStatusToDb = (s: string): RepTaskSuggestionStatus => {
    switch (s) {
      case 'completed': return RepTaskSuggestionStatus.converted;
      case 'cancelled': return RepTaskSuggestionStatus.dismissed;
      case 'in_progress': return RepTaskSuggestionStatus.acknowledged;
      default: return RepTaskSuggestionStatus.generated;
    }
  };

  const priorityMap: Record<string, AlertPriority> = {
    low: AlertPriority.low,
    medium: AlertPriority.medium,
    high: AlertPriority.high,
    urgent: AlertPriority.urgent,
  };

  const task = await db.repTaskSuggestion.update({
    where: { id },
    data: {
      ...(body.title != null ? { title: String(body.title), reason: String(body.title) } : {}),
      ...(body.description !== undefined ? { explanation: body.description ? String(body.description) : null } : {}),
      ...(body.status != null ? { status: mobileStatusToDb(String(body.status)) } : {}),
      ...(body.priority != null ? { priority: priorityMap[String(body.priority)] ?? existing.priority } : {}),
      ...(body.dueDate !== undefined ? { recommendedDueAt: body.dueDate ? new Date(String(body.dueDate)) : null } : {}),
    },
  });

  return NextResponse.json(serializeTask(task));
}
