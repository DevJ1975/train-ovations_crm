import Link from 'next/link';
import { UserRound } from 'lucide-react';

import {
  TVBadge,
  TVCard,
  TVCardDescription,
  TVCardTitle,
} from '@/components/trainovations';

interface LeadMapPoint {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  location: string;
  x: number;
  y: number;
}

function Marker({
  lead,
  stackedCount,
}: {
  lead: LeadMapPoint;
  stackedCount: number;
}) {
  return (
    <Link
      aria-label={`Open ${lead.firstName} ${lead.lastName} from ${lead.location}`}
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      href={`/workspace/leads/${lead.id}`}
      style={{ left: `${lead.x}%`, top: `${lead.y}%` }}
      title={`${lead.firstName} ${lead.lastName}${lead.company ? ` • ${lead.company}` : ''} • ${lead.location}`}
    >
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-white text-primary shadow-md transition-transform group-hover:scale-110 group-hover:border-primary">
        <UserRound className="h-4 w-4" />
        {stackedCount > 1 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
            {stackedCount}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function UsLeadMapCard({ leads }: { leads: LeadMapPoint[] }) {
  const groupedLeads = new Map<string, LeadMapPoint[]>();

  leads.forEach((lead) => {
    const key = `${lead.x}-${lead.y}`;
    const existing = groupedLeads.get(key) ?? [];
    existing.push(lead);
    groupedLeads.set(key, existing);
  });

  const markers = Array.from(groupedLeads.values()).map((group) => ({
    lead: group[0],
    stackedCount: group.length,
  }));

  return (
    <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
      <div className="flex items-center justify-between gap-3">
        <div>
          <TVCardTitle>Lead coverage map</TVCardTitle>
          <TVCardDescription>
            See where your leads are located across the U.S. and jump straight into the record from the map.
          </TVCardDescription>
        </div>
        <TVBadge className="bg-primary/10 text-primary" variant="default">
          {leads.length}
        </TVBadge>
      </div>

      <div className="rounded-[1.75rem] border bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_48%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(244,247,252,0.96))] p-4">
        <div className="relative overflow-hidden rounded-[1.5rem] border bg-slate-50/80 px-4 py-6">
          <svg
            aria-hidden="true"
            className="h-auto w-full text-slate-300"
            viewBox="0 0 960 560"
          >
            <path
              d="M113 162l34-24 48 8 36-22 60 10 33-12 39 8 53-17 51 17 49-14 65 13 52 29 33 40 44 11 35 30-8 31-29 22-9 49 25 36-14 27-36 23-24 42-57 16-58 30-49 3-44 37-61-8-22-24-55 5-44-29-37-9-26-41-45-11-18-37-39-36-8-56 25-44-8-41 28-34 42-8 21-22z"
              fill="currentColor"
            />
          </svg>

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:44px_44px]" />

          {markers.map(({ lead, stackedCount }) => (
            <Marker key={`${lead.id}-${lead.x}-${lead.y}`} lead={lead} stackedCount={stackedCount} />
          ))}

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Markers are based on captured lead locations.</span>
            <span>Click any person icon to open the lead.</span>
          </div>
        </div>
      </div>

      {leads.length ? (
        <div className="flex flex-wrap gap-2">
          {leads.slice(0, 6).map((lead) => (
            <Link
              key={lead.id}
              className="rounded-full border bg-surface-muted px-3 py-1 text-xs text-foreground transition-colors hover:border-primary/30 hover:text-primary"
              href={`/workspace/leads/${lead.id}`}
            >
              {lead.firstName} {lead.lastName} • {lead.location}
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed bg-surface-muted/60 px-4 py-6 text-sm text-muted-foreground">
          Add lead locations to see geographic coverage here.
        </div>
      )}
    </TVCard>
  );
}
