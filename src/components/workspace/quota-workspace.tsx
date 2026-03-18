'use client';

import React, { useState, useTransition } from 'react';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVInput,
  TVSectionHeader,
} from '@/components/trainovations';
import { formatCompactCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

type RepQuota = {
  id: string;
  repProfileId: string;
  period: string;
  targetCents: number;
  closedCents: number;
  pipelineCents: number;
  createdAt: Date;
  updatedAt: Date;
};

type Props = {
  currentPeriod: string;
  currentQuota: RepQuota | null;
  history: RepQuota[];
};

function attainmentColor(pct: number) {
  if (pct >= 100) return 'bg-success/15 text-success';
  if (pct >= 50) return 'bg-accent/15 text-accent';
  return 'bg-danger/15 text-danger';
}

function formatPeriodLabel(period: string) {
  const [year, month] = period.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function QuotaWorkspace({ currentPeriod, currentQuota, history }: Props) {
  const [quota, setQuota] = useState<RepQuota | null>(currentQuota);
  const [showForm, setShowForm] = useState(!currentQuota);
  const [targetInput, setTargetInput] = useState(
    currentQuota ? String(currentQuota.targetCents / 100) : '',
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const closedPct = quota && quota.targetCents > 0
    ? Math.round((quota.closedCents / quota.targetCents) * 100)
    : 0;

  const progressBarWidth = Math.min(closedPct, 100);

  function handleSetTarget() {
    const dollars = parseFloat(targetInput);
    if (isNaN(dollars) || dollars <= 0) {
      setError('Please enter a valid dollar amount greater than 0.');
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/workspace/quota', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ period: currentPeriod, targetCents: Math.round(dollars * 100) }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError((data as { error?: string }).error ?? 'Failed to save target.');
          return;
        }

        const data = await res.json() as { quota: RepQuota };
        setQuota(data.quota);
        setShowForm(false);
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Current month card */}
      <TVCard className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <TVCardTitle>Current Month — {formatPeriodLabel(currentPeriod)}</TVCardTitle>
            <TVCardDescription className="mt-1">
              Your revenue target and attainment for the current quota period.
            </TVCardDescription>
          </div>

          {!showForm && (
            <TVButton
              size="sm"
              variant="secondary"
              onClick={() => {
                setTargetInput(quota ? String(quota.targetCents / 100) : '');
                setShowForm(true);
              }}
            >
              {quota ? 'Update Target' : 'Set Target'}
            </TVButton>
          )}
        </div>

        {showForm && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
            <p className="text-sm font-medium text-foreground">
              {quota ? 'Update monthly target' : 'Set monthly target'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="targetInput">
                  Target amount (USD)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">
                    $
                  </span>
                  <TVInput
                    id="targetInput"
                    className="pl-7"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="e.g. 50000"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSetTarget(); }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <TVButton
                  className="w-full sm:w-auto"
                  disabled={isPending}
                  onClick={handleSetTarget}
                >
                  {isPending ? 'Saving…' : 'Save Target'}
                </TVButton>
                {quota && (
                  <TVButton
                    className="w-full sm:w-auto"
                    variant="ghost"
                    onClick={() => {
                      setShowForm(false);
                      setError(null);
                    }}
                  >
                    Cancel
                  </TVButton>
                )}
              </div>
            </div>
            {error && (
              <p className="text-sm text-danger">{error}</p>
            )}
          </div>
        )}

        {quota ? (
          <div className="space-y-5">
            {/* Stat row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border bg-surface-muted/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Target</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {formatCompactCurrency(quota.targetCents)}
                </p>
              </div>
              <div className="rounded-2xl border bg-surface-muted/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Closed Won</p>
                <p className="mt-2 text-2xl font-semibold text-success">
                  {formatCompactCurrency(quota.closedCents)}
                </p>
              </div>
              <div className="rounded-2xl border bg-surface-muted/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pipeline</p>
                <p className="mt-2 text-2xl font-semibold text-primary">
                  {formatCompactCurrency(quota.pipelineCents)}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Attainment</p>
                <TVBadge className={attainmentColor(closedPct)} variant="default">
                  {closedPct}%
                </TVBadge>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-muted border">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    closedPct >= 100
                      ? 'bg-success'
                      : closedPct >= 50
                      ? 'bg-accent'
                      : 'bg-danger',
                  )}
                  style={{ width: `${progressBarWidth}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCompactCurrency(quota.closedCents)} closed of{' '}
                {formatCompactCurrency(quota.targetCents)} target
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed bg-surface-muted/60 px-4 py-6 text-sm text-muted-foreground">
            No target set for {formatPeriodLabel(currentPeriod)}. Use the button above to set a monthly quota target.
          </div>
        )}
      </TVCard>

      {/* Last 6 months history */}
      <TVCard className="space-y-5">
        <div>
          <TVCardTitle>Quota History</TVCardTitle>
          <TVCardDescription className="mt-1">
            Your attainment over the last 6 months.
          </TVCardDescription>
        </div>

        {history.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed bg-surface-muted/60 px-4 py-6 text-sm text-muted-foreground">
            No quota history yet. Set a target for the current month to start tracking.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Period
                  </th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Target
                  </th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Closed Won
                  </th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Pipeline
                  </th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Attainment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {history.map((q) => {
                  const pct = q.targetCents > 0
                    ? Math.round((q.closedCents / q.targetCents) * 100)
                    : 0;
                  return (
                    <tr key={q.id} className="group">
                      <td className="py-3 pr-4 text-foreground font-medium">
                        {formatPeriodLabel(q.period)}
                        {q.period === currentPeriod && (
                          <TVBadge className="ml-2 bg-primary/10 text-primary text-[10px] py-0.5" variant="default">
                            current
                          </TVBadge>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right text-muted-foreground tabular-nums">
                        {formatCompactCurrency(q.targetCents)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-success font-medium">
                        {formatCompactCurrency(q.closedCents)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-primary">
                        {formatCompactCurrency(q.pipelineCents)}
                      </td>
                      <td className="py-3 text-right">
                        <TVBadge className={cn('ml-auto', attainmentColor(pct))} variant="default">
                          {pct}%
                        </TVBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TVCard>
    </div>
  );
}
