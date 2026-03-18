'use client';

import { useEffect, useState } from 'react';

import {
  formatTimeForZone,
  getTimeDifferenceLabel,
  resolveLocationTimeZone,
} from '@/lib/timezones/location-time';
import { cn } from '@/lib/utils';

export function LeadTimeContext({
  repLocation,
  leadLocation,
  compact = false,
}: {
  repLocation: string | null | undefined;
  leadLocation: string | null | undefined;
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const resolvedLead = resolveLocationTimeZone(leadLocation);
  const resolvedRep = resolveLocationTimeZone(repLocation);

  if (!leadLocation?.trim()) {
    return (
      <div
        aria-label="Lead time comparison unavailable"
        className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}
      >
        Lead location not captured yet.
      </div>
    );
  }

  if (!resolvedLead) {
    return (
      <div
        aria-label="Lead time comparison unavailable"
        className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}
      >
        {leadLocation} • timezone unavailable
      </div>
    );
  }

  const leadTime = formatTimeForZone(now, resolvedLead.timeZone);
  const repTime = resolvedRep ? formatTimeForZone(now, resolvedRep.timeZone) : null;
  const differenceLabel =
    resolvedRep && repTime
      ? getTimeDifferenceLabel(resolvedRep.timeZone, resolvedLead.timeZone, now)
      : null;

  if (compact) {
    return (
      <div aria-label="Lead time comparison" className="space-y-1 text-xs">
        <p className="text-foreground">
          {leadLocation} • {leadTime.time} {leadTime.zone}
        </p>
        {repTime && repLocation ? (
          <p className="text-muted-foreground">
            Rep: {repTime.time} {repTime.zone}
            {differenceLabel ? ` • ${differenceLabel}` : ''}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div aria-label="Lead time comparison" className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border bg-white/70 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Lead local time</p>
        <p className="mt-2 text-sm font-medium text-foreground">
          {leadTime.time} {leadTime.zone}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{leadLocation}</p>
      </div>
      <div className="rounded-xl border bg-white/70 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Rep comparison</p>
        {repTime && repLocation ? (
          <>
            <p className="mt-2 text-sm font-medium text-foreground">
              {repTime.time} {repTime.zone}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{repLocation}</p>
            {differenceLabel ? (
              <p className="mt-3 text-sm text-foreground">Lead is {differenceLabel} compared to the rep.</p>
            ) : null}
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Rep location is not available for comparison.
          </p>
        )}
      </div>
    </div>
  );
}
