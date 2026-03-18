import { OpportunityList } from '@/components/admin/opportunity-list';
import { TVSectionHeader } from '@/components/trainovations';
import { requireAdminUser } from '@/lib/auth/server';
import { getOpportunitiesList } from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage() {
  const user = await requireAdminUser('/admin/opportunities');
  const opportunities = await getOpportunitiesList(user);

  return (
    <div className="space-y-6">
      <TVSectionHeader
        eyebrow="Opportunities"
        title="Pipeline management"
        description="Track open revenue motion by account, stage, owner, and linked contact."
      />
      <OpportunityList opportunities={opportunities} />
    </div>
  );
}
