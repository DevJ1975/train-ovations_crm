import { notFound, redirect } from 'next/navigation';

import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { RepAccountDetail } from '@/components/workspace/rep-account-detail';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getRepAccountDetail } from '@/lib/services';

export const dynamic = 'force-dynamic';

interface AccountDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const user = await requireAuthenticatedUser('/workspace/accounts');

  if (user.role !== 'sales_rep') redirect('/workspace');

  const { id } = await params;
  const account = await getRepAccountDetail(user.id, id);

  if (!account) notFound();

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs
            crumbs={[
              { label: 'Accounts', href: '/workspace/accounts' },
              { label: account.name },
            ]}
          />
          <TVSectionHeader
            description="Contacts, opportunities, notes, and proposals linked to this account."
            eyebrow="Rep Tools"
            title={account.name}
          />
        </div>

        <RepAccountDetail account={account} />
      </div>
    </main>
  );
}
