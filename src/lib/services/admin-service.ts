import { LeadStatus, UserRole, type Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';

import { getPrismaClient } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import {
  updateRepProfileBasicSchema,
  type UpdateRepProfileBasicInput,
} from '@/lib/validation/crm';

import type { DatabaseClient } from './types';

interface AdminDatabaseClient extends DatabaseClient {
  user: ReturnType<typeof getPrismaClient>['user'];
}

export interface AdminAccessActor {
  id: string;
  role: UserRole;
}

interface AdminScope {
  unrestricted: boolean;
  repProfileIds: string[];
}

export interface InviteRepInput {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  bio?: string;
  phone?: string;
  website?: string;
  location?: string;
}

export interface DashboardMetrics {
  totalLeads: number;
  recentLeads: number;
  totalAccounts: number;
  openOpportunities: number;
  activeReps: number;
  recentlyActiveReps: number;
  pendingInvites: number;
  pipelineValueCents: number;
  weightedForecastValueCents: number;
  closedWonValueCents: number;
  averageOpenDealSizeCents: number;
  winRatePercent: number;
  averageSalesCycleDays: number;
  overdueOpenOpportunities: number;
  leadsByRep: Array<{
    repId: string | null;
    repName: string;
    count: number;
  }>;
  leadsByStatus: Array<{
    status: LeadStatus;
    count: number;
  }>;
  forecastByStage: Array<{
    stage: string;
    opportunityCount: number;
    amountCents: number;
    weightedAmountCents: number;
  }>;
  repPerformance: Array<{
    repId: string;
    repName: string;
    lastLoginAt: Date | null;
    inviteStatus: 'pending' | 'accepted' | 'not_invited';
    leadsOwned: number;
    newLeadsLast30Days: number;
    qualifiedLeads: number;
    accountsOwned: number;
    openOpportunities: number;
    pipelineValueCents: number;
    weightedForecastValueCents: number;
    closedWonValueCents: number;
    averageDealSizeCents: number;
    winRatePercent: number;
  }>;
}

const openOpportunityStages = [
  'prospecting',
  'discovery',
  'demo',
  'proposal',
  'negotiation',
] as const;

const stageForecastWeights: Record<(typeof openOpportunityStages)[number], number> = {
  prospecting: 0.1,
  discovery: 0.25,
  demo: 0.45,
  proposal: 0.65,
  negotiation: 0.85,
};

function getStageWeight(stage: string) {
  if (stage in stageForecastWeights) {
    return stageForecastWeights[stage as keyof typeof stageForecastWeights];
  }

  return 0;
}

export interface LeadsListFilters {
  search?: string;
  status?: LeadStatus | 'all';
  repId?: string | 'all';
}

export interface AccountsListFilters {
  search?: string;
  status?: 'all' | 'prospect' | 'active_customer' | 'inactive_customer' | 'partner' | 'archived';
  repId?: string | 'all';
}

export interface OpportunitiesListFilters {
  search?: string;
  repId?: string | 'all';
  stage?:
    | 'all'
    | 'prospecting'
    | 'discovery'
    | 'demo'
    | 'proposal'
    | 'negotiation'
    | 'closed_won'
    | 'closed_lost';
}

async function getAdminScope(
  actor: AdminAccessActor,
  db: AdminDatabaseClient,
): Promise<AdminScope> {
  if (actor.role === 'super_admin') {
    return {
      unrestricted: true,
      repProfileIds: [],
    };
  }

  const managedRepProfiles = await db.repProfile.findMany({
    where: {
      managerUserId: actor.id,
    },
    select: {
      id: true,
    },
  });

  return {
    unrestricted: false,
    repProfileIds: managedRepProfiles.map((rep) => rep.id),
  };
}

async function assertScopedRepAccess(
  actor: AdminAccessActor,
  repProfileId: string,
  db: AdminDatabaseClient,
) {
  const scope = await getAdminScope(actor, db);

  if (!scope.unrestricted && !scope.repProfileIds.includes(repProfileId)) {
    throw new Error('Forbidden');
  }

  return scope;
}

function slugifyRepName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function generateUniqueRepSlug(
  baseSlug: string,
  db: AdminDatabaseClient,
) {
  let slug = baseSlug || `rep-${randomBytes(3).toString('hex')}`;
  let suffix = 1;

  while (await db.repProfile.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

function generateTemporaryPassword() {
  return `Train-${randomBytes(5).toString('base64url')}9!`;
}

function buildScopedLeadWhere(
  scope: AdminScope,
  filters: LeadsListFilters = {},
): Prisma.LeadWhereInput {
  const search = filters.search?.trim();
  const requestedRepFilter =
    filters.repId && filters.repId !== 'all' ? filters.repId : undefined;
  const scopedRepFilter = scope.unrestricted
    ? requestedRepFilter
    : requestedRepFilter
      ? scope.repProfileIds.includes(requestedRepFilter)
        ? requestedRepFilter
        : '__no-access__'
      : undefined;

  return {
    ...(filters.status && filters.status !== 'all'
      ? {
          status: filters.status,
        }
      : {}),
    ...(scope.unrestricted
      ? scopedRepFilter
        ? {
            repProfileId: scopedRepFilter,
          }
        : {}
      : {
          repProfileId: scopedRepFilter
            ? scopedRepFilter
            : {
                in: scope.repProfileIds,
              },
        }),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

function buildScopedOwnerRepFilter(
  scope: AdminScope,
  requestedRepId?: string,
): string | { in: string[] } | undefined {
  if (scope.unrestricted) {
    return requestedRepId;
  }

  if (requestedRepId) {
    return scope.repProfileIds.includes(requestedRepId) ? requestedRepId : '__no-access__';
  }

  return {
    in: scope.repProfileIds,
  };
}

function buildScopedAccountWhere(
  scope: AdminScope,
  filters: AccountsListFilters = {},
): Prisma.AccountWhereInput {
  const requestedRepId =
    filters.repId && filters.repId !== 'all' ? filters.repId : undefined;
  const ownerRepProfileId = buildScopedOwnerRepFilter(scope, requestedRepId);
  const search = filters.search?.trim();

  return {
    ...(ownerRepProfileId
      ? {
          ownerRepProfileId,
        }
      : {}),
    ...(filters.status && filters.status !== 'all'
      ? {
          status: filters.status,
        }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { domain: { contains: search, mode: 'insensitive' } },
            { industry: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

function buildScopedOpportunityWhere(
  scope: AdminScope,
  filters: OpportunitiesListFilters = {},
): Prisma.OpportunityWhereInput {
  const requestedRepId =
    filters.repId && filters.repId !== 'all' ? filters.repId : undefined;
  const ownerRepProfileId = buildScopedOwnerRepFilter(scope, requestedRepId);
  const search = filters.search?.trim();

  return {
    ...(ownerRepProfileId
      ? {
          ownerRepProfileId,
        }
      : {}),
    ...(filters.stage && filters.stage !== 'all'
      ? {
          stage: filters.stage,
        }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { account: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export async function getDashboardMetrics(
  actor: AdminAccessActor,
  db: AdminDatabaseClient = getPrismaClient() as AdminDatabaseClient,
): Promise<DashboardMetrics> {
  const scope = await getAdminScope(actor, db);
  const leadWhere = buildScopedLeadWhere(scope);
  const recentWhere: Prisma.LeadWhereInput = {
    ...leadWhere,
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  };

  const accountWhere = buildScopedAccountWhere(scope);
  const opportunityWhere = buildScopedOpportunityWhere(scope, {
    stage: 'all',
  });
  const openOpportunityWhere: Prisma.OpportunityWhereInput = {
    ...opportunityWhere,
    stage: {
      in: [...openOpportunityStages],
    },
  };
  const closedWonOpportunityWhere: Prisma.OpportunityWhereInput = {
    ...opportunityWhere,
    stage: 'closed_won',
  };
  const closedOpportunityWhere: Prisma.OpportunityWhereInput = {
    ...opportunityWhere,
    stage: {
      in: ['closed_won', 'closed_lost'],
    },
  };
  const recentLeadWindowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalLeads,
    recentLeads,
    totalAccounts,
    openOpportunities,
    groupedByStatus,
    groupedByRep,
    repProfiles,
    opportunities,
    closedWonOpportunities,
    closedOpportunities,
  ] = await Promise.all([
    db.lead.count({
      where: leadWhere,
    }),
    db.lead.count({
      where: recentWhere,
    }),
    db.account.count({
      where: accountWhere,
    }),
    db.opportunity.count({
      where: openOpportunityWhere,
    }),
    db.lead.groupBy({
      by: ['status'],
      where: leadWhere,
      _count: {
        _all: true,
      },
    }),
    db.lead.groupBy({
      by: ['repProfileId'],
      where: leadWhere,
      _count: {
        _all: true,
      },
    }),
    db.repProfile.findMany({
      where: scope.unrestricted
        ? undefined
        : {
            id: {
              in: scope.repProfileIds,
            },
          },
      orderBy: {
        displayName: 'asc',
      },
      include: {
        user: {
          select: {
            lastLoginAt: true,
            invitationSentAt: true,
            invitationAcceptedAt: true,
          },
        },
        ownedLeads: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        ownedAccounts: {
          select: {
            id: true,
          },
        },
        ownedOpportunities: {
          select: {
            id: true,
            stage: true,
            amountCents: true,
          },
        },
      },
    }),
    db.opportunity.findMany({
      where: openOpportunityWhere,
      select: {
        id: true,
        stage: true,
        amountCents: true,
        ownerRepProfileId: true,
        targetCloseDate: true,
        createdAt: true,
        closeDate: true,
      },
    }),
    db.opportunity.findMany({
      where: closedWonOpportunityWhere,
      select: {
        id: true,
        stage: true,
        amountCents: true,
        ownerRepProfileId: true,
        createdAt: true,
        closeDate: true,
      },
    }),
    db.opportunity.findMany({
      where: closedOpportunityWhere,
      select: {
        id: true,
        stage: true,
        amountCents: true,
        ownerRepProfileId: true,
        createdAt: true,
        closeDate: true,
      },
    }),
  ]);

  const repNameById = new Map(repProfiles.map((rep) => [rep.id, rep.displayName]));
  const pipelineValueCents = opportunities.reduce(
    (sum, opportunity) => sum + (opportunity.amountCents ?? 0),
    0,
  );
  const weightedForecastValueCents = opportunities.reduce(
    (sum, opportunity) =>
      sum + Math.round((opportunity.amountCents ?? 0) * getStageWeight(opportunity.stage)),
    0,
  );
  const closedWonValueCents = closedWonOpportunities.reduce(
    (sum, opportunity) => sum + (opportunity.amountCents ?? 0),
    0,
  );
  const averageOpenDealSizeCents = opportunities.length
    ? Math.round(pipelineValueCents / opportunities.length)
    : 0;
  const winRatePercent = closedOpportunities.length
    ? Math.round((closedWonOpportunities.length / closedOpportunities.length) * 100)
    : 0;
  const closedWonWithCycle = closedWonOpportunities.filter(
    (opportunity) => opportunity.closeDate && opportunity.createdAt,
  );
  const averageSalesCycleDays = closedWonWithCycle.length
    ? Math.round(
        closedWonWithCycle.reduce((sum, opportunity) => {
          const closeDate = opportunity.closeDate ?? opportunity.createdAt;
          return sum + Math.max(0, closeDate.getTime() - opportunity.createdAt.getTime());
        }, 0) /
          closedWonWithCycle.length /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const overdueOpenOpportunities = opportunities.filter(
    (opportunity) => opportunity.targetCloseDate && opportunity.targetCloseDate.getTime() < Date.now(),
  ).length;
  const recentlyActiveCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const forecastByStage = [...openOpportunityStages].map((stage) => {
    const stageOpportunities = opportunities.filter((opportunity) => opportunity.stage === stage);
    const amountCents = stageOpportunities.reduce(
      (sum, opportunity) => sum + (opportunity.amountCents ?? 0),
      0,
    );

    return {
      stage,
      opportunityCount: stageOpportunities.length,
      amountCents,
      weightedAmountCents: Math.round(amountCents * getStageWeight(stage)),
    };
  });

  const repPerformance = repProfiles.map((rep) => {
    const repOpenOpportunities = rep.ownedOpportunities.filter((opportunity) =>
      openOpportunityStages.includes(opportunity.stage as (typeof openOpportunityStages)[number]),
    );
    const repClosedWon = closedWonOpportunities.filter(
      (opportunity) => opportunity.ownerRepProfileId === rep.id,
    );
    const repClosedTotal = closedOpportunities.filter(
      (opportunity) => opportunity.ownerRepProfileId === rep.id,
    );
    const repPipelineValueCents = repOpenOpportunities.reduce(
      (sum, opportunity) => sum + (opportunity.amountCents ?? 0),
      0,
    );

    return {
      repId: rep.id,
      repName: rep.displayName,
      lastLoginAt: rep.user.lastLoginAt,
      inviteStatus: (rep.user.invitationAcceptedAt
        ? 'accepted'
        : rep.user.invitationSentAt
          ? 'pending'
          : 'not_invited') as 'accepted' | 'pending' | 'not_invited',
      leadsOwned: rep.ownedLeads.length,
      newLeadsLast30Days: rep.ownedLeads.filter(
        (lead) => lead.createdAt.getTime() >= recentLeadWindowStart.getTime(),
      ).length,
      qualifiedLeads: rep.ownedLeads.filter((lead) =>
        ['qualified', 'proposal', 'won'].includes(lead.status),
      ).length,
      accountsOwned: rep.ownedAccounts.length,
      openOpportunities: repOpenOpportunities.length,
      pipelineValueCents: repPipelineValueCents,
      weightedForecastValueCents: repOpenOpportunities.reduce(
        (sum, opportunity) =>
          sum + Math.round((opportunity.amountCents ?? 0) * getStageWeight(opportunity.stage)),
        0,
      ),
      closedWonValueCents: repClosedWon.reduce(
        (sum, opportunity) => sum + (opportunity.amountCents ?? 0),
        0,
      ),
      averageDealSizeCents: repOpenOpportunities.length
        ? Math.round(repPipelineValueCents / repOpenOpportunities.length)
        : 0,
      winRatePercent: repClosedTotal.length
        ? Math.round((repClosedWon.length / repClosedTotal.length) * 100)
        : 0,
    };
  });

  return {
    totalLeads,
    recentLeads,
    totalAccounts,
    openOpportunities,
    activeReps: repProfiles.length,
    recentlyActiveReps: repProfiles.filter(
      (rep) => rep.user.lastLoginAt && rep.user.lastLoginAt.getTime() >= recentlyActiveCutoff.getTime(),
    ).length,
    pendingInvites: repProfiles.filter(
      (rep) => !rep.user.invitationAcceptedAt && Boolean(rep.user.invitationSentAt),
    ).length,
    pipelineValueCents,
    weightedForecastValueCents,
    closedWonValueCents,
    averageOpenDealSizeCents,
    winRatePercent,
    averageSalesCycleDays,
    overdueOpenOpportunities,
    leadsByStatus: groupedByStatus.map((entry) => ({
      status: entry.status,
      count: entry._count._all,
    })),
    leadsByRep: groupedByRep
      .map((entry) => ({
        repId: entry.repProfileId,
        repName: entry.repProfileId
          ? repNameById.get(entry.repProfileId) ?? 'Unassigned'
          : 'Unassigned',
        count: entry._count._all,
      }))
      .sort((a, b) => b.count - a.count),
    forecastByStage,
    repPerformance: repPerformance.sort(
      (left, right) => right.weightedForecastValueCents - left.weightedForecastValueCents,
    ),
  };
}

export async function getLeadsList(
  actor: AdminAccessActor,
  filters: LeadsListFilters = {},
  db: AdminDatabaseClient = getPrismaClient() as AdminDatabaseClient,
) {
  const scope = await getAdminScope(actor, db);

  return db.lead.findMany({
    where: buildScopedLeadWhere(scope, filters),
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      repProfile: {
        select: {
          id: true,
          displayName: true,
          slug: true,
          location: true,
        },
      },
      landingPage: {
        select: {
          id: true,
          slug: true,
          title: true,
        },
      },
    },
  });
}

export async function getLeadById(
  actor: AdminAccessActor,
  leadId: string,
  db: AdminDatabaseClient = getPrismaClient() as AdminDatabaseClient,
) {
  const scope = await getAdminScope(actor, db);

  return db.lead.findFirst({
    where: {
      id: leadId,
      ...(scope.unrestricted
        ? {}
        : {
            repProfileId: {
              in: scope.repProfileIds,
            },
          }),
    },
    include: {
      repProfile: {
        select: {
          id: true,
          displayName: true,
          slug: true,
          email: true,
          phone: true,
          location: true,
        },
      },
      landingPage: {
        select: {
          id: true,
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
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      linkedInProfileLinks: {
        include: {
          externalProfileSource: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      },
      employmentSnapshots: {
        include: {
          externalProfileSource: true,
        },
        orderBy: {
          retrievedAt: 'desc',
        },
      },
      employmentChangeEvents: {
        orderBy: {
          detectedAt: 'desc',
        },
      },
      profileMatchCandidates: {
        include: {
          externalProfileSource: true,
        },
        orderBy: [
          {
            confidenceScore: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      },
      relationshipHistory: {
        include: {
          externalProfileSource: true,
          repProfile: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
        orderBy: [
          {
            stage: 'asc',
          },
          {
            startDate: 'desc',
          },
        ],
      },
      relationshipMilestones: {
        orderBy: {
          occurredAt: 'desc',
        },
      },
      contactCompanyAssociations: {
        orderBy: [
          {
            isCurrent: 'desc',
          },
          {
            updatedAt: 'desc',
          },
        ],
      },
      championFlag: {
        include: {
          ownerRepProfile: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      },
      contactWatchlist: true,
      careerMovementAlerts: {
        include: {
          externalProfileSource: true,
          employmentChangeEvent: true,
        },
        orderBy: {
          triggeredAt: 'desc',
        },
      },
      expansionOpportunitySignals: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      repActionPrompts: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      outreachDrafts: {
        orderBy: {
          generatedAt: 'desc',
        },
      },
      repTaskSuggestions: {
        orderBy: [
          {
            priority: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      },
    },
  });
}

export async function getLeadActivityTimeline(
  actor: AdminAccessActor,
  leadId: string,
  db: AdminDatabaseClient = getPrismaClient() as AdminDatabaseClient,
) {
  const scope = await getAdminScope(actor, db);

  return db.activityLog.findMany({
    where: {
      leadId,
      ...(scope.unrestricted
        ? {}
        : {
            lead: {
              repProfileId: {
                in: scope.repProfileIds,
              },
            },
          }),
    },
    include: {
      actorUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      repProfile: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getRepProfiles(
  actor: AdminAccessActor,
  db: AdminDatabaseClient = getPrismaClient() as AdminDatabaseClient,
) {
  const scope = await getAdminScope(actor, db);

  return db.repProfile.findMany({
    where: scope.unrestricted
      ? undefined
      : {
          id: {
            in: scope.repProfileIds,
          },
        },
    orderBy: {
      displayName: 'asc',
    },
    include: {
      landingPages: {
        select: {
          id: true,
          slug: true,
          title: true,
          isPublished: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          lastLoginAt: true,
          invitationSentAt: true,
          invitationAcceptedAt: true,
          mustChangePassword: true,
          isActive: true,
        },
      },
      managerUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          ownedLeads: true,
          ownedAccounts: true,
          ownedOpportunities: true,
        },
      },
    },
  });
}

export async function getAccountsList(
  actor: AdminAccessActor,
  filters: AccountsListFilters = {},
  db: AdminDatabaseClient = getPrismaClient() as AdminDatabaseClient,
) {
  const scope = await getAdminScope(actor, db);

  return db.account.findMany({
    where: buildScopedAccountWhere(scope, filters),
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      ownerRepProfile: {
        select: {
          id: true,
          displayName: true,
        },
      },
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
        orderBy: [
          {
            isPrimary: 'desc',
          },
          {
            createdAt: 'asc',
          },
        ],
      },
      opportunities: {
        select: {
          id: true,
          name: true,
          stage: true,
          amountCents: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
}

export async function getOpportunitiesList(
  actor: AdminAccessActor,
  filters: OpportunitiesListFilters = {},
  db: AdminDatabaseClient = getPrismaClient() as AdminDatabaseClient,
) {
  const scope = await getAdminScope(actor, db);

  return db.opportunity.findMany({
    where: buildScopedOpportunityWhere(scope, filters),
    orderBy: [
      {
        targetCloseDate: 'asc',
      },
      {
        createdAt: 'desc',
      },
    ],
    include: {
      ownerRepProfile: {
        select: {
          id: true,
          displayName: true,
        },
      },
      account: {
        select: {
          id: true,
          name: true,
          status: true,
        },
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
}

export async function updateRepProfileBasic(
  actor: AdminAccessActor,
  repProfileId: string,
  input: UpdateRepProfileBasicInput,
  db: AdminDatabaseClient = getPrismaClient() as AdminDatabaseClient,
) {
  const scope = await getAdminScope(actor, db);
  const validated = updateRepProfileBasicSchema.parse(input);

  if (!scope.unrestricted && !scope.repProfileIds.includes(repProfileId)) {
    throw new Error('Forbidden');
  }

  return db.repProfile.update({
    where: { id: repProfileId },
    data: validated,
  });
}

export async function inviteRepUser(
  actor: AdminAccessActor,
  input: InviteRepInput,
  db: AdminDatabaseClient = getPrismaClient() as AdminDatabaseClient,
) {
  if (actor.role !== UserRole.super_admin && actor.role !== UserRole.sales_manager) {
    throw new Error('Forbidden');
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const existingUser = await db.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    throw new Error('A user with that email already exists');
  }

  const baseSlug = slugifyRepName(`${input.firstName} ${input.lastName}`);
  const slug = await generateUniqueRepSlug(baseSlug, db);
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const displayName = `${input.firstName.trim()} ${input.lastName.trim()}`;

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: displayName,
        email: normalizedEmail,
        passwordHash,
        role: UserRole.sales_rep,
        isActive: true,
        mustChangePassword: true,
        invitedByUserId: actor.id,
        invitationSentAt: new Date(),
      },
    });

    const repProfile = await tx.repProfile.create({
      data: {
        userId: user.id,
        managerUserId: actor.role === UserRole.sales_manager ? actor.id : undefined,
        slug,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        displayName,
        title: input.title.trim(),
        bio: input.bio?.trim() || `${displayName} is a Trainovations rep.`,
        email: normalizedEmail,
        phone: input.phone?.trim() || null,
        website: input.website?.trim() || null,
        location: input.location?.trim() || null,
        isActive: true,
      },
    });

    return {
      user,
      repProfile,
    };
  });

  return {
    ...result,
    temporaryPassword,
  };
}

export async function resendRepInvite(
  actor: AdminAccessActor,
  repProfileId: string,
  db: AdminDatabaseClient = getPrismaClient() as AdminDatabaseClient,
) {
  await assertScopedRepAccess(actor, repProfileId, db);

  const repProfile = await db.repProfile.findUnique({
    where: {
      id: repProfileId,
    },
    include: {
      user: true,
    },
  });

  if (!repProfile?.user) {
    throw new Error('Rep not found');
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const user = await db.user.update({
    where: {
      id: repProfile.user.id,
    },
    data: {
      passwordHash,
      mustChangePassword: true,
      invitationSentAt: new Date(),
      invitationAcceptedAt: null,
    },
  });

  return {
    user,
    repProfile,
    temporaryPassword,
  };
}

export async function offboardRepUser(
  actor: AdminAccessActor,
  repProfileId: string,
  reassignmentRepProfileId: string,
  db: AdminDatabaseClient = getPrismaClient() as AdminDatabaseClient,
) {
  const scope = await assertScopedRepAccess(actor, repProfileId, db);

  if (repProfileId === reassignmentRepProfileId) {
    throw new Error('Reassignment rep must be different');
  }

  if (!scope.unrestricted && !scope.repProfileIds.includes(reassignmentRepProfileId)) {
    throw new Error('Forbidden');
  }

  const [repProfile, reassignmentRep] = await Promise.all([
    db.repProfile.findUnique({
      where: { id: repProfileId },
      include: { user: true },
    }),
    db.repProfile.findUnique({
      where: { id: reassignmentRepProfileId },
      include: { user: true },
    }),
  ]);

  if (!repProfile?.user || !reassignmentRep?.user) {
    throw new Error('Rep not found');
  }

  await db.$transaction(async (tx) => {
    await Promise.all([
      tx.lead.updateMany({
        where: {
          repProfileId,
        },
        data: {
          repProfileId: reassignmentRepProfileId,
        },
      }),
      tx.account.updateMany({
        where: {
          ownerRepProfileId: repProfileId,
        },
        data: {
          ownerRepProfileId: reassignmentRepProfileId,
        },
      }),
      tx.opportunity.updateMany({
        where: {
          ownerRepProfileId: repProfileId,
        },
        data: {
          ownerRepProfileId: reassignmentRepProfileId,
        },
      }),
      tx.meeting.updateMany({
        where: {
          repProfileId,
        },
        data: {
          repProfileId: reassignmentRepProfileId,
        },
      }),
      tx.emailThread.updateMany({
        where: {
          repProfileId,
        },
        data: {
          repProfileId: reassignmentRepProfileId,
        },
      }),
      tx.emailDraft.updateMany({
        where: {
          repProfileId,
        },
        data: {
          repProfileId: reassignmentRepProfileId,
        },
      }),
      tx.activityLog.updateMany({
        where: {
          repProfileId,
        },
        data: {
          repProfileId: reassignmentRepProfileId,
        },
      }),
    ]);

    await tx.user.delete({
      where: {
        id: repProfile.user.id,
      },
    });
  });

  return {
    offboardedRepProfileId: repProfileId,
    reassignedToRepProfileId: reassignmentRepProfileId,
  };
}

// ─── Rep detail ───────────────────────────────────────────────────────────────

export interface AdminRepDetailProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  title: string;
  email: string;
  phone: string | null;
  website: string | null;
  location: string | null;
  bio: string;
  isActive: boolean;
  slug: string;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    lastLoginAt: Date | null;
    invitationSentAt: Date | null;
    invitationAcceptedAt: Date | null;
    mustChangePassword: boolean;
    isActive: boolean;
  };
  managerUser: { id: string; name: string | null; email: string } | null;
  landingPages: Array<{ id: string; slug: string; title: string; isPublished: boolean }>;
  leadCount: number;
  accountCount: number;
  opportunityCount: number;
  recentLeads: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    createdAt: Date;
  }>;
  recentAccounts: Array<{
    id: string;
    name: string;
    status: string;
    industry: string | null;
    createdAt: Date;
  }>;
  recentOpportunities: Array<{
    id: string;
    name: string;
    stage: string;
    amountCents: number | null;
    targetCloseDate: Date | null;
    createdAt: Date;
  }>;
  pipelineValueCents: number;
  closedWonValueCents: number;
  openDealCount: number;
}

export async function getAdminRepDetail(
  actor: AdminAccessActor,
  repProfileId: string,
  db: AdminDatabaseClient = getPrismaClient() as AdminDatabaseClient,
): Promise<AdminRepDetailProfile | null> {
  const scope = await getAdminScope(actor, db);

  // Scope check — managers can only view reps in their scope
  if (!scope.unrestricted && !scope.repProfileIds.includes(repProfileId)) {
    return null;
  }

  const rep = await db.repProfile.findUnique({
    where: { id: repProfileId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          lastLoginAt: true,
          invitationSentAt: true,
          invitationAcceptedAt: true,
          mustChangePassword: true,
          isActive: true,
        },
      },
      managerUser: { select: { id: true, name: true, email: true } },
      landingPages: {
        select: { id: true, slug: true, title: true, isPublished: true },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: {
          ownedLeads: true,
          ownedAccounts: true,
          ownedOpportunities: true,
        },
      },
    },
  });

  if (!rep) return null;

  const [recentLeads, recentAccounts, recentOpportunities] = await Promise.all([
    db.lead.findMany({
      where: { repProfileId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, firstName: true, lastName: true, email: true, status: true, createdAt: true },
    }),
    db.account.findMany({
      where: { ownerRepProfileId: repProfileId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, status: true, industry: true, createdAt: true },
    }),
    db.opportunity.findMany({
      where: { ownerRepProfileId: repProfileId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, stage: true, amountCents: true, targetCloseDate: true, createdAt: true },
    }),
  ]);

  const openDeals = recentOpportunities.filter(
    (o) => o.stage !== 'closed_won' && o.stage !== 'closed_lost',
  );
  const closedWon = recentOpportunities.filter((o) => o.stage === 'closed_won');

  return {
    id: rep.id,
    firstName: rep.firstName,
    lastName: rep.lastName,
    displayName: rep.displayName,
    title: rep.title,
    email: rep.email,
    phone: rep.phone,
    website: rep.website,
    location: rep.location,
    bio: rep.bio,
    isActive: rep.isActive,
    slug: rep.slug,
    createdAt: rep.createdAt,
    user: rep.user,
    managerUser: rep.managerUser,
    landingPages: rep.landingPages,
    leadCount: rep._count.ownedLeads,
    accountCount: rep._count.ownedAccounts,
    opportunityCount: rep._count.ownedOpportunities,
    recentLeads,
    recentAccounts,
    recentOpportunities,
    pipelineValueCents: openDeals.reduce((s, o) => s + (o.amountCents ?? 0), 0),
    closedWonValueCents: closedWon.reduce((s, o) => s + (o.amountCents ?? 0), 0),
    openDealCount: openDeals.length,
  };
}

// ─── Account detail ────────────────────────────────────────────────────────────

export interface AdminAccountDetail {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  status: string;
  hqLocation: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerRepProfile: { id: string; displayName: string; slug: string } | null;
  contacts: Array<{
    id: string;
    relationshipLabel: string | null;
    isPrimary: boolean;
    lead: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      status: string;
    };
  }>;
  opportunities: Array<{
    id: string;
    name: string;
    stage: string;
    amountCents: number | null;
    currency: string;
    targetCloseDate: Date | null;
    ownerRepProfile: { id: string; displayName: string } | null;
  }>;
  recentNotes: Array<{
    id: string;
    title: string | null;
    body: string;
    templateType: string;
    createdAt: Date;
    repProfile: { displayName: string } | null;
  }>;
  contactCount: number;
  opportunityCount: number;
  pipelineValueCents: number;
  closedWonValueCents: number;
}

export async function getAdminAccountDetail(
  actor: AdminAccessActor,
  accountId: string,
  db: AdminDatabaseClient = getPrismaClient() as AdminDatabaseClient,
): Promise<AdminAccountDetail | null> {
  const scope = await getAdminScope(actor, db);

  const account = await db.account.findUnique({
    where: { id: accountId },
    include: {
      ownerRepProfile: {
        select: { id: true, displayName: true, slug: true },
      },
      contacts: {
        include: {
          lead: {
            select: { id: true, firstName: true, lastName: true, email: true, status: true },
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      },
      opportunities: {
        include: {
          ownerRepProfile: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      repNotes: {
        include: {
          repProfile: { select: { displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      },
    },
  });

  if (!account) return null;

  // Scope check — managers can only view accounts belonging to their reps
  if (
    !scope.unrestricted &&
    account.ownerRepProfileId &&
    !scope.repProfileIds.includes(account.ownerRepProfileId)
  ) {
    return null;
  }

  const openDeals = account.opportunities.filter(
    (o) => o.stage !== 'closed_won' && o.stage !== 'closed_lost',
  );
  const closedWon = account.opportunities.filter((o) => o.stage === 'closed_won');

  return {
    id: account.id,
    name: account.name,
    domain: account.domain,
    industry: account.industry,
    status: account.status,
    hqLocation: account.hqLocation,
    description: account.description,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    ownerRepProfile: account.ownerRepProfile,
    contacts: account.contacts,
    opportunities: account.opportunities,
    recentNotes: account.repNotes.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      templateType: n.templateType,
      createdAt: n.createdAt,
      repProfile: n.repProfile,
    })),
    contactCount: account.contacts.length,
    opportunityCount: account.opportunities.length,
    pipelineValueCents: openDeals.reduce((s, o) => s + (o.amountCents ?? 0), 0),
    closedWonValueCents: closedWon.reduce((s, o) => s + (o.amountCents ?? 0), 0),
  };
}
