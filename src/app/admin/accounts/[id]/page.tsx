import { notFound } from 'next/navigation';

import { TVSectionHeader } from '@/components/trainovations';
import { AdminAccountDetail } from '@/components/admin/admin-account-detail';
import { requireAdminUser } from '@/lib/auth/server';
import { getAdminAccountDetail } from '@/lib/services';

export const dynamic = 'force-dynamic';

interface AccountDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAccountDetailPage({ params }: AccountDetailPageProps) {
  const user = await requireAdminUser('/admin/accounts');
  const { id } = await params;

  const account = await getAdminAccountDetail(user, id);
  if (!account) notFound();

  return (
    <div className="space-y-6">
      <TVSectionHeader
        description={`${account.contactCount} contacts · ${account.opportunityCount} opportunities`}
        eyebrow="Account detail"
        title={account.name}
      />
      <AdminAccountDetail account={account} />
    </div>
  );
}
