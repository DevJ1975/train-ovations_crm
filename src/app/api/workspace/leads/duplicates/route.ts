import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

export async function GET() {
  const user = await requireAuthenticatedUser('/workspace/leads');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!repProfile) {
    return NextResponse.json({ error: 'Rep profile not found' }, { status: 404 });
  }

  const duplicates = await db.lead.findMany({
    where: {
      repProfileId: repProfile.id,
      duplicateOfLeadId: {
        not: null,
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      company: true,
      status: true,
      duplicateOfLeadId: true,
      duplicateOfLead: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json({
    duplicates: duplicates.map((lead) => ({
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      company: lead.company,
      status: lead.status,
      duplicateOfLeadId: lead.duplicateOfLeadId,
      original: lead.duplicateOfLead
        ? {
            firstName: lead.duplicateOfLead.firstName,
            lastName: lead.duplicateOfLead.lastName,
            email: lead.duplicateOfLead.email,
          }
        : null,
    })),
  });
}
