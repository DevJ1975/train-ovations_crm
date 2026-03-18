import { redirect } from 'next/navigation';

import { SequencesWorkspace } from '@/components/workspace/sequences-workspace';
import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function WorkspaceSequencesPage() {
  const user = await requireAuthenticatedUser('/workspace/sequences');

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

  const sequences = await db.followUpSequence.findMany({
    where: { repProfileId: repProfile.id },
    include: {
      steps: { orderBy: { stepNumber: 'asc' } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = sequences.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description ?? null,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    steps: s.steps.map((step) => ({
      id: step.id,
      stepNumber: step.stepNumber,
      delayDays: step.delayDays,
      subject: step.subject ?? null,
      bodyTemplate: step.bodyTemplate,
    })),
    enrollmentCount: s._count.enrollments,
  }));

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs crumbs={[{ label: 'Follow-Up Sequences' }]} />
          <TVSectionHeader
            description="Automate drip outreach with time-delayed steps. Enroll leads and let the sequence handle cadenced follow-up."
            eyebrow="Rep Tools"
            title="Follow-Up Sequences"
          />
        </div>

        <SequencesWorkspace sequences={serialized} />
      </div>
    </main>
  );
}
