'use client';

import { TVBadge, TVCard, TVSectionHeader } from '@/components/trainovations';
import { formatCompactCurrency } from '@/lib/format';
import type { RepLeaderboardEntry } from '@/lib/services';

export function AdminLeaderboard({ entries }: { entries: RepLeaderboardEntry[] }) {
  return (
    <div className="space-y-6">
      <TVSectionHeader
        eyebrow="Admin"
        title="Rep Leaderboard"
        description="Performance ranking across all reps"
      />

      {entries.length === 0 ? (
        <TVCard>
          <p className="text-sm text-muted-foreground">No reps found.</p>
        </TVCard>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => {
            const rank = index + 1;
            const isFirst = rank === 1;

            return (
              <TVCard
                key={entry.repProfileId}
                className={isFirst ? 'ring-2 ring-yellow-400/60 ring-offset-2' : undefined}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Rank + Identity */}
                  <div className="flex items-center gap-4">
                    <div
                      className={[
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                        isFirst
                          ? 'bg-yellow-400/20 text-yellow-500'
                          : 'bg-surface-muted text-muted-foreground',
                      ].join(' ')}
                    >
                      #{rank}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-card font-semibold text-foreground">
                          {entry.displayName}
                        </span>
                        {isFirst && (
                          <TVBadge variant="accent">
                            #1
                          </TVBadge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        @{entry.slug}
                      </p>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    <div className="rounded-xl border bg-surface-muted/60 p-3 text-center">
                      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        Closed Won
                      </p>
                      <p className={['mt-1 text-base font-semibold', isFirst ? 'text-yellow-500' : 'text-foreground'].join(' ')}>
                        {formatCompactCurrency(entry.closedWonCents)}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-surface-muted/60 p-3 text-center">
                      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        Pipeline
                      </p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {formatCompactCurrency(entry.pipelineCents)}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-surface-muted/60 p-3 text-center">
                      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        Open Deals
                      </p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {entry.openDeals}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-surface-muted/60 p-3 text-center">
                      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        Total Leads
                      </p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {entry.totalLeads}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-surface-muted/60 p-3 text-center">
                      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        New
                      </p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {entry.newLeads}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-surface-muted/60 p-3 text-center">
                      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        Won Leads
                      </p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {entry.wonLeads}
                      </p>
                    </div>
                  </div>
                </div>
              </TVCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
