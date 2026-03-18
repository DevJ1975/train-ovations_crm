import { DashboardOverview } from '@/components/admin/dashboard-overview';
import { TVSectionHeader } from '@/components/trainovations';
import { requireAdminUser } from '@/lib/auth/server';
import { getDashboardMetrics } from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await requireAdminUser('/admin');
  const metrics = await getDashboardMetrics(user);

  return (
    <div className="space-y-6">
      <TVSectionHeader
        eyebrow="Admin"
        title="CRM dashboard"
        description="Monitor lead volume, ownership, and status movement across the Trainovations CRM."
      />
      <DashboardOverview metrics={metrics} />
    </div>
  );
}
