import { redirect } from 'next/navigation';

import { ImportLeadsClient } from '@/components/workspace/import-leads-client';
import { TVSectionHeader } from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export default async function ImportLeadsPage() {
  const user = await requireAuthenticatedUser('/workspace/leads/import');

  if (user.role !== 'sales_rep') {
    redirect('/workspace');
  }

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-4xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs
            crumbs={[
              { label: 'Lead inbox', href: '/workspace/leads' },
              { label: 'Import CSV' },
            ]}
          />
          <TVSectionHeader
            eyebrow="Rep Tools"
            title="Import leads from CSV"
            description="Upload a CSV file to bulk-import contacts into your lead inbox. The first row must be a header row with the column names."
          />
        </div>

        <ImportLeadsClient />
      </div>
    </main>
  );
}
