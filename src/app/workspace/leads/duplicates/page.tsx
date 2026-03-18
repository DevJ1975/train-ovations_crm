import { redirect } from 'next/navigation';

import { DuplicateLeadsClient } from '@/components/workspace/duplicate-leads-client';
import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function DuplicateLeadsPage() {
  const user = await requireAuthenticatedUser('/workspace/leads/duplicates');

  if (user.role !== 'sales_rep') {
    redirect('/workspace');
  }

  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!repProfile) {
    redirect('/workspace');
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
      createdAt: true,
      duplicateOfLeadId: true,
      duplicateOfLead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          company: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const duplicateItems = duplicates.map((lead) => ({
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    company: lead.company,
    status: lead.status,
    createdAt: lead.createdAt.toISOString(),
    duplicateOfLeadId: lead.duplicateOfLeadId!,
    original: lead.duplicateOfLead
      ? {
          id: lead.duplicateOfLead.id,
          firstName: lead.duplicateOfLead.firstName,
          lastName: lead.duplicateOfLead.lastName,
          email: lead.duplicateOfLead.email,
          company: lead.duplicateOfLead.company,
          status: lead.duplicateOfLead.status,
        }
      : null,
  }));

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-5xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs
            crumbs={[
              { label: 'Lead inbox', href: '/workspace/leads' },
              { label: 'Duplicate leads' },
            ]}
          />
          <TVSectionHeader
            eyebrow="Lead Management"
            title="Duplicate leads"
            description="Review leads that were flagged as potential duplicates. Merge or dismiss each pair."
          />
        </div>

        <DuplicateLeadsClient duplicates={duplicateItems} />
      </div>
    </main>
  );
}
