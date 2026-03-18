'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { TVBadge, TVButton } from '@/components/trainovations';
import { cn } from '@/lib/utils';
import { getPriorityTone } from '@/lib/format';

type AlertItem = {
  id: string;
  title: string;
  message: string;
  priority: string;
  lead: { firstName: string; lastName: string; company: string | null };
};

export function DismissibleAlertCard({ alert }: { alert: AlertItem }) {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (dismissed) return null;

  const tone = getPriorityTone(alert.priority as never);

  async function dismiss() {
    setLoading(true);
    try {
      await fetch(`/api/workspace/alerts/${alert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
        credentials: 'include',
      });
      setDismissed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn('rounded-[1.5rem] border p-4', tone.panelClassName)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{alert.title}</p>
            <TVBadge className={tone.badgeClassName} variant="default">
              {tone.label}
            </TVBadge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{alert.message}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {alert.lead.firstName} {alert.lead.lastName}
            {alert.lead.company ? ` • ${alert.lead.company}` : ''}
          </p>
        </div>
        <TVButton
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
          disabled={loading}
          size="sm"
          type="button"
          variant="ghost"
          onClick={dismiss}
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Dismiss alert</span>
        </TVButton>
      </div>
    </div>
  );
}
