import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RepPipelineStage {
  stage: string;
  count: number;
  valueCents: number;
}

export interface RepMonthlyTrend {
  month: string; // "Jan", "Feb", etc.
  year: number;
  closedWonCents: number;
  closedLostCents: number;
  count: number;
}

export interface RepAnalytics {
  // Pipeline
  openPipelineValueCents: number;
  openDealCount: number;
  closedWonThisMonthCents: number;
  closedWonLastMonthCents: number;
  closedWonAllTimeCents: number;
  winRate: number; // 0–1
  avgDealSizeCents: number;
  dealsByStage: RepPipelineStage[];
  totalOpportunities: number;

  // Leads
  totalLeads: number;
  newLeadsThisWeek: number;
  newLeadsThisMonth: number;
  leadsByStatus: { status: string; count: number }[];

  // Accounts
  totalAccounts: number;
  activeAccountCount: number;
  prospectAccountCount: number;

  // Activity (last 30 days)
  notesLast30Days: number;
  proposalsCreatedLast30Days: number;
  proposalsSentLast30Days: number;
  tasksCompletedLast30Days: number;
  meetingsLast30Days: number;

  // Monthly trend (last 6 months, chronological)
  monthlyTrend: RepMonthlyTrend[];
}

// ─── Activity timeline ────────────────────────────────────────────────────────

export type ActivityItemType =
  | 'note_created'
  | 'proposal_created'
  | 'proposal_sent'
  | 'proposal_accepted'
  | 'lead_status_change'
  | 'meeting_completed'
  | 'task_completed'
  | 'opportunity_won'
  | 'opportunity_lost';

export interface ActivityTimelineItem {
  id: string;
  type: ActivityItemType;
  label: string;
  description: string | null;
  timestamp: Date;
  href: string | null;
}

// ─── Conversion funnel ────────────────────────────────────────────────────────

export interface FunnelStage {
  status: string;
  label: string;
  count: number;
  conversionRate: number | null; // rate from previous stage (null for first)
  dropOffRate: number | null;
}

export interface RepConversionFunnel {
  stages: FunnelStage[];
  totalEntered: number;
  overallWinRate: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function subDays(d: Date, n: number): Date {
  return new Date(d.getTime() - n * 86_400_000);
}

function subMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() - n);
  return r;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const OPPORTUNITY_STAGES_OPEN = ['prospecting', 'discovery', 'demo', 'proposal', 'negotiation'];
const OPPORTUNITY_STAGES_ALL = [...OPPORTUNITY_STAGES_OPEN, 'closed_won', 'closed_lost'];

// ─── Main analytics query ─────────────────────────────────────────────────────

async function getRepProfileId(userId: string): Promise<string | null> {
  const rep = await prisma.repProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return rep?.id ?? null;
}

export async function getRepAnalytics(userId: string): Promise<RepAnalytics | null> {
  const repProfileId = await getRepProfileId(userId);
  if (!repProfileId) return null;

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const thisWeekStart = startOfDay(subDays(now, 7));
  const thisMonthStartForLeads = startOfMonth(now);
  const thirtyDaysAgo = subDays(now, 30);

  const [
    opportunities,
    leads,
    accounts,
    recentNotes,
    recentProposals,
    recentMeetings,
    recentTasks,
  ] = await Promise.all([
    prisma.opportunity.findMany({
      where: { ownerRepProfileId: repProfileId },
      select: { id: true, stage: true, amountCents: true, closeDate: true, updatedAt: true, createdAt: true },
    }),
    prisma.lead.findMany({
      where: { repProfileId },
      select: { id: true, status: true, createdAt: true },
    }),
    prisma.account.findMany({
      where: { ownerRepProfileId: repProfileId },
      select: { id: true, status: true },
    }),
    prisma.repNote.count({
      where: { repProfileId, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.proposal.findMany({
      where: { repProfileId, createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, status: true, sentAt: true, createdAt: true },
    }),
    prisma.meeting.count({
      where: { repProfileId, status: 'completed', createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.repTaskSuggestion.count({
      where: {
        repProfileId,
        status: { in: ['converted', 'acknowledged'] },
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  // ── Pipeline ──────────────────────────────────────────────────────────────
  const openOpps = opportunities.filter((o) => OPPORTUNITY_STAGES_OPEN.includes(o.stage));
  const closedWonAll = opportunities.filter((o) => o.stage === 'closed_won');
  const closedLostAll = opportunities.filter((o) => o.stage === 'closed_lost');

  const openPipelineValueCents = openOpps.reduce((s, o) => s + (o.amountCents ?? 0), 0);

  const closedWonThisMonth = closedWonAll.filter(
    (o) => (o.closeDate ?? o.updatedAt) >= thisMonthStart,
  );
  const closedWonLastMonth = closedWonAll.filter((o) => {
    const d = o.closeDate ?? o.updatedAt;
    return d >= lastMonthStart && d < thisMonthStart;
  });

  const closedWonThisMonthCents = closedWonThisMonth.reduce((s, o) => s + (o.amountCents ?? 0), 0);
  const closedWonLastMonthCents = closedWonLastMonth.reduce((s, o) => s + (o.amountCents ?? 0), 0);
  const closedWonAllTimeCents = closedWonAll.reduce((s, o) => s + (o.amountCents ?? 0), 0);

  const totalClosed = closedWonAll.length + closedLostAll.length;
  const winRate = totalClosed > 0 ? closedWonAll.length / totalClosed : 0;
  const avgDealSizeCents =
    closedWonAll.length > 0
      ? Math.round(closedWonAll.reduce((s, o) => s + (o.amountCents ?? 0), 0) / closedWonAll.length)
      : 0;

  const dealsByStage: RepPipelineStage[] = OPPORTUNITY_STAGES_ALL.map((stage) => {
    const items = opportunities.filter((o) => o.stage === stage);
    return {
      stage,
      count: items.length,
      valueCents: items.reduce((s, o) => s + (o.amountCents ?? 0), 0),
    };
  }).filter((s) => s.count > 0);

  // ── Leads ─────────────────────────────────────────────────────────────────
  const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
  const leadsByStatus = LEAD_STATUSES.map((status) => ({
    status,
    count: leads.filter((l) => l.status === status).length,
  }));

  // ── Monthly trend (last 6 months) ─────────────────────────────────────────
  const monthlyTrend: RepMonthlyTrend[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = startOfMonth(subMonths(now, i - 1));
    const wonInMonth = closedWonAll.filter((o) => {
      const d = o.closeDate ?? o.updatedAt;
      return d >= monthStart && d < monthEnd;
    });
    const lostInMonth = closedLostAll.filter((o) => {
      const d = o.closeDate ?? o.updatedAt;
      return d >= monthStart && d < monthEnd;
    });
    monthlyTrend.push({
      month: MONTH_NAMES[monthStart.getMonth()],
      year: monthStart.getFullYear(),
      closedWonCents: wonInMonth.reduce((s, o) => s + (o.amountCents ?? 0), 0),
      closedLostCents: lostInMonth.reduce((s, o) => s + (o.amountCents ?? 0), 0),
      count: wonInMonth.length,
    });
  }

  return {
    openPipelineValueCents,
    openDealCount: openOpps.length,
    closedWonThisMonthCents,
    closedWonLastMonthCents,
    closedWonAllTimeCents,
    winRate,
    avgDealSizeCents,
    dealsByStage,
    totalOpportunities: opportunities.length,

    totalLeads: leads.length,
    newLeadsThisWeek: leads.filter((l) => l.createdAt >= thisWeekStart).length,
    newLeadsThisMonth: leads.filter((l) => l.createdAt >= thisMonthStartForLeads).length,
    leadsByStatus,

    totalAccounts: accounts.length,
    activeAccountCount: accounts.filter((a) => a.status === 'active_customer').length,
    prospectAccountCount: accounts.filter((a) => a.status === 'prospect').length,

    notesLast30Days: recentNotes,
    proposalsCreatedLast30Days: recentProposals.length,
    proposalsSentLast30Days: recentProposals.filter((p) => p.sentAt !== null).length,
    tasksCompletedLast30Days: recentTasks,
    meetingsLast30Days: recentMeetings,

    monthlyTrend,
  };
}

// ─── Activity timeline ────────────────────────────────────────────────────────

export async function getRepActivityTimeline(
  userId: string,
  limit = 40,
): Promise<ActivityTimelineItem[]> {
  const repProfileId = await getRepProfileId(userId);
  if (!repProfileId) return [];

  const since = subDays(new Date(), 60);

  const [notes, proposals, activityLogs, meetings] = await Promise.all([
    prisma.repNote.findMany({
      where: { repProfileId, createdAt: { gte: since } },
      select: {
        id: true,
        title: true,
        templateType: true,
        createdAt: true,
        lead: { select: { firstName: true, lastName: true } },
        account: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.proposal.findMany({
      where: { repProfileId, createdAt: { gte: since } },
      select: {
        id: true,
        title: true,
        status: true,
        sentAt: true,
        createdAt: true,
        lead: { select: { firstName: true, lastName: true } },
        account: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.activityLog.findMany({
      where: {
        repProfileId,
        type: {
          in: [
            'lead_status_changed',
            'lead_note_added',
            'meeting_processed',
          ],
        },
        createdAt: { gte: since },
      },
      select: {
        id: true,
        type: true,
        metadata: true,
        createdAt: true,
        leadId: true,
        lead: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.meeting.findMany({
      where: { repProfileId, status: 'completed', createdAt: { gte: since } },
      select: {
        id: true,
        topic: true,
        startAt: true,
        createdAt: true,
        lead: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
  ]);

  const items: ActivityTimelineItem[] = [];

  // Notes
  for (const n of notes) {
    const ctx = n.lead
      ? `${n.lead.firstName} ${n.lead.lastName}`
      : n.account?.name ?? null;
    items.push({
      id: `note-${n.id}`,
      type: 'note_created',
      label: n.title ?? `New ${n.templateType.replace(/_/g, ' ')}`,
      description: ctx ? `Linked to ${ctx}` : null,
      timestamp: n.createdAt,
      href: '/workspace/notes',
    });
  }

  // Proposals
  for (const p of proposals) {
    const ctx = p.lead
      ? `${p.lead.firstName} ${p.lead.lastName}`
      : p.account?.name ?? null;

    items.push({
      id: `proposal-${p.id}`,
      type: p.status === 'accepted' ? 'proposal_accepted' : p.sentAt ? 'proposal_sent' : 'proposal_created',
      label: p.title,
      description: ctx ? `For ${ctx}` : null,
      timestamp: p.sentAt ?? p.createdAt,
      href: `/workspace/proposals/${p.id}`,
    });
  }

  // Activity log events
  for (const a of activityLogs) {
    let type: ActivityItemType = 'lead_status_change';
    let label = 'Activity';
    const ctx = a.lead ? `${a.lead.firstName} ${a.lead.lastName}` : null;

    if (a.type === 'lead_status_changed') {
      const payload = a.metadata as Record<string, unknown> | null;
      const toStatus = payload?.['to'] as string | undefined;
      if (toStatus === 'won') type = 'opportunity_won';
      else if (toStatus === 'lost') type = 'opportunity_lost';
      else type = 'lead_status_change';
      label = toStatus
        ? `Lead marked ${toStatus.replace(/_/g, ' ')}`
        : 'Lead status updated';
    } else if (a.type === 'meeting_processed') {
      type = 'meeting_completed';
      label = 'Meeting processed';
    } else {
      label = a.type.replace(/_/g, ' ');
    }

    items.push({
      id: `activity-${a.id}`,
      type,
      label,
      description: ctx,
      timestamp: a.createdAt,
      href: a.lead ? `/workspace/leads/${a.lead.id}` : null,
    });
  }

  // Meetings
  for (const m of meetings) {
    items.push({
      id: `meeting-${m.id}`,
      type: 'meeting_completed',
      label: m.topic ?? 'Meeting completed',
      description: m.lead ? `With ${m.lead.firstName} ${m.lead.lastName}` : null,
      timestamp: m.startAt ?? m.createdAt,
      href: m.lead ? `/workspace/leads/${m.lead.id}` : null,
    });
  }

  // Sort by timestamp desc, deduplicate by id, take limit
  return items
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

// ─── Conversion funnel ────────────────────────────────────────────────────────

const FUNNEL_STAGES = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'qualified', label: 'Qualified' },
  { status: 'proposal', label: 'Proposal' },
  { status: 'won', label: 'Won' },
];

export async function getRepConversionFunnel(userId: string): Promise<RepConversionFunnel | null> {
  const repProfileId = await getRepProfileId(userId);
  if (!repProfileId) return null;

  const leads = await prisma.lead.findMany({
    where: { repProfileId },
    select: { id: true, status: true, createdAt: true },
  });

  const ALL_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
  const countByStatus: Record<string, number> = {};
  for (const s of ALL_STATUSES) {
    countByStatus[s] = leads.filter((l) => l.status === s).length;
  }

  // For the funnel, we count cumulative reach:
  // "contacted" stage = leads that reached contacted OR beyond
  // This gives a true funnel (not just current status snapshot)
  const ORDERED = ['new', 'contacted', 'qualified', 'proposal', 'won'];
  const reachedCount: Record<string, number> = {};
  for (let i = 0; i < ORDERED.length; i++) {
    const reachStatuses = ORDERED.slice(i);
    reachedCount[ORDERED[i]] = leads.filter((l) => reachStatuses.includes(l.status) || (i < 4 && l.status === 'lost' && i <= 3)).length;
  }

  // Simpler: use cumulative — each status includes all "further along" statuses
  // new: all leads
  const allCount = leads.length;
  const contacted = leads.filter((l) => !['new'].includes(l.status)).length;
  const qualified = leads.filter((l) => ['qualified', 'proposal', 'won'].includes(l.status)).length;
  const proposalCount = leads.filter((l) => ['proposal', 'won'].includes(l.status)).length;
  const wonCount = leads.filter((l) => l.status === 'won').length;

  const stageCounts = [allCount, contacted, qualified, proposalCount, wonCount];

  const stages: FunnelStage[] = FUNNEL_STAGES.map((s, i) => {
    const count = stageCounts[i];
    const prevCount = i > 0 ? stageCounts[i - 1] : null;
    const conversionRate = prevCount !== null && prevCount > 0 ? count / prevCount : null;
    const dropOffRate = conversionRate !== null ? 1 - conversionRate : null;
    return {
      status: s.status,
      label: s.label,
      count,
      conversionRate,
      dropOffRate,
    };
  });

  return {
    stages,
    totalEntered: allCount,
    overallWinRate: allCount > 0 ? wonCount / allCount : 0,
  };
}
