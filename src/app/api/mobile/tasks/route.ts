import { NextResponse } from 'next/server';
import { AlertPriority, RepTaskSuggestionStatus, RepTaskSuggestionType } from '@prisma/client';
import { requireMobileAuth, paginated } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Mobile status → DB status sets
const PENDING_STATUSES: RepTaskSuggestionStatus[] = [
  RepTaskSuggestionStatus.generated,
  RepTaskSuggestionStatus.acknowledged,
];

function mobileStatusToDb(status?: string): RepTaskSuggestionStatus | undefined {
  switch (status) {
    case 'pending':
    case 'in_progress': return RepTaskSuggestionStatus.acknowledged;
    case 'completed': return RepTaskSuggestionStatus.converted;
    case 'cancelled': return RepTaskSuggestionStatus.dismissed;
    default: return undefined;
  }
}

function dbStatusToMobile(status: RepTaskSuggestionStatus): string {
  switch (status) {
    case RepTaskSuggestionStatus.converted: return 'completed';
    case RepTaskSuggestionStatus.dismissed: return 'cancelled';
    case RepTaskSuggestionStatus.archived: return 'cancelled';
    default: return 'pending';
  }
}

function serializeTask(t: {
  id: string; title: string; explanation: string | null; status: RepTaskSuggestionStatus;
  priority: AlertPriority; recommendedDueAt: Date | null; repProfileId: string | null;
  leadId: string | null; accountId?: string | null; opportunityId?: string | null;
  createdAt: Date; updatedAt: Date;
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
    accountId: t.accountId ?? null,
    opportunityId: t.opportunityId ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const db = getPrismaClient();
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') ?? 'pending';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '20'));

  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json(paginated([], 0, page, pageSize));

  const dbStatuses: RepTaskSuggestionStatus[] =
    statusFilter === 'completed'
      ? [RepTaskSuggestionStatus.converted]
      : statusFilter === 'cancelled'
        ? [RepTaskSuggestionStatus.dismissed, RepTaskSuggestionStatus.archived]
        : PENDING_STATUSES;

  const where = {
    repProfileId: repProfile.id,
    status: { in: dbStatuses },
  };

  const [total, tasks] = await Promise.all([
    db.repTaskSuggestion.count({ where }),
    db.repTaskSuggestion.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { recommendedDueAt: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json(paginated(tasks.map(serializeTask), total, page, pageSize));
}

export async function POST(request: Request) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const db = getPrismaClient();
  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.title || typeof body.title !== 'string') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const priorityMap: Record<string, AlertPriority> = {
    low: AlertPriority.low,
    medium: AlertPriority.medium,
    high: AlertPriority.high,
    urgent: AlertPriority.urgent,
  };

  const task = await db.repTaskSuggestion.create({
    data: {
      repProfileId: repProfile.id,
      type: RepTaskSuggestionType.schedule_check_in,
      status: RepTaskSuggestionStatus.generated,
      title: body.title,
      reason: body.title, // required field — use title as reason for manual tasks
      explanation: body.description ? String(body.description) : null,
      priority: priorityMap[String(body.priority ?? 'medium')] ?? AlertPriority.medium,
      recommendedDueAt: body.dueDate ? new Date(String(body.dueDate)) : null,
      leadId: body.leadId ? String(body.leadId) : null,
    },
  });

  return NextResponse.json(serializeTask(task), { status: 201 });
}
