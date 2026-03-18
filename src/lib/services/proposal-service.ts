import { randomBytes } from 'crypto';
import { ProposalStatus } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import type { ProposalContext } from '@/lib/ai/proposal-generator';

import type { DatabaseClient } from './types';

interface ProposalDatabaseClient extends DatabaseClient {
  user: ReturnType<typeof getPrismaClient>['user'];
  proposal: ReturnType<typeof getPrismaClient>['proposal'];
  repNote: ReturnType<typeof getPrismaClient>['repNote'];
  meeting: ReturnType<typeof getPrismaClient>['meeting'];
}

export interface ProposalListItem {
  id: string;
  title: string;
  status: ProposalStatus;
  totalValueCents: number | null;
  aiGeneratedAt: Date | null;
  sentAt: Date | null;
  expiresAt: Date | null;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  lead: { id: string; firstName: string; lastName: string } | null;
  account: { id: string; name: string } | null;
  opportunity: { id: string; name: string } | null;
}

export interface ProposalDetail extends ProposalListItem {
  executiveSummary: string | null;
  aboutUs: string | null;
  scopeOfWork: string | null;
  deliverables: string | null;
  timeline: string | null;
  pricing: string | null;
  terms: string | null;
  nextSteps: string | null;
}

async function getRepProfileIdForUser(
  userId: string,
  db: ProposalDatabaseClient,
): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { repProfile: { select: { id: true } } },
  });
  return user?.repProfile?.id ?? null;
}

const proposalSelect = {
  id: true,
  title: true,
  status: true,
  totalValueCents: true,
  aiGeneratedAt: true,
  sentAt: true,
  expiresAt: true,
  shareToken: true,
  createdAt: true,
  updatedAt: true,
  executiveSummary: true,
  aboutUs: true,
  scopeOfWork: true,
  deliverables: true,
  timeline: true,
  pricing: true,
  terms: true,
  nextSteps: true,
  lead: { select: { id: true, firstName: true, lastName: true } },
  account: { select: { id: true, name: true } },
  opportunity: { select: { id: true, name: true } },
} as const;

export async function getRepProposals(
  userId: string,
  db: ProposalDatabaseClient = getPrismaClient() as ProposalDatabaseClient,
): Promise<ProposalListItem[]> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) return [];

  return db.proposal.findMany({
    where: { repProfileId },
    orderBy: { updatedAt: 'desc' },
    select: proposalSelect,
  });
}

export async function getRepProposalById(
  userId: string,
  proposalId: string,
  db: ProposalDatabaseClient = getPrismaClient() as ProposalDatabaseClient,
): Promise<ProposalDetail | null> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) return null;

  return db.proposal.findFirst({
    where: { id: proposalId, repProfileId },
    select: proposalSelect,
  });
}

export async function getProposalByShareToken(
  token: string,
  db: ProposalDatabaseClient = getPrismaClient() as ProposalDatabaseClient,
): Promise<ProposalDetail | null> {
  return db.proposal.findUnique({
    where: { shareToken: token },
    select: {
      ...proposalSelect,
      repProfile: {
        select: {
          displayName: true,
          title: true,
          email: true,
          phone: true,
          signatureProfile: {
            select: { companyName: true, website: true, address: true },
          },
        },
      },
    },
  }) as Promise<ProposalDetail | null>;
}

export async function createRepProposal(
  userId: string,
  input: {
    title: string;
    leadId?: string;
    accountId?: string;
    opportunityId?: string;
  },
  db: ProposalDatabaseClient = getPrismaClient() as ProposalDatabaseClient,
): Promise<ProposalDetail> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) throw new Error('Rep profile not found');

  return db.proposal.create({
    data: {
      repProfileId,
      title: input.title,
      leadId: input.leadId || null,
      accountId: input.accountId || null,
      opportunityId: input.opportunityId || null,
    },
    select: proposalSelect,
  });
}

export async function updateRepProposal(
  userId: string,
  proposalId: string,
  data: Partial<{
    title: string;
    executiveSummary: string;
    aboutUs: string;
    scopeOfWork: string;
    deliverables: string;
    timeline: string;
    pricing: string;
    terms: string;
    nextSteps: string;
    totalValueCents: number | null;
    aiGeneratedAt: Date;
  }>,
  db: ProposalDatabaseClient = getPrismaClient() as ProposalDatabaseClient,
): Promise<ProposalDetail> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) throw new Error('Rep profile not found');

  const existing = await db.proposal.findFirst({ where: { id: proposalId, repProfileId } });
  if (!existing) throw new Error('Proposal not found or access denied');

  return db.proposal.update({
    where: { id: proposalId },
    data,
    select: proposalSelect,
  });
}

export async function markProposalSent(
  userId: string,
  proposalId: string,
  db: ProposalDatabaseClient = getPrismaClient() as ProposalDatabaseClient,
): Promise<ProposalDetail> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) throw new Error('Rep profile not found');

  const existing = await db.proposal.findFirst({ where: { id: proposalId, repProfileId } });
  if (!existing) throw new Error('Proposal not found or access denied');

  const shareToken = existing.shareToken ?? randomBytes(20).toString('base64url');

  return db.proposal.update({
    where: { id: proposalId },
    data: {
      status: ProposalStatus.sent,
      sentAt: new Date(),
      shareToken,
    },
    select: proposalSelect,
  });
}

export async function updateProposalStatus(
  userId: string,
  proposalId: string,
  status: ProposalStatus,
  db: ProposalDatabaseClient = getPrismaClient() as ProposalDatabaseClient,
): Promise<ProposalDetail> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) throw new Error('Rep profile not found');

  const existing = await db.proposal.findFirst({ where: { id: proposalId, repProfileId } });
  if (!existing) throw new Error('Proposal not found or access denied');

  return db.proposal.update({
    where: { id: proposalId },
    data: { status },
    select: proposalSelect,
  });
}

export async function deleteRepProposal(
  userId: string,
  proposalId: string,
  db: ProposalDatabaseClient = getPrismaClient() as ProposalDatabaseClient,
): Promise<void> {
  const repProfileId = await getRepProfileIdForUser(userId, db);
  if (!repProfileId) throw new Error('Rep profile not found');

  const existing = await db.proposal.findFirst({ where: { id: proposalId, repProfileId } });
  if (!existing) throw new Error('Proposal not found or access denied');

  await db.proposal.delete({ where: { id: proposalId } });
}

// ─── Context Loader (feeds AI generator) ─────────────────────────────────────

export async function loadProposalContext(
  userId: string,
  proposalId: string,
  db = getPrismaClient(),
): Promise<ProposalContext> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      repProfile: {
        include: {
          signatureProfile: true,
        },
      },
    },
  });

  if (!user?.repProfile) throw new Error('Rep profile not found');

  const rep = user.repProfile;

  const proposal = await db.proposal.findFirst({
    where: { id: proposalId, repProfileId: rep.id },
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          jobTitle: true,
          email: true,
          interest: true,
        },
      },
      account: {
        select: {
          id: true,
          name: true,
          domain: true,
          industry: true,
          hqLocation: true,
          description: true,
        },
      },
      opportunity: {
        select: {
          id: true,
          name: true,
          stage: true,
          amountCents: true,
          targetCloseDate: true,
          description: true,
        },
      },
    },
  });

  if (!proposal) throw new Error('Proposal not found');

  // Load related rep notes (from linked lead/account/opp)
  const notes = await db.repNote.findMany({
    where: {
      repProfileId: rep.id,
      OR: [
        ...(proposal.leadId ? [{ leadId: proposal.leadId }] : []),
        ...(proposal.accountId ? [{ accountId: proposal.accountId }] : []),
        ...(proposal.opportunityId ? [{ opportunityId: proposal.opportunityId }] : []),
      ],
    },
    select: { title: true, body: true, templateType: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Load meeting summaries for the linked lead
  const meetings = proposal.leadId
    ? await db.meeting.findMany({
        where: {
          repProfileId: rep.id,
          leadId: proposal.leadId,
          callSummary: { isNot: null },
        },
        select: {
          topic: true,
          callSummary: {
            select: { summary: true, recommendedNextStep: true },
          },
        },
        orderBy: { startAt: 'desc' },
        take: 3,
      })
    : [];

  return {
    rep: {
      displayName: rep.displayName,
      title: rep.title,
      email: rep.email,
      phone: rep.phone ?? null,
      signatureCompany: rep.signatureProfile?.companyName ?? null,
      signatureJobTitle: rep.signatureProfile?.jobTitle ?? null,
      signatureWebsite: rep.signatureProfile?.website ?? null,
      signatureAddress: rep.signatureProfile?.address ?? null,
    },
    lead: proposal.lead ?? null,
    account: proposal.account ?? null,
    opportunity: proposal.opportunity ?? null,
    notes: notes.map((n) => ({
      title: n.title,
      body: n.body,
      templateType: n.templateType,
    })),
    meetingSummaries: meetings
      .filter((m) => m.callSummary)
      .map((m) => ({
        topic: m.topic,
        summary: m.callSummary?.summary ?? null,
        recommendedNextStep: m.callSummary?.recommendedNextStep ?? null,
      })),
  };
}
