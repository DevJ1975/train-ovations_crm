/**
 * Proposal Engine Service
 * Core logic for the Interactive Proposal Engine.
 * Handles proposal lifecycle, block management, packages, and client interactions.
 */

import { randomBytes } from 'crypto';
import {
  ProposalStatus,
  ProposalBlockType,
  ProposalPaymentType,
  ProposalEventType,
  type Prisma,
} from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import type {
  CreateProposalInput,
  UpdateProposalMetaInput,
  CreateBlockInput,
  UpdateBlockInput,
  CreatePackageInput,
  ClientSignInput,
  ClientAcceptInput,
  ProposalEventInput,
} from '@/lib/validation/proposal-engine';
import { blockContentByType } from '@/lib/validation/proposal-engine';
import { fireProposalHooks } from './proposal-hook-service';

type DB = ReturnType<typeof getPrismaClient>;

// ─── Default block content ────────────────────────────────────────────────────

const DEFAULT_BLOCK_CONTENT: Record<ProposalBlockType, object> = {
  hero: { heading: 'Welcome', subheading: '', backgroundImageUrl: '', ctaText: 'View Proposal' },
  rich_text: { html: '<p>Add your content here...</p>' },
  image: { imageUrl: '', caption: '', altText: '', width: 'full' },
  gallery: { images: [], layout: 'grid' },
  video_embed: { videoUrl: '', caption: '', autoplay: false },
  testimonial: { quote: '', authorName: '', authorTitle: '', authorCompany: '', rating: 5 },
  problem_solution: { problemTitle: 'The Challenge', problemDescription: '', solutionTitle: 'Our Solution', solutionDescription: '' },
  deliverables: { items: [{ title: 'Deliverable 1', description: '' }], columns: 2 },
  scope: { included: ['Item 1'], excluded: [] },
  timeline: { phases: [{ title: 'Phase 1', description: '', duration: '2 weeks', startOffset: 'Week 1' }] },
  faq: { items: [{ question: 'How does it work?', answer: '' }] },
  pricing_table: { showComparison: false, highlight: '' },
  package_selector: { allowMultiple: false, instruction: 'Select the package that best fits your needs.' },
  add_ons: { title: 'Optional Add-ons', description: 'Enhance your package with these optional services.' },
  roi_value: { headline: 'Return on Investment', metrics: [{ label: 'ROI', value: '3x', description: '' }] },
  cta: { heading: 'Ready to get started?', subheading: '', buttonText: 'Accept Proposal', buttonAction: 'scroll_to_signature', buttonUrl: '' },
  signature: { instruction: 'Please sign below to accept this proposal.', requireFullName: true, requireTitle: false, requireDate: true, agreementText: '' },
  payment: { title: 'Payment', description: '', showPackageSummary: true },
  scheduling: { heading: 'Schedule a Kickoff Call', description: '', schedulingUrl: '', embedType: 'link' },
};

// ─── Read helpers ─────────────────────────────────────────────────────────────

const proposalEngineSelect = {
  id: true,
  repProfileId: true,
  leadId: true,
  accountId: true,
  opportunityId: true,
  templateId: true,
  title: true,
  status: true,
  useBlockEngine: true,
  clientName: true,
  clientEmail: true,
  clientCompany: true,
  coverImageUrl: true,
  brandColor: true,
  fontFamily: true,
  footerText: true,
  totalValueCents: true,
  paymentType: true,
  depositPercent: true,
  schedulingUrl: true,
  stripeSessionId: true,
  stripePaymentIntentId: true,
  paidAt: true,
  partiallyPaidAt: true,
  expiresAt: true,
  sentAt: true,
  viewedAt: true,
  acceptedAt: true,
  declinedAt: true,
  shareToken: true,
  aiGeneratedAt: true,
  signatureData: true,
  signerName: true,
  signerEmail: true,
  signerTitle: true,
  signedAt: true,
  createdAt: true,
  updatedAt: true,
  // Legacy fields
  executiveSummary: true,
  aboutUs: true,
  scopeOfWork: true,
  pricing: true,
  terms: true,
  lead: { select: { id: true, firstName: true, lastName: true, company: true, email: true } },
  account: { select: { id: true, name: true, industry: true } },
  opportunity: { select: { id: true, name: true, stage: true, amountCents: true } },
  repProfile: {
    select: {
      displayName: true,
      title: true,
      email: true,
      phone: true,
      slug: true,
      photoUrl: true,
      signatureProfile: { select: { companyName: true, website: true, logoUrl: true } },
    },
  },
  blocks: {
    where: { isVisible: true },
    orderBy: { position: 'asc' as const },
    select: { id: true, blockType: true, position: true, isVisible: true, content: true },
  },
  packages: {
    orderBy: { position: 'asc' as const },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      isRecurring: true,
      recurringPeriod: true,
      isFeatured: true,
      position: true,
      features: true,
      addOns: {
        orderBy: { position: 'asc' as const },
        select: { id: true, name: true, description: true, priceCents: true, isOptional: true, position: true },
      },
    },
  },
} as const;

async function getRepProfileId(userId: string, db: DB): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { repProfile: { select: { id: true } } },
  });
  return user?.repProfile?.id ?? null;
}

async function assertOwnership(userId: string, proposalId: string, db: DB) {
  const repProfileId = await getRepProfileId(userId, db);
  if (!repProfileId) throw new Error('Rep profile not found');
  const proposal = await db.proposal.findFirst({ where: { id: proposalId, repProfileId } });
  if (!proposal) throw new Error('Proposal not found or access denied');
  return { repProfileId, proposal };
}

// ─── Proposal CRUD ────────────────────────────────────────────────────────────

export async function createProposalWithBlocks(
  userId: string,
  input: CreateProposalInput,
  db: DB = getPrismaClient(),
) {
  const repProfileId = await getRepProfileId(userId, db);
  if (!repProfileId) throw new Error('Rep profile not found');

  const proposal = await db.proposal.create({
    data: {
      repProfileId,
      title: input.title,
      leadId: input.leadId ?? null,
      accountId: input.accountId ?? null,
      opportunityId: input.opportunityId ?? null,
      templateId: input.templateId ?? null,
      clientName: input.clientName ?? null,
      clientEmail: input.clientEmail ?? null,
      clientCompany: input.clientCompany ?? null,
      useBlockEngine: input.useBlockEngine ?? true,
    },
    select: proposalEngineSelect,
  });

  // If a template was specified, copy its blocks
  if (input.templateId) {
    await applyTemplateToProposal(proposal.id, input.templateId, db);
  }

  await fireProposalHooks('proposal.created', {
    proposalId: proposal.id,
    repProfileId,
    title: proposal.title,
  });

  return db.proposal.findUnique({ where: { id: proposal.id }, select: proposalEngineSelect });
}

export async function getProposalEngine(userId: string, proposalId: string, db: DB = getPrismaClient()) {
  const repProfileId = await getRepProfileId(userId, db);
  if (!repProfileId) return null;
  return db.proposal.findFirst({ where: { id: proposalId, repProfileId }, select: proposalEngineSelect });
}

export async function listProposalsEngine(userId: string, db: DB = getPrismaClient()) {
  const repProfileId = await getRepProfileId(userId, db);
  if (!repProfileId) return [];
  return db.proposal.findMany({
    where: { repProfileId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      clientName: true,
      clientEmail: true,
      clientCompany: true,
      totalValueCents: true,
      sentAt: true,
      viewedAt: true,
      acceptedAt: true,
      signedAt: true,
      paidAt: true,
      expiresAt: true,
      shareToken: true,
      useBlockEngine: true,
      createdAt: true,
      updatedAt: true,
      lead: { select: { id: true, firstName: true, lastName: true, company: true } },
      account: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true } },
      _count: { select: { analyticsEvents: true, blocks: true } },
    },
  });
}

export async function updateProposalMeta(
  userId: string,
  proposalId: string,
  input: UpdateProposalMetaInput,
  db: DB = getPrismaClient(),
) {
  await assertOwnership(userId, proposalId, db);
  return db.proposal.update({
    where: { id: proposalId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.clientName !== undefined && { clientName: input.clientName }),
      ...(input.clientEmail !== undefined && { clientEmail: input.clientEmail }),
      ...(input.clientCompany !== undefined && { clientCompany: input.clientCompany }),
      ...(input.brandColor !== undefined && { brandColor: input.brandColor }),
      ...(input.fontFamily !== undefined && { fontFamily: input.fontFamily }),
      ...(input.footerText !== undefined && { footerText: input.footerText }),
      ...(input.coverImageUrl !== undefined && { coverImageUrl: input.coverImageUrl }),
      ...(input.schedulingUrl !== undefined && { schedulingUrl: input.schedulingUrl }),
      ...(input.expiresAt !== undefined && { expiresAt: new Date(input.expiresAt) }),
      ...(input.paymentType !== undefined && { paymentType: input.paymentType as ProposalPaymentType }),
      ...(input.depositPercent !== undefined && { depositPercent: input.depositPercent }),
      ...(input.totalValueCents !== undefined && { totalValueCents: input.totalValueCents }),
    },
    select: proposalEngineSelect,
  });
}

export async function sendProposal(userId: string, proposalId: string, db: DB = getPrismaClient()) {
  const { repProfileId } = await assertOwnership(userId, proposalId, db);
  const shareToken = randomBytes(24).toString('base64url');

  const proposal = await db.proposal.update({
    where: { id: proposalId },
    data: { status: ProposalStatus.sent, sentAt: new Date(), shareToken },
    select: proposalEngineSelect,
  });

  await fireProposalHooks('proposal.sent', {
    proposalId,
    repProfileId,
    shareToken,
    clientEmail: proposal.clientEmail,
  });

  return proposal;
}

export async function deleteProposalEngine(userId: string, proposalId: string, db: DB = getPrismaClient()) {
  await assertOwnership(userId, proposalId, db);
  await db.proposal.delete({ where: { id: proposalId } });
}

// ─── Block Management ─────────────────────────────────────────────────────────

export async function addBlock(
  userId: string,
  proposalId: string,
  input: CreateBlockInput,
  db: DB = getPrismaClient(),
) {
  await assertOwnership(userId, proposalId, db);

  const blockType = input.blockType as ProposalBlockType;

  // Determine position (append by default)
  let position = input.position;
  if (position === undefined) {
    const last = await db.proposalBlock.findFirst({
      where: { proposalId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    position = (last?.position ?? -1) + 1;
  } else {
    // Shift existing blocks to make room
    await db.proposalBlock.updateMany({
      where: { proposalId, position: { gte: position } },
      data: { position: { increment: 1 } },
    });
  }

  // Validate + merge content
  const defaultContent = DEFAULT_BLOCK_CONTENT[blockType];
  const rawContent = { ...defaultContent, ...(input.content ?? {}) };
  const schema = blockContentByType[blockType as keyof typeof blockContentByType];
  const content = schema ? schema.parse(rawContent) : rawContent;

  return db.proposalBlock.create({
    data: { proposalId, blockType, position, content: content as Prisma.InputJsonValue },
    select: { id: true, blockType: true, position: true, isVisible: true, content: true },
  });
}

export async function updateBlock(
  userId: string,
  proposalId: string,
  blockId: string,
  input: UpdateBlockInput,
  db: DB = getPrismaClient(),
) {
  await assertOwnership(userId, proposalId, db);

  const block = await db.proposalBlock.findFirst({ where: { id: blockId, proposalId } });
  if (!block) throw new Error('Block not found');

  // Validate updated content
  const schema = blockContentByType[block.blockType as keyof typeof blockContentByType];
  const content = schema ? schema.parse(input.content) : input.content;

  return db.proposalBlock.update({
    where: { id: blockId },
    data: {
      content: content as Prisma.InputJsonValue,
      ...(input.isVisible !== undefined && { isVisible: input.isVisible }),
    },
    select: { id: true, blockType: true, position: true, isVisible: true, content: true },
  });
}

export async function deleteBlock(
  userId: string,
  proposalId: string,
  blockId: string,
  db: DB = getPrismaClient(),
) {
  await assertOwnership(userId, proposalId, db);
  const block = await db.proposalBlock.findFirst({ where: { id: blockId, proposalId } });
  if (!block) throw new Error('Block not found');
  await db.proposalBlock.delete({ where: { id: blockId } });
}

export async function reorderBlocks(
  userId: string,
  proposalId: string,
  orderedIds: string[],
  db: DB = getPrismaClient(),
) {
  await assertOwnership(userId, proposalId, db);

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.proposalBlock.update({ where: { id }, data: { position: index } }),
    ),
  );
}

// ─── Pricing Packages ─────────────────────────────────────────────────────────

export async function addPackage(
  userId: string,
  proposalId: string,
  input: CreatePackageInput,
  db: DB = getPrismaClient(),
) {
  await assertOwnership(userId, proposalId, db);

  const count = await db.proposalPricingPackage.count({ where: { proposalId } });

  return db.proposalPricingPackage.create({
    data: {
      proposalId,
      name: input.name,
      description: input.description ?? null,
      priceCents: input.priceCents,
      isRecurring: input.isRecurring,
      recurringPeriod: input.recurringPeriod ?? null,
      isFeatured: input.isFeatured,
      position: count,
      features: input.features,
      addOns: input.addOns
        ? {
            create: input.addOns.map((a, i) => ({
              name: a.name,
              description: a.description ?? null,
              priceCents: a.priceCents,
              isOptional: a.isOptional,
              position: i,
            })),
          }
        : undefined,
    },
    include: { addOns: { orderBy: { position: 'asc' } } },
  });
}

export async function updatePackage(
  userId: string,
  proposalId: string,
  packageId: string,
  input: Partial<CreatePackageInput>,
  db: DB = getPrismaClient(),
) {
  await assertOwnership(userId, proposalId, db);
  const pkg = await db.proposalPricingPackage.findFirst({ where: { id: packageId, proposalId } });
  if (!pkg) throw new Error('Package not found');

  return db.proposalPricingPackage.update({
    where: { id: packageId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.priceCents !== undefined && { priceCents: input.priceCents }),
      ...(input.isRecurring !== undefined && { isRecurring: input.isRecurring }),
      ...(input.recurringPeriod !== undefined && { recurringPeriod: input.recurringPeriod }),
      ...(input.isFeatured !== undefined && { isFeatured: input.isFeatured }),
      ...(input.features !== undefined && { features: input.features }),
    },
    include: { addOns: { orderBy: { position: 'asc' } } },
  });
}

export async function deletePackage(
  userId: string,
  proposalId: string,
  packageId: string,
  db: DB = getPrismaClient(),
) {
  await assertOwnership(userId, proposalId, db);
  const pkg = await db.proposalPricingPackage.findFirst({ where: { id: packageId, proposalId } });
  if (!pkg) throw new Error('Package not found');
  await db.proposalPricingPackage.delete({ where: { id: packageId } });
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function listTemplates(userId: string, db: DB = getPrismaClient()) {
  const repProfileId = await getRepProfileId(userId, db);
  return db.proposalTemplate.findMany({
    where: { OR: [{ isGlobal: true }, ...(repProfileId ? [{ repProfileId }] : [])] },
    orderBy: [{ isGlobal: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      isGlobal: true,
      previewUrl: true,
      createdAt: true,
      _count: { select: { blocks: true } },
    },
  });
}

export async function applyTemplateToProposal(
  proposalId: string,
  templateId: string,
  db: DB = getPrismaClient(),
) {
  const templateBlocks = await db.proposalTemplateBlock.findMany({
    where: { templateId },
    orderBy: { position: 'asc' },
  });

  if (templateBlocks.length === 0) return;

  await db.proposalBlock.createMany({
    data: templateBlocks.map((tb) => ({
      proposalId,
      blockType: tb.blockType,
      position: tb.position,
      content: tb.content as Prisma.InputJsonValue,
    })),
  });
}

export async function saveProposalAsTemplate(
  userId: string,
  proposalId: string,
  name: string,
  description: string | undefined,
  db: DB = getPrismaClient(),
) {
  const repProfileId = await getRepProfileId(userId, db);
  if (!repProfileId) throw new Error('Rep profile not found');

  const proposal = await db.proposal.findFirst({
    where: { id: proposalId, repProfileId },
    include: { blocks: { orderBy: { position: 'asc' } } },
  });
  if (!proposal) throw new Error('Proposal not found');

  const template = await db.proposalTemplate.create({
    data: {
      repProfileId,
      name,
      description: description ?? null,
      blocks: {
        create: proposal.blocks.map((b) => ({
          blockType: b.blockType,
          position: b.position,
          content: b.content as Prisma.InputJsonValue,
        })),
      },
    },
    include: { blocks: true },
  });

  return template;
}

// ─── Public / Client-Facing ───────────────────────────────────────────────────

export async function getProposalByToken(token: string, db: DB = getPrismaClient()) {
  return db.proposal.findUnique({
    where: { shareToken: token },
    select: proposalEngineSelect,
  });
}

export async function recordProposalView(token: string, db: DB = getPrismaClient()) {
  const proposal = await db.proposal.findUnique({ where: { shareToken: token }, select: { id: true, status: true, viewedAt: true } });
  if (!proposal) return null;

  const updates: Prisma.ProposalUpdateInput = {};
  if (!proposal.viewedAt) {
    updates.viewedAt = new Date();
    if (proposal.status === ProposalStatus.sent) {
      updates.status = ProposalStatus.viewed;
    }
  }

  if (Object.keys(updates).length > 0) {
    await db.proposal.update({ where: { id: proposal.id }, data: updates });
  }

  await db.proposalAnalyticsEvent.create({
    data: { proposalId: proposal.id, eventType: ProposalEventType.viewed },
  });

  return proposal;
}

export async function trackProposalEvent(
  token: string,
  input: ProposalEventInput,
  context: { ipAddress?: string; userAgent?: string },
  db: DB = getPrismaClient(),
) {
  const proposal = await db.proposal.findUnique({ where: { shareToken: token }, select: { id: true } });
  if (!proposal) return;

  await db.proposalAnalyticsEvent.create({
    data: {
      proposalId: proposal.id,
      eventType: input.eventType as ProposalEventType,
      sessionId: input.sessionId ?? null,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
      metadata: input.metadata as Prisma.InputJsonValue ?? null,
    },
  });
}

export async function clientSignProposal(
  token: string,
  input: ClientSignInput,
  db: DB = getPrismaClient(),
) {
  const proposal = await db.proposal.findUnique({
    where: { shareToken: token },
    select: { id: true, status: true, repProfileId: true },
  });
  if (!proposal) throw new Error('Proposal not found');
  if (proposal.status === ProposalStatus.declined || proposal.status === ProposalStatus.expired) {
    throw new Error('Proposal is no longer active');
  }

  const updated = await db.proposal.update({
    where: { id: proposal.id },
    data: {
      status: ProposalStatus.signed,
      signedAt: new Date(),
      signerName: input.signerName,
      signerEmail: input.signerEmail,
      signerTitle: input.signerTitle ?? null,
      signatureData: input.signatureData,
    },
    select: proposalEngineSelect,
  });

  await db.proposalAnalyticsEvent.create({
    data: { proposalId: proposal.id, eventType: ProposalEventType.signed },
  });

  await fireProposalHooks('proposal.signed', {
    proposalId: proposal.id,
    repProfileId: proposal.repProfileId,
    signerName: input.signerName,
    signerEmail: input.signerEmail,
  });

  return updated;
}

export async function clientDeclineProposal(token: string, reason: string | undefined, db: DB = getPrismaClient()) {
  const proposal = await db.proposal.findUnique({
    where: { shareToken: token },
    select: { id: true, status: true, repProfileId: true },
  });
  if (!proposal) throw new Error('Proposal not found');

  const updated = await db.proposal.update({
    where: { id: proposal.id },
    data: { status: ProposalStatus.declined, declinedAt: new Date() },
    select: { id: true, status: true },
  });

  await db.proposalAnalyticsEvent.create({
    data: {
      proposalId: proposal.id,
      eventType: ProposalEventType.declined,
      metadata: reason ? { reason } : null,
    },
  });

  await fireProposalHooks('proposal.declined', {
    proposalId: proposal.id,
    repProfileId: proposal.repProfileId,
    reason,
  });

  return updated;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getProposalAnalytics(
  userId: string,
  proposalId: string,
  db: DB = getPrismaClient(),
) {
  const repProfileId = await getRepProfileId(userId, db);
  if (!repProfileId) throw new Error('Not authorized');

  const proposal = await db.proposal.findFirst({
    where: { id: proposalId, repProfileId },
    select: { id: true, title: true, sentAt: true, viewedAt: true, acceptedAt: true, signedAt: true, paidAt: true },
  });
  if (!proposal) throw new Error('Proposal not found');

  const events = await db.proposalAnalyticsEvent.findMany({
    where: { proposalId },
    orderBy: { occurredAt: 'desc' },
    select: { id: true, eventType: true, sessionId: true, metadata: true, occurredAt: true },
  });

  const viewCount = events.filter((e) => e.eventType === 'viewed').length;
  const uniqueSessions = new Set(events.map((e) => e.sessionId).filter(Boolean)).size;
  const packageSelections = events.filter((e) => e.eventType === 'package_selected').length;
  const timeToView = proposal.sentAt && proposal.viewedAt
    ? Math.round((proposal.viewedAt.getTime() - proposal.sentAt.getTime()) / 60000)
    : null;
  const timeToSign = proposal.viewedAt && proposal.signedAt
    ? Math.round((proposal.signedAt.getTime() - proposal.viewedAt.getTime()) / 60000)
    : null;

  return {
    proposal,
    summary: { viewCount, uniqueSessions, packageSelections, timeToViewMinutes: timeToView, timeToSignMinutes: timeToSign },
    events,
  };
}
