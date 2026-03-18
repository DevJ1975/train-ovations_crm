import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CircleDot,
  Shield,
  TrendingUp,
  UserSquare2,
  Users,
} from 'lucide-react';

import {
  TVBadge,
  TVCard,
  TVCardDescription,
  TVCardTitle,
} from '@/components/trainovations';
import type { DashboardMetrics } from '@/lib/services';

import { AdminDashboardCharts } from './admin-dashboard-charts';
import { formatCurrency, formatCompactCurrency } from '@/lib/format';

function MetricCard({
  icon: Icon,
  title,
  value,
  description,
  href,
}: {
  icon: typeof Users;
  title: string;
  value: string | number;
  description: string;
  href: string;
}) {
  return (
    <Link className="block" href={href}>
      <TVCard className="space-y-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        <div className="flex items-center justify-between">
          <TVBadge variant="primary">{title}</TVBadge>
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-3xl font-semibold text-foreground">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
      </TVCard>
    </Link>
  );
}

export function DashboardOverview({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <TVCard className="space-y-4 rounded-[2rem] border-border/70 bg-surface">
          <div className="flex items-center justify-between gap-3">
            <div>
              <TVCardTitle>Global sales dashboard</TVCardTitle>
              <TVCardDescription>
                Revenue health, conversion, forecast, and rep execution rolled up into one manager view.
              </TVCardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border bg-surface-muted/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Open pipeline</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatCompactCurrency(metrics.pipelineValueCents)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Current open revenue across all non-closed stages.</p>
            </div>
            <div className="rounded-xl border bg-surface-muted/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Weighted forecast</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatCompactCurrency(metrics.weightedForecastValueCents)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Stage-weighted revenue expected to land.</p>
            </div>
            <div className="rounded-xl border bg-surface-muted/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Win rate</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{metrics.winRatePercent}%</p>
              <p className="mt-2 text-sm text-muted-foreground">Closed won versus all closed opportunities.</p>
            </div>
            <div className="rounded-xl border bg-surface-muted/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Avg sales cycle</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{metrics.averageSalesCycleDays} days</p>
              <p className="mt-2 text-sm text-muted-foreground">Average time to close won opportunities.</p>
            </div>
          </div>
        </TVCard>

        <TVCard className="space-y-4 rounded-[2rem] border-border/70 bg-surface">
          <div className="flex items-center justify-between">
            <TVCardTitle>Admin quick actions</TVCardTitle>
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-3">
            <Link
              className="flex items-center justify-between rounded-lg border bg-surface-muted px-4 py-3 text-sm text-foreground transition-colors hover:border-primary hover:bg-surface"
              href="/admin/leads?status=new"
            >
              <span className="truncate">Review new leads</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
            </Link>
            <Link
              className="flex items-center justify-between rounded-lg border bg-surface-muted px-4 py-3 text-sm text-foreground transition-colors hover:border-primary hover:bg-surface"
              href="/admin/reps"
            >
              <span className="truncate">Manage reps</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
            </Link>
            <Link
              className="flex items-center justify-between rounded-lg border bg-surface-muted px-4 py-3 text-sm text-foreground transition-colors hover:border-primary hover:bg-surface"
              href="/admin/opportunities"
            >
              <span className="truncate">Review pipeline</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-surface-muted px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Active reps</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{metrics.activeReps}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {metrics.recentlyActiveReps} logged in within the last 7 days.
              </p>
            </div>
            <div className="rounded-lg border bg-surface-muted px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pending invites</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{metrics.pendingInvites}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Reps invited but not yet fully activated.
              </p>
            </div>
          </div>
        </TVCard>
      </div>

      <div className="tv-stagger grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          title="Total Leads"
          value={metrics.totalLeads}
          description="All lead records captured in the CRM."
          href="/admin/leads"
        />
        <MetricCard
          icon={BarChart3}
          title="Recent Leads"
          value={metrics.recentLeads}
          description="New leads created in the last 7 days."
          href="/admin/leads?status=new"
        />
        <MetricCard
          icon={UserSquare2}
          title="Total Accounts"
          value={metrics.totalAccounts}
          description="Tracked customer and prospect accounts in the CRM."
          href="/admin/accounts"
        />
        <MetricCard
          icon={BriefcaseBusiness}
          title="Open Opportunities"
          value={metrics.openOpportunities}
          description="Pipeline records that have not been closed won or lost."
          href="/admin/opportunities"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <TVCard className="space-y-4 rounded-[2rem] border-border/70 bg-surface">
          <div className="flex items-center justify-between gap-3">
            <div>
              <TVCardTitle>Forecast and pipeline health</TVCardTitle>
              <TVCardDescription>
                Professional CRM-style forecast rollup by stage with weighted revenue and pipeline risk.
              </TVCardDescription>
            </div>
            <CircleDot className="h-5 w-5 text-primary" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-surface-muted/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Closed won revenue</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatCompactCurrency(metrics.closedWonValueCents)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Historical won revenue in current scoped data.</p>
            </div>
            <div className="rounded-xl border bg-surface-muted/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Average open deal size</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatCompactCurrency(metrics.averageOpenDealSizeCents)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Average size of active pipeline opportunities.</p>
            </div>
            <div className="rounded-xl border bg-surface-muted/60 p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pipeline risk</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{metrics.overdueOpenOpportunities}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Open opportunities with a target close date already behind today.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {metrics.forecastByStage.map((entry) => (
              <div key={entry.stage} className="rounded-xl border bg-surface-muted/45 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="truncate text-sm font-medium capitalize text-foreground">
                      {entry.stage.replace('_', ' ')}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.opportunityCount} opportunities
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{formatCurrency(entry.amountCents)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Weighted {formatCurrency(entry.weightedAmountCents)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TVCard>

        <div className="space-y-6">
          <TVCard className="space-y-4 rounded-[2rem] border-border/70 bg-surface">
            <TVCardTitle>Leads by rep</TVCardTitle>
            <TVCardDescription>
              Quick ownership view across the sales team.
            </TVCardDescription>
            <div className="space-y-3">
              {metrics.leadsByRep.map((entry) => (
                <Link
                  key={`${entry.repId ?? 'unassigned'}-${entry.repName}`}
                  className="flex items-center justify-between rounded-lg border bg-surface-muted px-4 py-3 transition-colors hover:border-primary hover:bg-surface"
                  href={entry.repId ? `/admin/leads?rep=${entry.repId}` : '/admin/leads'}
                >
                  <span className="text-sm text-foreground">{entry.repName}</span>
                  <TVBadge>{entry.count}</TVBadge>
                </Link>
              ))}
            </div>
          </TVCard>

          <TVCard className="space-y-4 rounded-[2rem] border-border/70 bg-surface">
            <TVCardTitle>Leads by status</TVCardTitle>
            <TVCardDescription>
              Qualification progress across the current CRM scope.
            </TVCardDescription>
            <div className="space-y-3">
              {metrics.leadsByStatus.map((entry) => (
                <Link
                  key={entry.status}
                  className="flex items-center justify-between rounded-lg border bg-surface-muted px-4 py-3 transition-colors hover:border-primary hover:bg-surface"
                  href={`/admin/leads?status=${entry.status}`}
                >
                  <span className="text-sm capitalize text-foreground">
                    {entry.status.replace('_', ' ')}
                  </span>
                  <TVBadge variant="accent">{entry.count}</TVBadge>
                </Link>
              ))}
            </div>
          </TVCard>
        </div>
      </div>

      <TVCard className="space-y-5 rounded-[2rem] border-border/70 bg-surface">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <TVCardTitle>Sales visuals and infographics</TVCardTitle>
            <TVCardDescription>
              Graphical forecasting, stage mix, and rep comparison to make the admin dashboard feel like a true CRM analytics surface.
            </TVCardDescription>
          </div>
          <TVBadge className="bg-primary/10 text-primary" variant="default">
            Visual analytics
          </TVBadge>
        </div>

        <AdminDashboardCharts
          forecastByStage={metrics.forecastByStage}
          leadsByStatus={metrics.leadsByStatus}
          pipelineValueCents={metrics.pipelineValueCents}
          repPerformance={metrics.repPerformance}
          weightedForecastValueCents={metrics.weightedForecastValueCents}
        />
      </TVCard>

      <TVCard className="space-y-5 rounded-[2rem] border-border/70 bg-surface">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <TVCardTitle>Rep performance dashboards</TVCardTitle>
            <TVCardDescription>
              Salesforce-style per-rep scorecards for pipeline ownership, conversion, execution, and forecast confidence.
            </TVCardDescription>
          </div>
          <TVBadge className="bg-primary/10 text-primary" variant="default">
            {metrics.repPerformance.length} reps
          </TVBadge>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {metrics.repPerformance.map((rep) => (
            <div key={rep.repId} className="rounded-[1.5rem] border bg-surface-muted/45 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{rep.repName}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {rep.lastLoginAt
                      ? `Last login ${rep.lastLoginAt.toLocaleDateString()}`
                      : rep.inviteStatus === 'pending'
                        ? 'Invite pending'
                        : 'No login activity yet'}
                  </p>
                </div>
                <TVBadge variant={rep.inviteStatus === 'accepted' ? 'success' : 'accent'}>
                  {rep.inviteStatus === 'accepted'
                    ? 'Active'
                    : rep.inviteStatus === 'pending'
                      ? 'Pending invite'
                      : 'Not invited'}
                </TVBadge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl border bg-surface-muted/60 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Leads</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{rep.leadsOwned}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{rep.newLeadsLast30Days} new in 30d</p>
                </div>
                <div className="rounded-xl border bg-surface-muted/60 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Qualified</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{rep.qualifiedLeads}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Moved beyond early stage</p>
                </div>
                <div className="rounded-xl border bg-surface-muted/60 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Accounts</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{rep.accountsOwned}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Owned account coverage</p>
                </div>
                <div className="rounded-xl border bg-surface-muted/60 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Open opps</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{rep.openOpportunities}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Avg {formatCompactCurrency(rep.averageDealSizeCents)}
                  </p>
                </div>
                <div className="rounded-xl border bg-surface-muted/60 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pipeline</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">
                    {formatCompactCurrency(rep.pipelineValueCents)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Weighted {formatCompactCurrency(rep.weightedForecastValueCents)}
                  </p>
                </div>
                <div className="rounded-xl border bg-surface-muted/60 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Closed won</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{rep.winRatePercent}%</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatCompactCurrency(rep.closedWonValueCents)} won
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </TVCard>
    </div>
  );
}
