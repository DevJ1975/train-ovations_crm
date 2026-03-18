import { NextResponse } from 'next/server';
import { NoteTemplateType } from '@prisma/client';
import { requireMobileAuth, paginated } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const TEMPLATE_MAP: Record<string, NoteTemplateType> = {
  general: NoteTemplateType.blank,
  blank: NoteTemplateType.blank,
  call: NoteTemplateType.meeting_notes,
  meeting: NoteTemplateType.meeting_notes,
  meeting_notes: NoteTemplateType.meeting_notes,
  follow_up: NoteTemplateType.follow_up_plan,
  follow_up_plan: NoteTemplateType.follow_up_plan,
  account_brief: NoteTemplateType.account_brief,
};

const REVERSE_TEMPLATE_MAP: Record<NoteTemplateType, string> = {
  [NoteTemplateType.blank]: 'general',
  [NoteTemplateType.meeting_notes]: 'meeting',
  [NoteTemplateType.follow_up_plan]: 'follow_up',
  [NoteTemplateType.account_brief]: 'account_brief',
};

function serializeNote(n: {
  id: string; title: string | null; body: string; templateType: NoteTemplateType;
  repProfileId: string; leadId: string | null; accountId: string | null;
  opportunityId: string | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    templateType: REVERSE_TEMPLATE_MAP[n.templateType] ?? 'general',
    repProfileId: n.repProfileId,
    leadId: n.leadId,
    accountId: n.accountId,
    opportunityId: n.opportunityId,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const db = getPrismaClient();
  const { searchParams } = new URL(request.url);
  const templateType = searchParams.get('templateType') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '20'));

  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json(paginated([], 0, page, pageSize));

  const where = {
    repProfileId: repProfile.id,
    // Global notes only — not attached to a specific lead/account/opportunity
    leadId: null,
    accountId: null,
    opportunityId: null,
    ...(templateType && TEMPLATE_MAP[templateType]
      ? { templateType: TEMPLATE_MAP[templateType] }
      : {}),
  };

  const [total, notes] = await Promise.all([
    db.repNote.count({ where }),
    db.repNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json(paginated(notes.map(serializeNote), total, page, pageSize));
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

  if (!body.body || typeof body.body !== 'string') {
    return NextResponse.json({ error: 'body is required' }, { status: 400 });
  }

  const note = await db.repNote.create({
    data: {
      repProfileId: repProfile.id,
      title: body.title ? String(body.title) : null,
      body: body.body,
      templateType: TEMPLATE_MAP[String(body.templateType ?? 'general')] ?? NoteTemplateType.blank,
    },
  });

  return NextResponse.json(serializeNote(note), { status: 201 });
}
