import { NextResponse } from 'next/server';
import { LeadStatus, SourceType } from '@prisma/client';
import { requireMobileAuth, paginated } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const db = getPrismaClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '20'));

  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) return NextResponse.json(paginated([], 0, page, pageSize));

  const where = {
    repProfileId: repProfile.id,
    ...(status ? { status: status as never } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { company: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, leads] = await Promise.all([
    db.lead.count({ where }),
    db.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        company: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json(
    paginated(
      leads.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
      total,
      page,
      pageSize,
    ),
  );
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

  if (!body.firstName || !body.lastName || !body.email) {
    return NextResponse.json({ error: 'firstName, lastName, and email are required' }, { status: 400 });
  }

  const lead = await db.lead.create({
    data: {
      firstName: String(body.firstName),
      lastName: String(body.lastName),
      email: String(body.email),
      phone: body.phone ? String(body.phone) : null,
      company: body.company ? String(body.company) : null,
      jobTitle: body.title ? String(body.title) : null,
      notes: body.notes ? String(body.notes) : null,
      status: (body.status as LeadStatus) ?? LeadStatus.new,
      interest: body.source ? String(body.source) : null,
      repProfileId: repProfile.id,
      sourceType: SourceType.manual,
      consent: true,
    },
  });

  return NextResponse.json(
    {
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
    },
    { status: 201 },
  );
}
