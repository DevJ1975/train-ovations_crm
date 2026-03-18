import { AccountList } from '@/components/admin/account-list';
import { TVSectionHeader } from '@/components/trainovations';
import { requireAdminUser } from '@/lib/auth/server';
import { getAccountsList } from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const user = await requireAdminUser('/admin/accounts');
  const accounts = await getAccountsList(user);

  return (
    <div className="space-y-6">
      <TVSectionHeader
        eyebrow="Accounts"
        title="Account management"
        description="Review company-level ownership, linked contacts, and early pipeline context."
      />
      <AccountList accounts={accounts} />
    </div>
  );
}
