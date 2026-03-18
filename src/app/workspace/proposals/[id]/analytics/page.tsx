import { notFound, redirect } from 'next/navigation';
import { BarChart2, Eye, Clock, MousePointer, CheckCircle2, FileSignature } from 'lucide-react';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getProposalAnalytics } from '@/lib/services/proposal-engine-service';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { TVSectionHeader } from '@/components/trainovations';

export const dynamic = 'force-dynamic';

export default async function ProposalAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuthenticatedUser('/workspace/proposals');
  if (user.role !== 'sales_rep') redirect('/workspace');

  const { id } = await params;

  let analytics;
  try {
    analytics = await getProposalAnalytics(user.id, id);
  } catch {
    notFound();
  }

  const { proposal, summary, events } = analytics;

  const statCards = [
    { label: 'Total Views', value: summary.viewCount, icon: Eye, color: 'text-blue-500' },
    { label: 'Unique Sessions', value: summary.uniqueSessions, icon: MousePointer, color: 'text-purple-500' },
    { label: 'Package Selections', value: summary.packageSelections, icon: CheckCircle2, color: 'text-green-500' },
    {
      label: 'Time to First View',
      value: summary.timeToViewMinutes != null ? `${summary.timeToViewMinutes}m` : '—',
      icon: Clock,
      color: 'text-yellow-500',
    },
    {
      label: 'Time to Sign',
      value: summary.timeToSignMinutes != null ? `${summary.timeToSignMinutes}m` : '—',
      icon: FileSignature,
      color: 'text-emerald-500',
    },
  ];

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-4xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs
            crumbs={[
              { label: 'Proposals', href: '/workspace/proposals' },
              { label: proposal.title, href: `/workspace/proposals/${id}` },
              { label: 'Analytics' },
            ]}
          />
          <TVSectionHeader
            description="Track how your client is engaging with this proposal."
            eyebrow="Proposal Engine"
            title={`${proposal.title} · Analytics`}
          />
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-border bg-white p-4 text-center shadow-sm">
              <Icon className={`mx-auto mb-1 ${color}`} size={20} />
              <p className="text-2xl font-bold">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Event timeline */}
        <div className="rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-border p-4">
            <BarChart2 size={16} className="text-muted-foreground" />
            <h2 className="font-semibold">Event Timeline</h2>
          </div>
          {events.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No events recorded yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {events.slice(0, 50).map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3">
                  <span className="mt-0.5 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                    {event.eventType.replace(/_/g, ' ')}
                  </span>
                  <span className="flex-1 text-xs text-muted-foreground">
                    {event.metadata ? JSON.stringify(event.metadata) : ''}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(event.occurredAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
