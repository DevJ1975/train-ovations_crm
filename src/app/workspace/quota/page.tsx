import { redirect } from 'next/navigation';

import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { QuotaWorkspace } from '@/components/workspace/quota-workspace';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function QuotaPage() {
  const user = await requireAuthenticatedUser('/workspace/quota');

  if (user.role !== 'sales_rep') redirect('/workspace');

  const db = getPrismaClient();

  const repProfile = await db.repProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!repProfile) redirect('/workspace');

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Build list of the last 6 months (including current month)
  const periods: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const quotas = await db.repQuota.findMany({
    where: {
      repProfileId: repProfile.id,
      period: { in: periods },
    },
    orderBy: { period: 'desc' },
  });

  const currentQuota = quotas.find((q) => q.period === currentPeriod) ?? null;

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs crumbs={[{ label: 'Quota Tracker' }]} />
          <TVSectionHeader
            description="Track your monthly revenue target, closed won, and pipeline against your quota."
            eyebrow="Rep Tools"
            title="Quota Tracker"
          />
        </div>

        <QuotaWorkspace
          currentPeriod={currentPeriod}
          currentQuota={currentQuota}
          history={quotas}
        />
      </div>
    </main>
  );
}
