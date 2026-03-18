import { NextResponse } from 'next/server';
import { LeadStatus, SourceType } from '@prisma/client';

import { requireMobileAuth } from '@/lib/auth/mobile';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface ImportLeadRow {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  title?: unknown;
  notes?: unknown;
}

export async function POST(request: Request) {
  const auth = await requireMobileAuth(request);
  if (auth instanceof NextResponse) return auth;

  const db = getPrismaClient();
  const repProfile = await db.repProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  });
  if (!repProfile) {
    return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });
  }

  let rows: ImportLeadRow[];
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be an array of lead objects' }, { status: 400 });
    }
    rows = body as ImportLeadRow[];
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowLabel = `Row ${i + 1}`;

    const firstName = row.firstName ? String(row.firstName).trim() : '';
    const lastName = row.lastName ? String(row.lastName).trim() : '';
    const email = row.email ? String(row.email).trim() : '';

    if (!firstName || !lastName || !email) {
      skipped++;
      errors.push(`${rowLabel}: missing required field(s) — firstName, lastName, and email are required`);
      continue;
    }

    try {
      await db.lead.create({
        data: {
          firstName,
          lastName,
          email,
          phone: row.phone ? String(row.phone).trim() : null,
          company: row.company ? String(row.company).trim() : null,
          jobTitle: row.title ? String(row.title).trim() : null,
          notes: row.notes ? String(row.notes).trim() : null,
          status: LeadStatus.new,
          repProfileId: repProfile.id,
          sourceType: SourceType.import,
          consent: true,
        },
      });
      imported++;
    } catch (err) {
      skipped++;
      const message = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`${rowLabel} (${email}): ${message}`);
    }
  }

  return NextResponse.json({ imported, skipped, errors });
}
