import Link from 'next/link';
import { LeadsTable } from '@/components/admin/leads-table';
import {
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVInput,
  TVSectionHeader,
} from '@/components/trainovations';
import { requireAdminUser } from '@/lib/auth/server';
import { getLeadsList, getRepProfiles } from '@/lib/services';

export const dynamic = 'force-dynamic';

interface LeadsPageProps {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    rep?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const user = await requireAdminUser('/admin/leads');
  const params = await searchParams;
  const [leads, reps] = await Promise.all([
    getLeadsList(user, {
      search: params?.q,
      status: (params?.status as never) ?? 'all',
      repId: params?.rep ?? 'all',
    }),
    getRepProfiles(user),
  ]);

  return (
    <div className="space-y-6">
      <TVSectionHeader
        eyebrow="Leads"
        title="Lead management"
        description="Review captured leads, search records, and drill into lead details."
      />

      <TVCard className="space-y-4">
        <TVCardTitle>Filters</TVCardTitle>
        <TVCardDescription>
          Search by lead identity, company, or email and narrow results by status or rep.
        </TVCardDescription>
        <form className="grid gap-4 lg:grid-cols-[1.2fr_0.6fr_0.8fr_auto]">
          <TVInput
            defaultValue={params?.q ?? ''}
            name="q"
            placeholder="Search name, company, or email"
          />
          <select
            className="tv-form-select"
            defaultValue={params?.status ?? 'all'}
            name="status"
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          <select
            className="tv-form-select"
            defaultValue={params?.rep ?? 'all'}
            name="rep"
          >
            <option value="all">All reps</option>
            {reps.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.displayName}
              </option>
            ))}
          </select>
          <TVButton type="submit">Apply</TVButton>
        </form>
        {(params?.q || (params?.status && params.status !== 'all') || (params?.rep && params.rep !== 'all')) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filters active</span>
            <Link className="text-primary hover:underline" href="/admin/leads">
              Clear filters
            </Link>
          </div>
        )}
      </TVCard>

      <TVCard className="space-y-4">
        <TVCardTitle>Lead Records</TVCardTitle>
        <TVCardDescription>{leads.length} lead(s) matched the current filter set.</TVCardDescription>
        <LeadsTable leads={leads} />
      </TVCard>
    </div>
  );
}
