import { EmailThreadStatus, RepTaskSuggestionStatus, RepTaskSuggestionType, AlertPriority, type UserRole } from '@prisma/client';

import { resolveUsLeadMapPoint } from '@/lib/geo/us-lead-map';
import { getPrismaClient } from '@/lib/prisma';
import { getOnboardingStatus } from '@/lib/onboarding';

import type { DatabaseClient } from './types';

interface WorkspaceDatabaseClient extends DatabaseClient {
  user: ReturnType<typeof getPrismaClient>['user'];
}

type RepScopedUser = {
  id: string;
  repProfile: {
    id: string;
  } | null;
};

type RepTaskRecord = {
  id: string;
  type: string;
  status: string;
  priority: string;
  title: string;
  reason: string;
  explanation: string | null;
  recommendedDueAt: Date | null;
  scheduledAt: Date | null;
  scheduledEndAt: Date | null;
  snoozedUntil: Date | null;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
  } | null;
};

type RepAlertRecord = {
  id: string;
  title: string;
  message: string;
  priority: string;
  status: string;
  suggestedNextStep: string | null;
  triggeredAt: Date;
  resolvedAt: Date | null;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
    email: string;
  };
};

export interface RepLeadInboxItem {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  status: string;
  interest: string | null;
  createdAt: Date;
  landingPageSlug: string | null;
  openAlertCount: number;
  latestMeetingSummary: string | null;
}

export interface RepInboxThreadItem {
  id: string;
  mailbox: {
    id: string;
    label: string;
    emailAddress: string;
    provider: string;
  };
  subject: string;
  snippet: string | null;
  unreadCount: number;
  status: string;
  awaitingReply: boolean;
  followUpNeeded: boolean;
  snoozedUntil: Date | null;
  lastMessageAt: Date;
  participants: string[];
  lead: null | {
    id: string;
    firstName: string;
    lastName: string;
  };
  account: null | {
    id: string;
    name: string;
  };
  opportunity: null | {
    id: string;
    name: string;
    stage: string;
  };
  messages: Array<{
    id: string;
    direction: string;
    fromEmail: string;
    toEmails: string[];
    bodyText: string;
    sentAt: Date;
    isRead: boolean;
  }>;
}

export interface RepAlertItem {
  id: string;
  title: string;
  message: string;
  priority: string;
  status: string;
  suggestedNextStep: string | null;
  triggeredAt: Date;
  resolvedAt: Date | null;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
    email: string;
  };
}

export interface RepTaskItem {
  id: string;
  type: string;
  status: string;
  priority: string;
  title: string;
  reason: string;
  explanation: string | null;
  recommendedDueAt: Date | null;
  scheduledAt: Date | null;
  scheduledEndAt: Date | null;
  snoozedUntil: Date | null;
  lead: null | {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
  };
}

export type RepCalendarView = 'day' | 'week' | 'month' | 'list';

export interface RepCalendarItem {
  id: string;
  kind: 'calendar_event' | 'task_follow_up';
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  status: string;
  isScheduled: boolean;
  sourceUrl: string | null;
  lead: null | {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
  };
  meeting: null | {
    id: string;
    topic: string;
    summary: string | null;
  };
}

export interface RepCalendarWorkspace {
  summary: {
    todayCount: number;
    weekCount: number;
    scheduledCount: number;
    followUpCount: number;
  };
  items: RepCalendarItem[];
  recentMeetings: Array<{
    id: string;
    topic: string;
    startAt: Date | null;
    summary: string | null;
    recommendedNextStep: string | null;
    leadName: string | null;
  }>;
}

export interface RepLeadDetail {
  id: string;
  repProfileId: string | null;
  repLocation: string | null;
  firstName: string;
  lastName: string;
  company: string | null;
  jobTitle: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  industry: string | null;
  interest: string | null;
  notes: string | null;
  consent: boolean;
  status: string;
  sourceType: string;
  submittedAt: Date | null;
  landingPage: {
    slug: string;
    title: string;
  } | null;
  duplicateOfLead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  notesList: Array<{
    id: string;
    content: string;
    createdAt: Date;
    author: {
      name: string | null;
      email: string | null;
    } | null;
  }>;
  alerts: RepAlertItem[];
  meetings: Array<{
    id: string;
    topic: string;
    startAt: Date | null;
    summary: string | null;
    recommendedNextStep: string | null;
    actionItems: Array<{
      id: string;
      description: string;
      status: string;
    }>;
    draft: {
      id: string;
      subject: string;
      bodyText: string;
      status: string;
    } | null;
  }>;
  accounts: Array<{
    id: string;
    name: string;
    relationshipLabel: string | null;
  }>;
  opportunities: Array<{
    id: string;
    name: string;
    stage: string;
    amountCents: number | null;
  }>;
  repTaskSuggestions: RepTaskItem[];
}

export interface WorkspaceData {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  destination: 'rep' | 'admin';
  repProfile: null | {
    id: string;
    displayName: string;
    title: string;
    slug: string;
    bio: string;
    email: string;
    phone: string | null;
    website: string | null;
    location: string | null;
    photoUrl: string | null;
    signatureCompany: string | null;
    publicLandingPath: string | null;
    vCardDownloadPath: string | null;
    metrics: {
      totalLeads: number;
      newLeads: number;
      openAlerts: number;
      meetingsProcessed: number;
      openTasks: number;
    };
    alertFeed: Array<{
      id: string;
      title: string;
      message: string;
      priority: string;
      triggeredAt: Date;
      lead: {
        id: string;
        firstName: string;
        lastName: string;
        company: string | null;
      };
    }>;
    recentLeads: Array<{
      id: string;
      firstName: string;
      lastName: string;
      company: string | null;
      status: string;
      createdAt: Date;
      email: string;
      interest: string | null;
    }>;
    recentMeetings: Array<{
      id: string;
      topic: string;
      startAt: Date | null;
      endAt: Date | null;
      company: string | null;
      leadName: string | null;
      summary: string | null;
      recommendedNextStep: string | null;
      actionItems: Array<{
        id: string;
        description: string;
        status: string;
      }>;
      draft: {
        id: string;
        subject: string;
        bodyText: string;
        status: string;
      } | null;
    }>;
    leadMapPoints: Array<{
      id: string;
      firstName: string;
      lastName: string;
      company: string | null;
      location: string;
      x: number;
      y: number;
    }>;
    travelCalendarCandidates: Array<{
      id: string;
      title: string;
      description: string | null;
      startAt: Date;
      endAt: Date;
      sourceUrl: string | null;
    }>;
    repTasks: RepTaskItem[];
    onboarding: {
      step1: boolean;
      step2: boolean;
      step3: boolean;
      isComplete: boolean;
      nextStep: number | null;
    };
  };
}

async function getRepScopedUser(
  userId: string,
  db: WorkspaceDatabaseClient,
): Promise<RepScopedUser | null> {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      repProfile: {
        select: {
          id: true,
        },
      },
    },
  });
}

async function getRepProfileIdForUser(
  userId: string,
  db: WorkspaceDatabaseClient,
): Promise<string | null> {
  const user = await getRepScopedUser(userId, db);
  return user?.repProfile?.id ?? null;
}

function getOpenRepTaskWhere(repProfileId: string, now = new Date()) {
  return {
    repProfileId,
    status: {
      in: [RepTaskSuggestionStatus.generated, RepTaskSuggestionStatus.acknowledged],
    },
    OR: [
      { snoozedUntil: null },
      { snoozedUntil: { lte: now } },
    ],
  };
}

function mapRepTaskItem(task: RepTaskRecord): RepTaskItem {
  return {
    id: task.id,
    type: task.type,
    status: task.status,
    priority: task.priority,
    title: task.title,
    reason: task.reason,
    explanation: task.explanation ?? null,
    recommendedDueAt: task.recommendedDueAt ?? null,
    scheduledAt: task.scheduledAt ?? null,
    scheduledEndAt: task.scheduledEndAt ?? null,
    snoozedUntil: task.snoozedUntil ?? null,
    lead: task.lead
      ? {
          id: task.lead.id,
          firstName: task.lead.firstName,
          lastName: task.lead.lastName,
          company: task.lead.company,
        }
      : null,
  };
}

function mapRepAlertItem(alert: RepAlertRecord): RepAlertItem {
  return {
    id: alert.id,
    title: alert.title,
    message: alert.message,
    priority: alert.priority,
    status: alert.status,
    suggestedNextStep: alert.suggestedNextStep ?? null,
    triggeredAt: alert.triggeredAt,
    resolvedAt: alert.resolvedAt ?? null,
    lead: {
      id: alert.lead.id,
      firstName: alert.lead.firstName,
      lastName: alert.lead.lastName,
      company: alert.lead.company,
      email: alert.lead.email,
    },
  };
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export async function getWorkspaceData(
  userId: string,
  role: UserRole,
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<WorkspaceData | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      connectedAccounts: {
        select: {
          provider: true,
        },
      },
      repProfile: {
        include: {
          signatureProfile: true,
          landingPages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  if (role !== 'sales_rep' || !user.repProfile) {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      destination: 'admin',
      repProfile: null,
    };
  }

  const [
    totalLeads,
    newLeads,
    openAlerts,
    meetingsProcessed,
    openTasks,
    alertFeed,
    recentLeads,
    recentMeetings,
    mappedLeads,
    travelCalendarCandidates,
    repTasks,
  ] = await Promise.all([
    db.lead.count({
      where: {
        repProfileId: user.repProfile.id,
      },
    }),
    db.lead.count({
      where: {
        repProfileId: user.repProfile.id,
        status: 'new',
      },
    }),
    db.careerMovementAlert.count({
      where: {
        status: 'open',
        lead: {
          repProfileId: user.repProfile.id,
        },
      },
    }),
    db.meeting.count({
      where: {
        repProfileId: user.repProfile.id,
        processedAt: {
          not: null,
        },
      },
    }),
    db.repTaskSuggestion.count({
      where: getOpenRepTaskWhere(user.repProfile.id),
    }),
    db.careerMovementAlert.findMany({
      where: {
        status: 'open',
        lead: {
          repProfileId: user.repProfile.id,
        },
      },
      orderBy: {
        triggeredAt: 'desc',
      },
      take: 4,
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
    }),
    db.lead.findMany({
      where: {
        repProfileId: user.repProfile.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        status: true,
        createdAt: true,
        email: true,
        interest: true,
      },
    }),
    db.meeting.findMany({
      where: {
        repProfileId: user.repProfile.id,
        processedAt: {
          not: null,
        },
      },
      orderBy: {
        startAt: 'desc',
      },
      take: 3,
      include: {
        lead: {
          select: {
            firstName: true,
            lastName: true,
            company: true,
          },
        },
        callSummary: {
          select: {
            summary: true,
            recommendedNextStep: true,
          },
        },
        actionItems: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 3,
          select: {
            id: true,
            description: true,
            status: true,
          },
        },
        emailDrafts: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            id: true,
            subject: true,
            bodyText: true,
            status: true,
          },
        },
      },
    }),
    db.lead.findMany({
      where: {
        repProfileId: user.repProfile.id,
        location: {
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        location: true,
      },
    }),
    db.calendarEvent.findMany({
      where: {
        userId: user.id,
        startAt: {
          gte: startOfDay(addDays(new Date(), -2)),
          lte: endOfDay(addDays(new Date(), 60)),
        },
      },
      orderBy: {
        startAt: 'asc',
      },
      take: 8,
      select: {
        id: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        sourceUrl: true,
      },
    }),
    db.repTaskSuggestion.findMany({
      where: getOpenRepTaskWhere(user.repProfile.id),
      orderBy: [{ priority: 'asc' }, { recommendedDueAt: 'asc' }, { createdAt: 'desc' }],
      take: 4,
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
    }),
  ]);

  const publishedLandingPages = user.repProfile.landingPages.filter((p) => p.isPublished);
  const primaryLandingPage = publishedLandingPages[0] ?? null;
  const onboarding = getOnboardingStatus({
    bio: user.repProfile.bio,
    photoUrl: user.repProfile.photoUrl,
    phone: user.repProfile.phone,
    connectedAccounts: user.connectedAccounts,
    landingPages: publishedLandingPages,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    destination: 'rep',
    repProfile: {
      id: user.repProfile.id,
      displayName: user.repProfile.displayName,
      title: user.repProfile.title,
      slug: user.repProfile.slug,
      bio: user.repProfile.bio,
      email: user.repProfile.email,
      phone: user.repProfile.phone,
      website: user.repProfile.website,
      location: user.repProfile.location,
      photoUrl: user.repProfile.photoUrl,
      signatureCompany: user.repProfile.signatureProfile?.companyName ?? null,
      publicLandingPath: primaryLandingPage
        ? `/rep/${primaryLandingPage.slug}`
        : null,
      vCardDownloadPath: primaryLandingPage
        ? `/api/rep/${primaryLandingPage.slug}/vcard`
        : null,
      metrics: {
        totalLeads,
        newLeads,
        openAlerts,
        meetingsProcessed,
        openTasks,
      },
      alertFeed: alertFeed.map((alert) => ({
        id: alert.id,
        title: alert.title,
        message: alert.message,
        priority: alert.priority,
        triggeredAt: alert.triggeredAt,
        lead: {
          id: alert.lead.id,
          firstName: alert.lead.firstName,
          lastName: alert.lead.lastName,
          company: alert.lead.company,
        },
      })),
      recentLeads,
      recentMeetings: recentMeetings.map((meeting) => ({
        id: meeting.id,
        topic: meeting.topic,
        startAt: meeting.startAt,
        endAt: meeting.endAt,
        company: meeting.lead?.company ?? null,
        leadName: meeting.lead
          ? `${meeting.lead.firstName} ${meeting.lead.lastName}`
          : null,
        summary: meeting.callSummary?.summary ?? null,
        recommendedNextStep: meeting.callSummary?.recommendedNextStep ?? null,
        actionItems: meeting.actionItems.map((item) => ({
          id: item.id,
          description: item.description,
          status: item.status,
        })),
        draft: meeting.emailDrafts[0]
          ? {
              id: meeting.emailDrafts[0].id,
              subject: meeting.emailDrafts[0].subject,
              bodyText: meeting.emailDrafts[0].bodyText,
              status: meeting.emailDrafts[0].status,
            }
          : null,
      })),
      leadMapPoints: mappedLeads
        .map((lead) => {
          const point = resolveUsLeadMapPoint(lead.location);

          if (!point || !lead.location) {
            return null;
          }

          return {
            id: lead.id,
            firstName: lead.firstName,
            lastName: lead.lastName,
            company: lead.company,
            location: lead.location,
            x: point.x,
            y: point.y,
          };
        })
        .filter((lead): lead is NonNullable<typeof lead> => Boolean(lead)),
      travelCalendarCandidates: travelCalendarCandidates.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description ?? null,
        startAt: event.startAt,
        endAt: event.endAt,
        sourceUrl: event.sourceUrl ?? null,
      })),
      repTasks: repTasks.map((t) => mapRepTaskItem(t as RepTaskRecord)),
      onboarding,
    },
  };
}

export async function getRepLeadInbox(
  userId: string,
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<RepLeadInboxItem[]> {
  const repProfileId = await getRepProfileIdForUser(userId, db);

  if (!repProfileId) {
    return [];
  }

  const leads = await db.lead.findMany({
    where: {
      repProfileId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      landingPage: {
        select: {
          slug: true,
        },
      },
      careerMovementAlerts: {
        where: {
          status: 'open',
        },
        select: {
          id: true,
        },
      },
      meetings: {
        orderBy: {
          startAt: 'desc',
        },
        take: 1,
        include: {
          callSummary: {
            select: {
              summary: true,
            },
          },
        },
      },
    },
  });

  return leads.map((lead) => ({
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
    location: lead.location,
    status: lead.status,
    interest: lead.interest,
    createdAt: lead.createdAt,
    landingPageSlug: lead.landingPage?.slug ?? null,
    openAlertCount: lead.careerMovementAlerts.length,
    latestMeetingSummary: lead.meetings[0]?.callSummary?.summary ?? null,
  }));
}

export type InboxStatusFilter = 'open' | 'awaiting_reply' | 'follow_up_needed' | 'snoozed' | 'archived';

export async function getRepInboxThreads(
  userId: string,
  statusFilter: InboxStatusFilter = 'open',
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<RepInboxThreadItem[]> {
  const repProfileId = await getRepProfileIdForUser(userId, db);

  if (!repProfileId) {
    return [];
  }

  const now = new Date();

  const whereFilter = (() => {
    if (statusFilter === 'awaiting_reply') return { repProfileId, status: 'open' as const, awaitingReply: true };
    if (statusFilter === 'follow_up_needed') return { repProfileId, status: 'open' as const, followUpNeeded: true };
    if (statusFilter === 'snoozed') return { repProfileId, status: 'snoozed' as const, snoozedUntil: { gt: now } };
    if (statusFilter === 'archived') return { repProfileId, status: 'archived' as const };
    // default: open (excluding snoozed-until-future)
    return {
      repProfileId,
      status: 'open' as const,
      OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
    };
  })();

  const threads = await db.emailThread.findMany({
    where: whereFilter,
    orderBy: {
      lastMessageAt: 'desc',
    },
    include: {
      mailbox: {
        select: {
          id: true,
          label: true,
          emailAddress: true,
          provider: true,
        },
      },
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      account: {
        select: {
          id: true,
          name: true,
        },
      },
      opportunity: {
        select: {
          id: true,
          name: true,
          stage: true,
        },
      },
      messages: {
        orderBy: {
          sentAt: 'desc',
        },
        take: 4,
        select: {
          id: true,
          direction: true,
          fromEmail: true,
          toEmails: true,
          bodyText: true,
          sentAt: true,
          isRead: true,
        },
      },
    },
  });

  return threads.map((thread) => ({
    id: thread.id,
    mailbox: {
      id: thread.mailbox.id,
      label: thread.mailbox.label,
      emailAddress: thread.mailbox.emailAddress,
      provider: thread.mailbox.provider,
    },
    subject: thread.subject,
    snippet: thread.snippet,
    unreadCount: thread.unreadCount,
    status: thread.status,
    awaitingReply: thread.awaitingReply,
    followUpNeeded: thread.followUpNeeded,
    snoozedUntil: thread.snoozedUntil,
    lastMessageAt: thread.lastMessageAt,
    participants: Array.isArray(thread.participants)
      ? thread.participants.filter((value): value is string => typeof value === 'string')
      : [],
    lead: thread.lead
      ? {
          id: thread.lead.id,
          firstName: thread.lead.firstName,
          lastName: thread.lead.lastName,
        }
      : null,
    account: thread.account
      ? {
          id: thread.account.id,
          name: thread.account.name,
        }
      : null,
    opportunity: thread.opportunity
      ? {
          id: thread.opportunity.id,
          name: thread.opportunity.name,
          stage: thread.opportunity.stage,
        }
      : null,
    messages: thread.messages.map((message) => ({
      id: message.id,
      direction: message.direction,
      fromEmail: message.fromEmail,
      toEmails: message.toEmails,
      bodyText: message.bodyText,
      sentAt: message.sentAt,
      isRead: message.isRead,
    })),
  }));
}

export async function setEmailThreadStatus(
  userId: string,
  threadId: string,
  status: EmailThreadStatus,
  snoozedUntil?: Date | null,
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<boolean> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) return false;

  const thread = await db.emailThread.findFirst({ where: { id: threadId, repProfileId } });
  if (!thread) return false;

  await db.emailThread.update({
    where: { id: threadId },
    data: {
      status,
      snoozedUntil: status === EmailThreadStatus.snoozed ? (snoozedUntil ?? null) : null,
    },
  });

  return true;
}

export async function setEmailThreadFlag(
  userId: string,
  threadId: string,
  flag: 'awaitingReply' | 'followUpNeeded',
  value: boolean,
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<boolean> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) return false;

  const thread = await db.emailThread.findFirst({ where: { id: threadId, repProfileId } });
  if (!thread) return false;

  await db.emailThread.update({
    where: { id: threadId },
    data: { [flag]: value },
  });

  return true;
}

export async function relinkEmailThread(
  userId: string,
  threadId: string,
  links: { leadId?: string | null; accountId?: string | null; opportunityId?: string | null },
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<boolean> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) return false;

  const thread = await db.emailThread.findFirst({ where: { id: threadId, repProfileId } });
  if (!thread) return false;

  await db.emailThread.update({
    where: { id: threadId },
    data: {
      leadId: links.leadId ?? null,
      accountId: links.accountId ?? null,
      opportunityId: links.opportunityId ?? null,
    },
  });

  return true;
}

export async function createTaskFromEmailThread(
  userId: string,
  threadId: string,
  options: {
    title: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueAt?: Date;
  },
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<RepTaskItem | null> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) return null;

  const thread = await db.emailThread.findFirst({
    where: { id: threadId, repProfileId },
    select: { id: true, subject: true, leadId: true },
  });
  if (!thread) return null;

  const priority = (options.priority ?? 'medium') as AlertPriority;

  const task = await db.repTaskSuggestion.create({
    data: {
      repProfileId,
      leadId: thread.leadId ?? null,
      type: RepTaskSuggestionType.send_follow_up,
      status: RepTaskSuggestionStatus.acknowledged,
      priority,
      title: options.title,
      reason: `Created from email thread: "${thread.subject}"`,
      explanation: null,
      recommendedDueAt: options.dueAt ?? null,
      sourceContext: { emailThreadId: thread.id },
    },
    include: {
      lead: {
        select: { id: true, firstName: true, lastName: true, company: true },
      },
    },
  });

  return mapRepTaskItem(task as RepTaskRecord);
}

export async function getRepTaskSuggestions(
  userId: string,
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<RepTaskItem[]> {
  const repProfileId = await getRepProfileIdForUser(userId, db);

  if (!repProfileId) {
    return [];
  }

  const tasks = await db.repTaskSuggestion.findMany({
    where: getOpenRepTaskWhere(repProfileId),
    orderBy: [{ priority: 'asc' }, { recommendedDueAt: 'asc' }, { createdAt: 'desc' }],
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
        },
      },
    },
  });

  return tasks.map((t) => mapRepTaskItem(t as RepTaskRecord));
}

export async function getRepAlerts(
  userId: string,
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<RepAlertItem[]> {
  const repProfileId = await getRepProfileIdForUser(userId, db);

  if (!repProfileId) {
    return [];
  }

  const alerts = await db.careerMovementAlert.findMany({
    where: {
      lead: {
        repProfileId,
      },
    },
    orderBy: [{ status: 'asc' }, { triggeredAt: 'desc' }],
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          email: true,
        },
      },
    },
  });

  return alerts.map(mapRepAlertItem);
}

export async function getRepCalendarWorkspace(
  userId: string,
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
  now = new Date(),
): Promise<RepCalendarWorkspace> {
  const repScopedUser = await getRepScopedUser(userId, db);
  const repProfileId = repScopedUser?.repProfile?.id ?? null;

  if (!repProfileId || !repScopedUser) {
    return {
      summary: {
        todayCount: 0,
        weekCount: 0,
        scheduledCount: 0,
        followUpCount: 0,
      },
      items: [],
      recentMeetings: [],
    };
  }

  const rangeStart = startOfDay(addDays(now, -7));
  const rangeEnd = endOfDay(addDays(now, 45));
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfDay(addDays(now, 6));

  const [calendarEvents, followUpTasks, recentMeetings] = await Promise.all([
    db.calendarEvent.findMany({
      where: {
        userId: repScopedUser.id,
        startAt: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      orderBy: {
        startAt: 'asc',
      },
      include: {
        meetings: {
          orderBy: {
            startAt: 'desc',
          },
          take: 1,
          include: {
            lead: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                company: true,
              },
            },
            callSummary: {
              select: {
                summary: true,
              },
            },
          },
        },
      },
    }),
    db.repTaskSuggestion.findMany({
      where: {
        repProfileId,
        status: {
          in: [RepTaskSuggestionStatus.generated, RepTaskSuggestionStatus.acknowledged],
        },
        AND: [
          {
            OR: [
              { snoozedUntil: null },
              { snoozedUntil: { lte: now } },
            ],
          },
          {
            OR: [
              {
                scheduledAt: {
                  not: null,
                  gte: rangeStart,
                  lte: rangeEnd,
                },
              },
              {
                scheduledAt: null,
                recommendedDueAt: {
                  not: null,
                  gte: rangeStart,
                  lte: rangeEnd,
                },
              },
            ],
          },
        ],
      },
      orderBy: [{ scheduledAt: 'asc' }, { recommendedDueAt: 'asc' }, { createdAt: 'desc' }],
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
    }),
    db.meeting.findMany({
      where: {
        repProfileId,
        processedAt: {
          not: null,
        },
      },
      orderBy: {
        startAt: 'desc',
      },
      take: 4,
      include: {
        lead: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        callSummary: {
          select: {
            summary: true,
            recommendedNextStep: true,
          },
        },
      },
    }),
  ]);

  const items = [
    ...calendarEvents.map((event) => ({
      id: event.id,
      kind: 'calendar_event' as const,
      title: event.title,
      description: event.description ?? null,
      startAt: event.startAt,
      endAt: event.endAt,
      status: event.syncStatus,
      isScheduled: true,
      sourceUrl: event.sourceUrl ?? null,
      lead: event.meetings[0]?.lead
        ? {
            id: event.meetings[0].lead.id,
            firstName: event.meetings[0].lead.firstName,
            lastName: event.meetings[0].lead.lastName,
            company: event.meetings[0].lead.company,
          }
        : null,
      meeting: event.meetings[0]
        ? {
            id: event.meetings[0].id,
            topic: event.meetings[0].topic,
            summary: event.meetings[0].callSummary?.summary ?? null,
          }
        : null,
    })),
    ...followUpTasks.map((rawTask) => {
      const task = rawTask as RepTaskRecord;
      const taskStart = task.scheduledAt ?? task.recommendedDueAt ?? now;
      const taskEnd = task.scheduledEndAt
        ?? (task.scheduledAt
          ? new Date(task.scheduledAt.getTime() + 30 * 60 * 1000)
          : task.recommendedDueAt ?? now);
      return {
        id: task.id,
        kind: 'task_follow_up' as const,
        title: task.title,
        description: task.explanation ?? task.reason,
        startAt: taskStart,
        endAt: taskEnd,
        status: task.status,
        isScheduled: Boolean(task.scheduledAt),
        sourceUrl: task.lead ? `/workspace/leads/${task.lead.id}` : '/workspace/tasks',
        lead: task.lead
          ? {
              id: task.lead.id,
              firstName: task.lead.firstName,
              lastName: task.lead.lastName,
              company: task.lead.company,
            }
          : null,
        meeting: null,
      };
    }),
  ].sort((left, right) => left.startAt.getTime() - right.startAt.getTime());

  return {
    summary: {
      todayCount: items.filter(
        (item) => item.startAt.getTime() >= todayStart.getTime() && item.startAt.getTime() <= todayEnd.getTime(),
      ).length,
      weekCount: items.filter(
        (item) => item.startAt.getTime() >= todayStart.getTime() && item.startAt.getTime() <= weekEnd.getTime(),
      ).length,
      scheduledCount: calendarEvents.length,
      followUpCount: followUpTasks.length,
    },
    items,
    recentMeetings: recentMeetings.map((meeting) => ({
      id: meeting.id,
      topic: meeting.topic,
      startAt: meeting.startAt ?? null,
      summary: meeting.callSummary?.summary ?? null,
      recommendedNextStep: meeting.callSummary?.recommendedNextStep ?? null,
      leadName: meeting.lead
        ? `${meeting.lead.firstName} ${meeting.lead.lastName}`
        : null,
    })),
  };
}

export async function updateRepAlertStatus(
  userId: string,
  alertId: string,
  status: 'dismissed' | 'resolved',
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<RepAlertItem | null> {
  const repProfileId = await getRepProfileIdForUser(userId, db);

  if (!repProfileId) {
    return null;
  }

  const alert = await db.careerMovementAlert.findFirst({
    where: {
      id: alertId,
      lead: {
        repProfileId,
      },
    },
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          email: true,
        },
      },
    },
  });

  if (!alert) {
    return null;
  }

  const updatedAlert = await db.careerMovementAlert.update({
    where: {
      id: alert.id,
    },
    data: {
      status,
      resolvedAt: status === 'resolved' ? new Date() : null,
    },
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          email: true,
        },
      },
    },
  });

  return mapRepAlertItem(updatedAlert);
}

export async function updateRepTaskSuggestionStatus(
  userId: string,
  suggestionId: string,
  status: 'acknowledged' | 'dismissed' | 'converted',
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<RepTaskItem | null> {
  const repProfileId = await getRepProfileIdForUser(userId, db);

  if (!repProfileId) {
    return null;
  }

  const task = await db.repTaskSuggestion.findFirst({
    where: {
      id: suggestionId,
      repProfileId,
    },
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
        },
      },
    },
  });

  if (!task) {
    return null;
  }

  const updatedTask = await db.repTaskSuggestion.update({
    where: {
      id: task.id,
    },
    data: {
      status,
    },
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
        },
      },
    },
  });

  return mapRepTaskItem(updatedTask);
}

export async function scheduleRepTask(
  userId: string,
  taskId: string,
  scheduledAt: Date,
  durationMinutes = 30,
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<RepTaskItem | null> {
  const repProfileId = await getRepProfileIdForUser(userId, db);

  if (!repProfileId) {
    return null;
  }

  const task = await db.repTaskSuggestion.findFirst({
    where: { id: taskId, repProfileId },
    include: {
      lead: {
        select: { id: true, firstName: true, lastName: true, company: true },
      },
    },
  });

  if (!task) {
    return null;
  }

  const scheduledEndAt = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);

  const updated = await db.repTaskSuggestion.update({
    where: { id: task.id },
    data: { scheduledAt, scheduledEndAt },
    include: {
      lead: {
        select: { id: true, firstName: true, lastName: true, company: true },
      },
    },
  });

  return mapRepTaskItem(updated as RepTaskRecord);
}

export async function unscheduleRepTask(
  userId: string,
  taskId: string,
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<RepTaskItem | null> {
  const repProfileId = await getRepProfileIdForUser(userId, db);

  if (!repProfileId) {
    return null;
  }

  const task = await db.repTaskSuggestion.findFirst({
    where: { id: taskId, repProfileId },
    include: {
      lead: {
        select: { id: true, firstName: true, lastName: true, company: true },
      },
    },
  });

  if (!task) {
    return null;
  }

  const updated = await db.repTaskSuggestion.update({
    where: { id: task.id },
    data: { scheduledAt: null, scheduledEndAt: null },
    include: {
      lead: {
        select: { id: true, firstName: true, lastName: true, company: true },
      },
    },
  });

  return mapRepTaskItem(updated as RepTaskRecord);
}

export async function snoozeRepTask(
  userId: string,
  taskId: string,
  snoozedUntil: Date,
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<RepTaskItem | null> {
  const repProfileId = await getRepProfileIdForUser(userId, db);

  if (!repProfileId) {
    return null;
  }

  const task = await db.repTaskSuggestion.findFirst({
    where: { id: taskId, repProfileId },
    include: {
      lead: {
        select: { id: true, firstName: true, lastName: true, company: true },
      },
    },
  });

  if (!task) {
    return null;
  }

  const updated = await db.repTaskSuggestion.update({
    where: { id: task.id },
    data: { snoozedUntil },
    include: {
      lead: {
        select: { id: true, firstName: true, lastName: true, company: true },
      },
    },
  });

  return mapRepTaskItem(updated as RepTaskRecord);
}

export async function getRepLeadById(
  userId: string,
  leadId: string,
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
): Promise<RepLeadDetail | null> {
  const repProfileId = await getRepProfileIdForUser(userId, db);

  if (!repProfileId) {
    return null;
  }

  const lead = await db.lead.findFirst({
    where: {
      id: leadId,
      repProfileId,
    },
    include: {
      landingPage: {
        select: {
          slug: true,
          title: true,
        },
      },
      duplicateOfLead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      notesList: {
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      careerMovementAlerts: {
        orderBy: {
          triggeredAt: 'desc',
        },
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              company: true,
              email: true,
            },
          },
        },
      },
      meetings: {
        orderBy: {
          startAt: 'desc',
        },
        take: 3,
        include: {
          callSummary: {
            select: {
              summary: true,
              recommendedNextStep: true,
            },
          },
          actionItems: {
            orderBy: {
              createdAt: 'asc',
            },
            take: 3,
            select: {
              id: true,
              description: true,
              status: true,
            },
          },
          emailDrafts: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
            select: {
              id: true,
              subject: true,
              bodyText: true,
              status: true,
            },
          },
        },
      },
      accountLinks: {
        include: {
          account: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      primaryOpportunities: {
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          stage: true,
          amountCents: true,
        },
      },
      repTaskSuggestions: {
        where: {
          status: {
            in: ['generated', 'acknowledged'],
          },
        },
        orderBy: [{ priority: 'asc' }, { recommendedDueAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              company: true,
            },
          },
        },
      },
      repProfile: {
        select: {
          location: true,
        },
      },
    },
  });

  if (!lead) {
    return null;
  }

  return {
    id: lead.id,
    repProfileId: lead.repProfileId,
    repLocation: lead.repProfile?.location ?? null,
    firstName: lead.firstName,
    lastName: lead.lastName,
    company: lead.company,
    jobTitle: lead.jobTitle,
    email: lead.email,
    phone: lead.phone,
    location: lead.location,
    industry: lead.industry,
    interest: lead.interest,
    notes: lead.notes,
    consent: lead.consent,
    status: lead.status,
    sourceType: lead.sourceType,
    submittedAt: lead.submittedAt ?? null,
    landingPage: lead.landingPage,
    duplicateOfLead: lead.duplicateOfLead,
    notesList: lead.notesList.map((note) => ({
      id: note.id,
      content: note.content,
      createdAt: note.createdAt,
      author: note.author,
    })),
    alerts: lead.careerMovementAlerts.map(mapRepAlertItem),
    meetings: lead.meetings.map((meeting) => ({
      id: meeting.id,
      topic: meeting.topic,
      startAt: meeting.startAt,
      summary: meeting.callSummary?.summary ?? null,
      recommendedNextStep: meeting.callSummary?.recommendedNextStep ?? null,
      actionItems: meeting.actionItems.map((item) => ({
        id: item.id,
        description: item.description,
        status: item.status,
      })),
      draft: meeting.emailDrafts[0]
        ? {
            id: meeting.emailDrafts[0].id,
            subject: meeting.emailDrafts[0].subject,
            bodyText: meeting.emailDrafts[0].bodyText,
            status: meeting.emailDrafts[0].status,
          }
        : null,
    })),
    accounts: lead.accountLinks.map((link) => ({
      id: link.account.id,
      name: link.account.name,
      relationshipLabel: link.relationshipLabel ?? null,
    })),
    opportunities: lead.primaryOpportunities.map((opportunity) => ({
      id: opportunity.id,
      name: opportunity.name,
      stage: opportunity.stage,
      amountCents: opportunity.amountCents,
    })),
    repTaskSuggestions: lead.repTaskSuggestions.map((t) => mapRepTaskItem(t as RepTaskRecord)),
  };
}

export async function getRepLeadActivityTimeline(
  userId: string,
  leadId: string,
  db: WorkspaceDatabaseClient = getPrismaClient() as WorkspaceDatabaseClient,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      repProfile: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user?.repProfile) {
    return [];
  }

  return db.activityLog.findMany({
    where: {
      leadId,
      lead: {
        repProfileId: user.repProfile.id,
      },
    },
    include: {
      actorUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 12,
  });
}

// ─── Phase 14 Stage 4 ────────────────────────────────────────────────────────

export interface RepAccountContact {
  id: string;
  leadId: string;
  firstName: string;
  lastName: string;
  email: string;
  isPrimary: boolean;
  relationshipLabel: string | null;
}

export interface RepAccountItem {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  status: string;
  hqLocation: string | null;
  description: string | null;
  contacts: RepAccountContact[];
  openDealCount: number;
  totalPipelineValueCents: number;
}

export interface RepOpportunityItem {
  id: string;
  name: string;
  stage: string;
  amountCents: number | null;
  targetCloseDate: Date | null;
  description: string | null;
  updatedAt: Date;
  account: {
    id: string;
    name: string;
  };
  primaryLead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

const openOppStages = [
  'prospecting',
  'discovery',
  'demo',
  'proposal',
  'negotiation',
] as const;

export async function getRepAccountsWorkspace(
  userId: string,
  db = getPrismaClient(),
): Promise<RepAccountItem[]> {
  const repProfileId = await getRepProfileIdForUser(userId, db as WorkspaceDatabaseClient);

  if (!repProfileId) {
    return [];
  }

  const accounts = await db.account.findMany({
    where: { ownerRepProfileId: repProfileId },
    orderBy: { name: 'asc' },
    include: {
      contacts: {
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      },
      opportunities: {
        where: { stage: { in: [...openOppStages] } },
        select: {
          id: true,
          amountCents: true,
        },
      },
    },
  });

  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    domain: account.domain,
    industry: account.industry,
    status: account.status,
    hqLocation: account.hqLocation,
    description: account.description,
    contacts: account.contacts.map((c) => ({
      id: c.id,
      leadId: c.lead.id,
      firstName: c.lead.firstName,
      lastName: c.lead.lastName,
      email: c.lead.email,
      isPrimary: c.isPrimary,
      relationshipLabel: c.relationshipLabel,
    })),
    openDealCount: account.opportunities.length,
    totalPipelineValueCents: account.opportunities.reduce(
      (sum, opp) => sum + (opp.amountCents ?? 0),
      0,
    ),
  }));
}

export async function getRepOpportunitiesWorkspace(
  userId: string,
  db = getPrismaClient(),
): Promise<RepOpportunityItem[]> {
  const repProfileId = await getRepProfileIdForUser(userId, db as WorkspaceDatabaseClient);

  if (!repProfileId) {
    return [];
  }

  const opportunities = await db.opportunity.findMany({
    where: { ownerRepProfileId: repProfileId },
    orderBy: [{ targetCloseDate: 'asc' }, { createdAt: 'desc' }],
    include: {
      account: {
        select: { id: true, name: true },
      },
      primaryLead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return opportunities.map((opp) => ({
    id: opp.id,
    name: opp.name,
    stage: opp.stage,
    amountCents: opp.amountCents,
    targetCloseDate: opp.targetCloseDate,
    description: opp.description,
    updatedAt: opp.updatedAt,
    account: opp.account,
    primaryLead: opp.primaryLead,
  }));
}

export async function moveRepOpportunityStage(
  userId: string,
  opportunityId: string,
  stage: string,
  db = getPrismaClient(),
) {
  const repProfileId = await getRepProfileIdForUser(userId, db as WorkspaceDatabaseClient);

  if (!repProfileId) {
    throw new Error('Rep profile not found');
  }

  const opp = await db.opportunity.findFirst({
    where: { id: opportunityId, ownerRepProfileId: repProfileId },
  });

  if (!opp) {
    throw new Error('Opportunity not found or access denied');
  }

  return db.opportunity.update({
    where: { id: opportunityId },
    data: { stage: stage as never },
  });
}

export async function updateRepOpportunityNextStep(
  userId: string,
  opportunityId: string,
  description: string,
  db = getPrismaClient(),
) {
  const repProfileId = await getRepProfileIdForUser(userId, db as WorkspaceDatabaseClient);

  if (!repProfileId) {
    throw new Error('Rep profile not found');
  }

  const opp = await db.opportunity.findFirst({
    where: { id: opportunityId, ownerRepProfileId: repProfileId },
  });

  if (!opp) {
    throw new Error('Opportunity not found or access denied');
  }

  return db.opportunity.update({
    where: { id: opportunityId },
    data: { description },
  });
}

// ─── Account detail ───────────────────────────────────────────────────────────

export interface RepAccountDetailNote {
  id: string;
  title: string | null;
  body: string;
  templateType: string;
  createdAt: Date;
}

export interface RepAccountDetailProposal {
  id: string;
  title: string;
  status: string;
  totalValueCents: number | null;
  sentAt: Date | null;
  createdAt: Date;
}

export interface RepAccountDetailOpportunity {
  id: string;
  name: string;
  stage: string;
  amountCents: number | null;
  targetCloseDate: Date | null;
  closeDate: Date | null;
  primaryLead: { id: string; firstName: string; lastName: string } | null;
}

export interface RepAccountDetail {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  status: string;
  hqLocation: string | null;
  description: string | null;
  contacts: RepAccountContact[];
  opportunities: RepAccountDetailOpportunity[];
  notes: RepAccountDetailNote[];
  proposals: RepAccountDetailProposal[];
  // Computed
  openDealCount: number;
  openPipelineValueCents: number;
  closedWonValueCents: number;
}

const OPEN_OPP_STAGES = ['prospecting', 'discovery', 'demo', 'proposal', 'negotiation'];

export async function getRepAccountDetail(
  userId: string,
  accountId: string,
  db = getPrismaClient(),
): Promise<RepAccountDetail | null> {
  const repProfileId = await getRepProfileIdForUser(userId, db as WorkspaceDatabaseClient);
  if (!repProfileId) return null;

  const account = await db.account.findFirst({
    where: { id: accountId, ownerRepProfileId: repProfileId },
    include: {
      contacts: {
        include: {
          lead: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      },
      opportunities: {
        where: { ownerRepProfileId: repProfileId },
        orderBy: [{ stage: 'asc' }, { targetCloseDate: 'asc' }],
        include: {
          primaryLead: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      repNotes: {
        where: { repProfileId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          body: true,
          templateType: true,
          createdAt: true,
        },
      },
      proposals: {
        where: { repProfileId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          totalValueCents: true,
          sentAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!account) return null;

  const openOpps = account.opportunities.filter((o) => OPEN_OPP_STAGES.includes(o.stage));
  const closedWon = account.opportunities.filter((o) => o.stage === 'closed_won');

  return {
    id: account.id,
    name: account.name,
    domain: account.domain,
    industry: account.industry,
    status: account.status,
    hqLocation: account.hqLocation,
    description: account.description,
    contacts: account.contacts.map((c) => ({
      id: c.id,
      leadId: c.lead.id,
      firstName: c.lead.firstName,
      lastName: c.lead.lastName,
      email: c.lead.email,
      isPrimary: c.isPrimary,
      relationshipLabel: c.relationshipLabel,
    })),
    opportunities: account.opportunities.map((o) => ({
      id: o.id,
      name: o.name,
      stage: o.stage,
      amountCents: o.amountCents,
      targetCloseDate: o.targetCloseDate,
      closeDate: o.closeDate,
      primaryLead: o.primaryLead,
    })),
    notes: account.repNotes,
    proposals: account.proposals,
    openDealCount: openOpps.length,
    openPipelineValueCents: openOpps.reduce((s, o) => s + (o.amountCents ?? 0), 0),
    closedWonValueCents: closedWon.reduce((s, o) => s + (o.amountCents ?? 0), 0),
  };
}

// ─── Opportunity detail ───────────────────────────────────────────────────────

export interface RepOpportunityDetail {
  id: string;
  name: string;
  stage: string;
  amountCents: number | null;
  currency: string;
  targetCloseDate: Date | null;
  closeDate: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  account: { id: string; name: string; industry: string | null; status: string };
  primaryLead: { id: string; firstName: string; lastName: string; email: string } | null;
  notes: RepAccountDetailNote[];
  proposals: RepAccountDetailProposal[];
}

export async function getRepOpportunityDetail(
  userId: string,
  opportunityId: string,
  db = getPrismaClient(),
): Promise<RepOpportunityDetail | null> {
  const repProfileId = await getRepProfileIdForUser(userId, db as WorkspaceDatabaseClient);
  if (!repProfileId) return null;

  const opp = await db.opportunity.findFirst({
    where: { id: opportunityId, ownerRepProfileId: repProfileId },
    include: {
      account: { select: { id: true, name: true, industry: true, status: true } },
      primaryLead: { select: { id: true, firstName: true, lastName: true, email: true } },
      repNotes: {
        where: { repProfileId },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          title: true,
          body: true,
          templateType: true,
          createdAt: true,
        },
      },
      proposals: {
        where: { repProfileId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          totalValueCents: true,
          sentAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!opp) return null;

  return {
    id: opp.id,
    name: opp.name,
    stage: opp.stage,
    amountCents: opp.amountCents,
    currency: opp.currency,
    targetCloseDate: opp.targetCloseDate,
    closeDate: opp.closeDate,
    description: opp.description,
    createdAt: opp.createdAt,
    updatedAt: opp.updatedAt,
    account: opp.account,
    primaryLead: opp.primaryLead,
    notes: opp.repNotes,
    proposals: opp.proposals,
  };
}

export interface RepLeaderboardEntry {
  repProfileId: string;
  displayName: string;
  slug: string;
  photoUrl: string | null;
  totalLeads: number;
  newLeads: number;
  wonLeads: number;
  openDeals: number;
  closedWonCents: number;
  pipelineCents: number;
}

export async function getRepLeaderboard(
  db: Pick<ReturnType<typeof getPrismaClient>, 'repProfile'> = getPrismaClient(),
): Promise<RepLeaderboardEntry[]> {
  const reps = await db.repProfile.findMany({
    select: {
      id: true,
      displayName: true,
      slug: true,
      photoUrl: true,
      ownedLeads: {
        select: {
          id: true,
          status: true,
        },
      },
      ownedOpportunities: {
        select: {
          stage: true,
          amountCents: true,
        },
      },
    },
    orderBy: {
      displayName: 'asc',
    },
  });

  const entries: RepLeaderboardEntry[] = reps.map((rep) => {
    const totalLeads = rep.ownedLeads.length;
    const newLeads = rep.ownedLeads.filter((l) => l.status === 'new').length;
    const wonLeads = rep.ownedLeads.filter((l) => l.status === 'won').length;

    const openDeals = rep.ownedOpportunities.filter(
      (o) => o.stage !== 'closed_won' && o.stage !== 'closed_lost',
    ).length;

    const closedWonCents = rep.ownedOpportunities
      .filter((o) => o.stage === 'closed_won')
      .reduce((sum, o) => sum + (o.amountCents ?? 0), 0);

    const pipelineCents = rep.ownedOpportunities
      .filter((o) => o.stage !== 'closed_won' && o.stage !== 'closed_lost')
      .reduce((sum, o) => sum + (o.amountCents ?? 0), 0);

    return {
      repProfileId: rep.id,
      displayName: rep.displayName,
      slug: rep.slug,
      photoUrl: rep.photoUrl,
      totalLeads,
      newLeads,
      wonLeads,
      openDeals,
      closedWonCents,
      pipelineCents,
    };
  });

  return entries.sort((a, b) => b.closedWonCents - a.closedWonCents);
}
