'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleAlert, Mail, Sparkles } from 'lucide-react';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
} from '@/components/trainovations';
import type { WorkspaceAlertItem } from '@/lib/query/workspace-hooks';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

function getPriorityClasses(priority: string) {
  const normalized = priority.toLowerCase();

  if (normalized === 'urgent') {
    return 'border-danger/25 bg-danger/5';
  }

  if (normalized === 'high') {
    return 'border-accent/25 bg-accent/5';
  }

  return 'border-primary/20 bg-primary/5';
}

export function RepAlerts({
  alerts,
  onStatusChange,
}: {
  alerts: WorkspaceAlertItem[];
  onStatusChange?: (alertId: string, status: 'dismissed' | 'resolved') => Promise<void>;
}) {
  const [pendingAlertId, setPendingAlertId] = useState<string | null>(null);
  const openAlerts = alerts.filter((alert) => alert.status === 'open');

  async function handleStatusChange(alertId: string, status: 'dismissed' | 'resolved') {
    if (!onStatusChange) {
      return;
    }

    setPendingAlertId(alertId);
    try {
      await onStatusChange(alertId, status);
    } finally {
      setPendingAlertId(null);
    }
  }

  return (
    <div className="space-y-4">
      <TVCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <TVCardTitle>Alert queue</TVCardTitle>
            <TVCardDescription>
              Review relationship and career-movement signals without leaving the rep workspace.
            </TVCardDescription>
          </div>
          <TVBadge variant="accent">{openAlerts.length} open</TVBadge>
        </div>
      </TVCard>

      {alerts.length ? (
        alerts.map((alert) => {
          const leadName = `${alert.lead.firstName} ${alert.lead.lastName}`;
          const isPending = pendingAlertId === alert.id;

          return (
            <TVCard
              key={alert.id}
              className={`space-y-4 border ${getPriorityClasses(alert.priority)}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <TVBadge variant={alert.status === 'open' ? 'accent' : 'default'}>
                      {alert.status.replace('_', ' ')}
                    </TVBadge>
                    <TVBadge variant="primary">{alert.priority}</TVBadge>
                  </div>
                  <TVCardTitle>{alert.title}</TVCardTitle>
                  <TVCardDescription>
                    Triggered {formatDate(new Date(alert.triggeredAt))}
                  </TVCardDescription>
                </div>
                <CircleAlert className="h-5 w-5 text-primary" />
              </div>

              <div className="space-y-3 rounded-2xl border bg-white/70 p-4">
                <p className="text-sm text-foreground">{alert.message}</p>
                <div className="text-sm text-muted-foreground">
                  <p>
                    Contact: {leadName} {alert.lead.company ? `• ${alert.lead.company}` : ''}
                  </p>
                  <p>{alert.lead.email}</p>
                </div>
                {alert.suggestedNextStep ? (
                  <div className="rounded-xl border bg-surface-muted/70 p-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">Suggested next step</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {alert.suggestedNextStep}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <TVButton asChild size="sm" variant="secondary">
                  <Link href={`/workspace/leads/${alert.lead.id}`}>Open lead</Link>
                </TVButton>
                <TVButton asChild size="sm" variant="secondary">
                  <Link href={`mailto:${alert.lead.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email contact
                  </Link>
                </TVButton>
                {alert.status === 'open' ? (
                  <>
                    <TVButton
                      disabled={isPending}
                      onClick={() => handleStatusChange(alert.id, 'resolved')}
                      size="sm"
                    >
                      {isPending ? 'Saving...' : 'Mark resolved'}
                    </TVButton>
                    <TVButton
                      disabled={isPending}
                      onClick={() => handleStatusChange(alert.id, 'dismissed')}
                      size="sm"
                      variant="ghost"
                    >
                      Dismiss
                    </TVButton>
                  </>
                ) : null}
              </div>
            </TVCard>
          );
        })
      ) : (
        <TVCard>
          <TVCardDescription>No relationship alerts are assigned to this rep right now.</TVCardDescription>
        </TVCard>
      )}
    </div>
  );
}
