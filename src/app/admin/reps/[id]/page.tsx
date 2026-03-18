import { notFound } from 'next/navigation';

import { TVSectionHeader } from '@/components/trainovations';
import { AdminRepDetail } from '@/components/admin/admin-rep-detail';
import { requireAdminUser } from '@/lib/auth/server';
import { getAdminRepDetail } from '@/lib/services';

export const dynamic = 'force-dynamic';

interface RepDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminRepDetailPage({ params }: RepDetailPageProps) {
  const user = await requireAdminUser('/admin/reps');
  const { id } = await params;

  const rep = await getAdminRepDetail(user, id);
  if (!rep) notFound();

  return (
    <div className="space-y-6">
      <TVSectionHeader
        description={`${rep.email} · ${rep.leadCount} leads · ${rep.accountCount} accounts`}
        eyebrow="Rep detail"
        title={rep.displayName}
      />
      <AdminRepDetail rep={rep} />
    </div>
  );
}
