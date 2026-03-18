import Link from 'next/link';
import {
  Activity,
  BarChart2,
  BookOpen,
  Building2,
  CalendarCheck,
  CheckSquare,
  FileText,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

import {
  TVBadge,
  TVCard,
  TVCardDescription,
  TVCardTitle,
} from '@/components/trainovations';
import {
  formatCompactCurrency,
  formatDate,
  formatPercent,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
  ActivityTimelineItem,
  RepAnalytics,
  RepConversionFunnel,
} from '@/lib/services/analytics-service';

// ─── Activity type config ─────────────────────────────────────────────────────

const ACTIVITY_TYPE_CONFIG: Record<
  ActivityTimelineItem['type'],
  { label: string; dotClassName: string }
> = {
  note_created: { label: 'Note', dotClassName: 'bg-primary/60' },
  proposal_created: { label: 'Proposal', dotClassName: 'bg-primary/60' },
  proposal_sent: { label: 'Sent', dotClassName: 'bg-success/70' },
  proposal_accepted: { label: 'Accepted', dotClassName: 'bg-success' },
  lead_status_change: { label: 'Status', dotClassName: 'bg-accent/70' },
  meeting_completed: { label: 'Meeting', dotClassName: 'bg-success/70' },
  task_completed: { label: 'Task', dotClassName: 'bg-muted-foreground/50' },
  opportunity_won: { label: 'Won', dotClassName: 'bg-success' },
  opportunity_lost: { label: 'Lost', dotClassName: 'bg-destructive/60' },
};

// ─── KPI Tile ─────────────────────────────────────────────────────────────────

function KpiTile({
  title,
  value,
  sub,
  accentClassName,
  icon: Icon,
}: {
  title: string;
  value: string;
  sub?: string;
  accentClassName: string;
  icon: typeof Users;
}) {
  return (
    <div className={cn('rounded-2xl border p-5', accentClassName)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </p>
        <Icon className="h-4 w-4 text-current opacity-50" />
      </div>
      <p className="mt-3 text-3xl font-semibold leading-none text-foreground">{value}</p>
      {sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Stage bar ────────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  prospecting: 'Prospecting',
  discovery: 'Discovery',
  demo: 'Demo',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Won',
  closed_lost: 'Lost',
};

// ─── Trend bar ────────────────────────────────────────────────────────────────

function TrendBars({ trend }: { trend: RepAnalytics['monthlyTrend'] }) {
  const maxVal = Math.max(...trend.map((m) => m.closedWonCents), 1);
  return (
    <div className="flex items-end gap-2 pt-2" style={{ height: 80 }}>
      {trend.map((m) => {
        const pct = Math.max((m.closedWonCents / maxVal) * 100, m.count > 0 ? 8 : 0);
        return (
          <div key={`${m.month}-${m.year}`} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-lg bg-primary/70 transition-all"
              style={{ height: `${pct}%` }}
              title={`${m.month} ${m.year}: ${formatCompactCurrency(m.closedWonCents)}`}
            />
            <span className="text-[10px] text-muted-foreground">{m.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RepAnalyticsDashboardProps {
  analytics: RepAnalytics | null;
  timeline: ActivityTimelineItem[];
  funnel: RepConversionFunnel | null;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function RepAnalyticsDashboard({
  analytics,
  timeline,
  funnel,
}: RepAnalyticsDashboardProps) {
  if (!analytics) {
    return (
      <div className="rounded-2xl border border-dashed bg-surface-muted/60 px-6 py-10 text-center text-sm text-muted-foreground">
        No rep profile found. Analytics will appear here once your profile is fully set up.
      </div>
    );
  }

  const momDelta = analytics.closedWonLastMonthCents > 0
    ? ((analytics.closedWonThisMonthCents - analytics.closedWonLastMonthCents) /
        analytics.closedWonLastMonthCents) *
      100
    : null;

  const maxStageCount = Math.max(...analytics.dealsByStage.map((s) => s.count), 1);

  return (
    <div className="space-y-6">

      {/* ── KPI row ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          accentClassName="border-primary/20 bg-primary/5 text-primary"
          icon={TrendingUp}
          title="Open pipeline"
          value={formatCompactCurrency(analytics.openPipelineValueCents)}
          sub={`${analytics.openDealCount} active ${analytics.openDealCount === 1 ? 'deal' : 'deals'}`}
        />
        <KpiTile
          accentClassName="border-success/25 bg-success/5 text-success"
          icon={Zap}
          title="Win rate"
          value={formatPercent(analytics.winRate)}
          sub={`${analytics.totalOpportunities} total opportunities`}
        />
        <KpiTile
          accentClassName="border-border bg-white text-foreground"
          icon={BarChart2}
          title="Avg deal size"
          value={formatCompactCurrency(analytics.avgDealSizeCents)}
          sub="Closed-won average"
        />
        <KpiTile
          accentClassName="border-accent/25 bg-accent/5 text-accent"
          icon={Users}
          title="Total leads"
          value={String(analytics.totalLeads)}
          sub={`${analytics.newLeadsThisMonth} new this month`}
        />
      </div>

      {/* ── Middle grid: Pipeline breakdown + Monthly trend ── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">

        {/* Pipeline by stage */}
        <TVCard className="space-y-5 rounded-[2rem] border-white/60 bg-white/90">
          <div>
            <TVCardTitle>Pipeline by stage</TVCardTitle>
            <TVCardDescription>Deal count and value across all open and closed stages.</TVCardDescription>
          </div>
          {analytics.dealsByStage.length > 0 ? (
            <div className="space-y-3">
              {analytics.dealsByStage.map((stage) => (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">
                      {STAGE_LABELS[stage.stage] ?? stage.stage}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {stage.count} · {formatCompactCurrency(stage.valueCents)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        stage.stage === 'closed_won'
                          ? 'bg-success/70'
                          : stage.stage === 'closed_lost'
                            ? 'bg-destructive/40'
                            : 'bg-primary/60',
                      )}
                      style={{ width: `${(stage.count / maxStageCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No opportunity data yet.</p>
          )}
        </TVCard>

        {/* Monthly trend */}
        <TVCard className="space-y-5 rounded-[2rem] border-white/60 bg-white/90">
          <div className="flex items-start justify-between gap-4">
            <div>
              <TVCardTitle>Monthly closed-won</TVCardTitle>
              <TVCardDescription>Revenue closed over the last 6 months.</TVCardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-foreground">
                {formatCompactCurrency(analytics.closedWonThisMonthCents)}
              </p>
              <p className="text-xs text-muted-foreground">This month</p>
              {momDelta !== null && (
                <p className={cn('mt-1 text-xs font-medium', momDelta >= 0 ? 'text-success' : 'text-destructive')}>
                  {momDelta >= 0 ? '+' : ''}{Math.round(momDelta)}% vs last month
                </p>
              )}
            </div>
          </div>
          <TrendBars trend={analytics.monthlyTrend} />
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="rounded-xl border bg-surface-muted/60 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">This month</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatCompactCurrency(analytics.closedWonThisMonthCents)}
              </p>
            </div>
            <div className="rounded-xl border bg-surface-muted/60 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Last month</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatCompactCurrency(analytics.closedWonLastMonthCents)}
              </p>
            </div>
            <div className="rounded-xl border bg-surface-muted/60 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">All time</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatCompactCurrency(analytics.closedWonAllTimeCents)}
              </p>
            </div>
          </div>
        </TVCard>
      </div>

      {/* ── Activity summary + Account stats ── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">

        {/* Activity last 30 days */}
        <TVCard className="space-y-5 rounded-[2rem] border-white/60 bg-white/90">
          <div>
            <TVCardTitle>Activity (last 30 days)</TVCardTitle>
            <TVCardDescription>Rep activity across notes, proposals, meetings, and tasks.</TVCardDescription>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Notes', value: analytics.notesLast30Days, icon: BookOpen, href: '/workspace/notes' },
              { label: 'Proposals sent', value: analytics.proposalsSentLast30Days, icon: FileText, href: '/workspace/proposals' },
              { label: 'Meetings', value: analytics.meetingsLast30Days, icon: CalendarCheck, href: '/workspace/calendar' },
              { label: 'Tasks done', value: analytics.tasksCompletedLast30Days, icon: CheckSquare, href: '/workspace/tasks' },
              { label: 'Proposals created', value: analytics.proposalsCreatedLast30Days, icon: FileText, href: '/workspace/proposals' },
              { label: 'Active accounts', value: analytics.activeAccountCount, icon: Building2, href: '/workspace/accounts' },
            ].map(({ label, value, icon: Icon, href }) => (
              <Link
                key={label}
                className="group rounded-xl border bg-surface-muted/60 p-4 transition-all hover:border-primary/20 hover:bg-white"
                href={href}
              >
                <Icon className="h-4 w-4 text-primary opacity-70 transition-transform group-hover:scale-110" />
                <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </Link>
            ))}
          </div>
        </TVCard>

        {/* Conversion funnel */}
        <TVCard className="space-y-5 rounded-[2rem] border-white/60 bg-white/90">
          <div>
            <TVCardTitle>Lead conversion funnel</TVCardTitle>
            <TVCardDescription>
              Cumulative reach through each stage.{' '}
              {funnel && (
                <span className="font-medium text-foreground">
                  Overall win rate: {formatPercent(funnel.overallWinRate)}
                </span>
              )}
            </TVCardDescription>
          </div>
          {funnel && funnel.totalEntered > 0 ? (
            <div className="space-y-3">
              {funnel.stages.map((stage) => {
                const pct = funnel.totalEntered > 0 ? (stage.count / funnel.totalEntered) * 100 : 0;
                return (
                  <div key={stage.status} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-foreground">{stage.label}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {stage.count}
                        {stage.conversionRate !== null && (
                          <span className="ml-2 text-xs text-success">
                            {formatPercent(stage.conversionRate)} conv.
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No lead data yet.</p>
          )}
        </TVCard>
      </div>

      {/* ── Activity timeline ── */}
      <TVCard className="space-y-5 rounded-[2rem] border-white/60 bg-white/90">
        <div className="flex items-start justify-between gap-4">
          <div>
            <TVCardTitle>Activity timeline</TVCardTitle>
            <TVCardDescription>
              Recent notes, proposals, meetings, and status changes across your pipeline.
            </TVCardDescription>
          </div>
          <TVBadge className="bg-primary/10 text-primary" variant="default">
            <Activity className="mr-1 h-3 w-3" />
            Last 60 days
          </TVBadge>
        </div>

        {timeline.length > 0 ? (
          <div className="relative space-y-0">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px bg-border" />

            {timeline.map((item) => {
              const config = ACTIVITY_TYPE_CONFIG[item.type];
              const content = (
                <div className="relative flex gap-4 py-3">
                  <div
                    className={cn(
                      'relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white',
                      config.dotClassName,
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <TVBadge className="bg-surface-muted text-muted-foreground text-[10px]" variant="default">
                        {config.label}
                      </TVBadge>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                    </div>
                    {item.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.timestamp)}</p>
                  </div>
                </div>
              );

              return item.href ? (
                <Link
                  key={item.id}
                  className="block rounded-xl transition-colors hover:bg-surface-muted/50"
                  href={item.href}
                >
                  {content}
                </Link>
              ) : (
                <div key={item.id}>{content}</div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed bg-surface-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
            No recent activity found. Activity will appear here as you work leads, send proposals, and complete meetings.
          </div>
        )}
      </TVCard>
    </div>
  );
}
