import {
  ActivityLogType,
  CallSummaryStatus,
  EmailDraftStatus,
  EmailDraftType,
  LeadNoteSourceType,
  MeetingArtifactStatus,
  MeetingArtifactType,
  Prisma,
} from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import { EmailTemplateService } from '@/lib/email/email-template-service';
import { createActivityLogEntry } from '@/lib/services/activity-log-service';
import { createLeadNote } from '@/lib/services/lead-service';
import type { DatabaseClient } from '@/lib/services/types';
import {
  createActionItemSchema,
  createCallSummarySchema,
  createEmailDraftSchema,
} from '@/lib/validation/meeting-intelligence';

type JsonRecord = Prisma.InputJsonValue & Record<string, unknown>;

interface MeetingIntelligenceSource {
  artifactId: string;
  type: MeetingArtifactType;
  status: MeetingArtifactStatus;
  title: string | null;
  contentText: string | null;
  sourceUrl: string | null;
}

export interface MeetingFactSnapshot {
  meetingId: string;
  topic: string;
  startAt?: Date | null;
  endAt?: Date | null;
  hostEmail?: string | null;
  participantCount: number;
  hasTranscript: boolean;
  hasRecording: boolean;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    company?: string | null;
    email: string;
    interest?: string | null;
  } | null;
  rep: {
    id: string;
    displayName: string;
    title: string;
    email: string;
    signatureCompany?: string | null;
    signaturePhone?: string | null;
  } | null;
  participants: Array<{
    displayName: string;
    email?: string | null;
  }>;
}

export interface MeetingEvidenceBundle {
  primarySource: 'transcript' | 'chat' | 'metadata_only';
  sourceArtifactIds: string[];
  text: string;
  availableArtifacts: MeetingIntelligenceSource[];
}

export interface MeetingSummaryOutput {
  summary: string;
  keyDiscussionPoints: string[];
  recommendedNextStep: string;
  followUpSnippet: string;
  modelName: string;
  generationProvider: string;
  generatedAt: Date;
  generationMetadata: JsonRecord;
}

export interface ActionItemOutput {
  description: string;
  assigneeName?: string;
  sourceExcerpt?: string;
  confidenceLabel: 'high' | 'medium' | 'low';
  generatedAt: Date;
  providerMetadata: JsonRecord;
}

export interface FollowUpEmailDraftOutput {
  subject: string;
  bodyText: string;
  recipientEmail?: string;
  modelName: string;
  generationProvider: string;
  generatedAt: Date;
  generationMetadata: JsonRecord;
}

export interface MeetingIntelligenceProvider {
  readonly providerName: string;
  readonly modelName: string;
  summarizeMeeting(input: {
    facts: MeetingFactSnapshot;
    evidence: MeetingEvidenceBundle;
  }): Promise<MeetingSummaryOutput>;
  extractActionItems(input: {
    facts: MeetingFactSnapshot;
    evidence: MeetingEvidenceBundle;
    summary: MeetingSummaryOutput;
  }): Promise<ActionItemOutput[]>;
  draftFollowUpEmail(input: {
    facts: MeetingFactSnapshot;
    evidence: MeetingEvidenceBundle;
    summary: MeetingSummaryOutput;
    actionItems: ActionItemOutput[];
  }): Promise<FollowUpEmailDraftOutput>;
  recommendNextStep(input: {
    facts: MeetingFactSnapshot;
    evidence: MeetingEvidenceBundle;
    summary?: string;
  }): Promise<string>;
}

export interface GenerateMeetingIntelligenceResult {
  callSummary: {
    id: string;
    status: CallSummaryStatus;
    summary: string | null;
  };
  actionItems: Array<{
    id: string;
    description: string;
  }>;
  emailDraft: {
    id: string;
    subject: string;
    status: EmailDraftStatus;
  };
  evidence: MeetingEvidenceBundle;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function toSentenceCase(value: string) {
  const trimmed = normalizeWhitespace(value);

  if (!trimmed) {
    return trimmed;
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function splitEvidenceLines(text: string) {
  return text
    .split(/[\n\r]+|(?<=[.!?])\s+/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
}

function toPoint(value: string) {
  return toSentenceCase(value.replace(/^[\-\*\d\.\)\s]+/, ''));
}

function trimExcerpt(value: string, max = 160) {
  const normalized = normalizeWhitespace(value);

  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function formatMeetingDate(date?: Date | null) {
  return date
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date)
    : 'today';
}

function extractEvidence(meeting: MeetingIntelligenceContext) {
  const transcriptArtifacts = meeting.artifacts.filter(
    (artifact) =>
      artifact.type === MeetingArtifactType.transcript &&
      artifact.status === MeetingArtifactStatus.available &&
      artifact.contentText,
  );
  const chatArtifacts = meeting.artifacts.filter(
    (artifact) =>
      artifact.type === MeetingArtifactType.chat &&
      artifact.status === MeetingArtifactStatus.available &&
      artifact.contentText,
  );

  if (transcriptArtifacts.length) {
    return {
      primarySource: 'transcript' as const,
      sourceArtifactIds: transcriptArtifacts.map((artifact) => artifact.id),
      text: transcriptArtifacts
        .map((artifact) => artifact.contentText)
        .filter(Boolean)
        .join('\n'),
      availableArtifacts: meeting.artifacts.map((artifact) => ({
        artifactId: artifact.id,
        type: artifact.type,
        status: artifact.status,
        title: artifact.title,
        contentText: artifact.contentText,
        sourceUrl: artifact.sourceUrl,
      })),
    };
  }

  if (chatArtifacts.length) {
    return {
      primarySource: 'chat' as const,
      sourceArtifactIds: chatArtifacts.map((artifact) => artifact.id),
      text: chatArtifacts
        .map((artifact) => artifact.contentText)
        .filter(Boolean)
        .join('\n'),
      availableArtifacts: meeting.artifacts.map((artifact) => ({
        artifactId: artifact.id,
        type: artifact.type,
        status: artifact.status,
        title: artifact.title,
        contentText: artifact.contentText,
        sourceUrl: artifact.sourceUrl,
      })),
    };
  }

  const metadataText = [
    `Meeting topic: ${meeting.topic}.`,
    meeting.lead?.company ? `Company: ${meeting.lead.company}.` : null,
    meeting.lead?.interest ? `Interest: ${meeting.lead.interest}.` : null,
    meeting.participants.length
      ? `Participants: ${meeting.participants.map((participant) => participant.displayName).join(', ')}.`
      : null,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    primarySource: 'metadata_only' as const,
    sourceArtifactIds: [],
    text: metadataText,
    availableArtifacts: meeting.artifacts.map((artifact) => ({
      artifactId: artifact.id,
      type: artifact.type,
      status: artifact.status,
      title: artifact.title,
      contentText: artifact.contentText,
      sourceUrl: artifact.sourceUrl,
    })),
  };
}

function buildFacts(meeting: MeetingIntelligenceContext): MeetingFactSnapshot {
  return {
    meetingId: meeting.id,
    topic: meeting.topic,
    startAt: meeting.startAt,
    endAt: meeting.endAt,
    hostEmail: meeting.hostEmail,
    participantCount: meeting.participants.length || meeting.participantCount || 0,
    hasTranscript: meeting.hasTranscript,
    hasRecording: meeting.hasRecording,
    lead: meeting.lead
      ? {
          id: meeting.lead.id,
          firstName: meeting.lead.firstName,
          lastName: meeting.lead.lastName,
          company: meeting.lead.company,
          email: meeting.lead.email,
          interest: meeting.lead.interest,
        }
      : null,
    rep: meeting.repProfile
      ? {
          id: meeting.repProfile.id,
          displayName: meeting.repProfile.displayName,
          title: meeting.repProfile.title,
          email: meeting.repProfile.email,
          signatureCompany: meeting.repProfile.signatureProfile?.companyName,
          signaturePhone: meeting.repProfile.signatureProfile?.primaryPhone,
        }
      : null,
    participants: meeting.participants.map((participant) => ({
      displayName: participant.displayName,
      email: participant.email,
    })),
  };
}

function deriveDiscussionPoints(evidenceText: string, topic: string) {
  const lines = splitEvidenceLines(evidenceText);

  if (!lines.length) {
    return [`Discussion centered on ${topic.toLowerCase()}.`];
  }

  return Array.from(new Set(lines.slice(0, 3).map(toPoint))).slice(0, 3);
}

function deriveActionCandidates(evidenceText: string) {
  const lines = splitEvidenceLines(evidenceText);
  const patterns = [
    /\b(send|share|review|schedule|follow up|draft|prepare|confirm|introduce|coordinate)\b/i,
    /\bnext step\b/i,
    /\bwill\b/i,
  ];

  return lines.filter((line) => patterns.some((pattern) => pattern.test(line))).slice(0, 5);
}

class HeuristicMeetingIntelligenceProvider implements MeetingIntelligenceProvider {
  readonly providerName = 'trainovations_internal';
  readonly modelName = 'heuristic-meeting-intelligence-v1';

  async summarizeMeeting(input: {
    facts: MeetingFactSnapshot;
    evidence: MeetingEvidenceBundle;
  }): Promise<MeetingSummaryOutput> {
    const generatedAt = new Date();
    const discussionPoints = deriveDiscussionPoints(
      input.evidence.text,
      input.facts.topic,
    );
    const leadName = input.facts.lead
      ? `${input.facts.lead.firstName} ${input.facts.lead.lastName}`
      : 'the contact';
    const company = input.facts.lead?.company ?? 'the account';
    const evidenceClause =
      input.evidence.primarySource === 'transcript'
        ? 'using the available transcript'
        : input.evidence.primarySource === 'chat'
          ? 'using the available meeting chat'
          : 'using meeting metadata only';

    const summary = normalizeWhitespace(
      `${input.facts.rep?.displayName ?? 'The rep'} met with ${leadName} from ${company} on ${formatMeetingDate(input.facts.startAt)} about ${input.facts.topic.toLowerCase()}, ${evidenceClause}. ${discussionPoints.join(' ')}`,
    );
    const recommendedNextStep = await this.recommendNextStep({
      facts: input.facts,
      evidence: input.evidence,
      summary,
    });

    return {
      summary,
      keyDiscussionPoints: discussionPoints,
      recommendedNextStep,
      followUpSnippet: `Recap the discussion around ${input.facts.topic.toLowerCase()} and confirm ${recommendedNextStep.toLowerCase()}.`,
      modelName: this.modelName,
      generationProvider: this.providerName,
      generatedAt,
      generationMetadata: {
        evidenceSource: input.evidence.primarySource,
        sourceArtifactCount: input.evidence.sourceArtifactIds.length,
        deterministic: true,
      },
    };
  }

  async extractActionItems(input: {
    facts: MeetingFactSnapshot;
    evidence: MeetingEvidenceBundle;
    summary: MeetingSummaryOutput;
  }): Promise<ActionItemOutput[]> {
    const generatedAt = new Date();
    const candidates = deriveActionCandidates(input.evidence.text);

    if (!candidates.length) {
      return [
        {
          description: `Follow up with ${input.facts.lead?.company ?? 'the contact'} on ${input.summary.recommendedNextStep.toLowerCase()}.`,
          assigneeName: input.facts.rep?.displayName,
          confidenceLabel: input.evidence.primarySource === 'metadata_only' ? 'low' : 'medium',
          generatedAt,
          providerMetadata: {
            derivedFrom: input.evidence.primarySource,
            heuristic: true,
          },
        },
      ];
    }

    return candidates.slice(0, 3).map((candidate) => ({
      description: toPoint(candidate),
      assigneeName: input.facts.rep?.displayName,
      sourceExcerpt: trimExcerpt(candidate),
      confidenceLabel: input.evidence.primarySource === 'transcript' ? 'high' : 'medium',
      generatedAt,
      providerMetadata: {
        derivedFrom: input.evidence.primarySource,
        heuristic: true,
      },
    }));
  }

  async draftFollowUpEmail(input: {
    facts: MeetingFactSnapshot;
    evidence: MeetingEvidenceBundle;
    summary: MeetingSummaryOutput;
    actionItems: ActionItemOutput[];
  }): Promise<FollowUpEmailDraftOutput> {
    const generatedAt = new Date();
    const repName = input.facts.rep?.displayName ?? 'Trainovations';
    const leadFirstName = input.facts.lead?.firstName ?? 'there';
    const company = input.facts.lead?.company ?? 'your team';
    const actionLines = input.actionItems
      .map((item) => `- ${item.description}`)
      .join('\n');

    return {
      subject: `Next steps from our ${input.facts.topic} conversation`,
      bodyText: `Hi ${leadFirstName},\n\nThank you for taking the time to meet about ${input.facts.topic.toLowerCase()}.\n\nHere is a short recap from our conversation:\n${input.summary.summary}\n\nCurrent next step:\n${input.summary.recommendedNextStep}\n\nAction items:\n${actionLines}\n\nIf helpful, I can also prepare a tailored follow-up for ${company}.\n\nBest,\n${repName}`,
      recipientEmail: input.facts.lead?.email,
      modelName: this.modelName,
      generationProvider: this.providerName,
      generatedAt,
      generationMetadata: {
        evidenceSource: input.evidence.primarySource,
        actionItemCount: input.actionItems.length,
        deterministic: true,
      },
    };
  }

  async recommendNextStep(input: {
    facts: MeetingFactSnapshot;
    evidence: MeetingEvidenceBundle;
    summary?: string;
  }): Promise<string> {
    const evidence = `${input.summary ?? ''} ${input.evidence.text}`.toLowerCase();

    if (evidence.includes('pilot') || evidence.includes('rollout')) {
      return 'schedule a follow-up working session to define pilot scope and timing';
    }

    if (evidence.includes('proposal') || evidence.includes('pricing')) {
      return 'send a proposal recap and confirm the commercial review timeline';
    }

    if (evidence.includes('demo') || evidence.includes('walkthrough')) {
      return 'book a follow-up demo with the broader stakeholder group';
    }

    return 'send a recap and confirm the preferred follow-up path';
  }
}

async function loadMeetingIntelligenceContext(
  meetingId: string,
  db: DatabaseClient,
) {
  return db.meeting.findUnique({
    where: { id: meetingId },
    include: {
      lead: true,
      repProfile: {
        include: {
          signatureProfile: true,
        },
      },
      participants: {
        orderBy: { createdAt: 'asc' },
      },
      artifacts: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

type MeetingIntelligenceContext = NonNullable<
  Awaited<ReturnType<typeof loadMeetingIntelligenceContext>>
>;

export class MeetingIntelligenceService {
  static provider: MeetingIntelligenceProvider =
    new HeuristicMeetingIntelligenceProvider();

  static setProvider(provider: MeetingIntelligenceProvider) {
    this.provider = provider;
  }

  static resetProvider() {
    this.provider = new HeuristicMeetingIntelligenceProvider();
  }

  static async buildContext(meetingId: string, db: DatabaseClient = getPrismaClient()) {
    const meeting = await loadMeetingIntelligenceContext(meetingId, db);

    if (!meeting) {
      throw new Error(`Meeting ${meetingId} was not found.`);
    }

    return {
      facts: buildFacts(meeting),
      evidence: extractEvidence(meeting),
      meeting,
    };
  }

  static async summarizeMeeting(meetingId: string, db: DatabaseClient = getPrismaClient()) {
    const context = await this.buildContext(meetingId, db);
    return this.provider.summarizeMeeting({
      facts: context.facts,
      evidence: context.evidence,
    });
  }

  static async extractActionItems(meetingId: string, db: DatabaseClient = getPrismaClient()) {
    const context = await this.buildContext(meetingId, db);
    const summary = await this.provider.summarizeMeeting({
      facts: context.facts,
      evidence: context.evidence,
    });

    return this.provider.extractActionItems({
      facts: context.facts,
      evidence: context.evidence,
      summary,
    });
  }

  static async draftFollowUpEmail(meetingId: string, db: DatabaseClient = getPrismaClient()) {
    const context = await this.buildContext(meetingId, db);
    const summary = await this.provider.summarizeMeeting({
      facts: context.facts,
      evidence: context.evidence,
    });
    const actionItems = await this.provider.extractActionItems({
      facts: context.facts,
      evidence: context.evidence,
      summary,
    });

    return this.provider.draftFollowUpEmail({
      facts: context.facts,
      evidence: context.evidence,
      summary,
      actionItems,
    });
  }

  static async recommendNextStep(meetingId: string, db: DatabaseClient = getPrismaClient()) {
    const context = await this.buildContext(meetingId, db);
    return this.provider.recommendNextStep({
      facts: context.facts,
      evidence: context.evidence,
    });
  }

  static async generateMeetingIntelligence(
    meetingId: string,
    db: DatabaseClient = getPrismaClient(),
  ): Promise<GenerateMeetingIntelligenceResult> {
    const context = await this.buildContext(meetingId, db);
    const summaryOutput = await this.provider.summarizeMeeting({
      facts: context.facts,
      evidence: context.evidence,
    });
    const actionItemOutputs = await this.provider.extractActionItems({
      facts: context.facts,
      evidence: context.evidence,
      summary: summaryOutput,
    });
    const emailDraftOutput = await this.provider.draftFollowUpEmail({
      facts: context.facts,
      evidence: context.evidence,
      summary: summaryOutput,
      actionItems: actionItemOutputs,
    });

    const callSummaryInput = createCallSummarySchema.parse({
      meetingId,
      summary: summaryOutput.summary,
      keyDiscussionPoints: summaryOutput.keyDiscussionPoints,
      recommendedNextStep: summaryOutput.recommendedNextStep,
      followUpSnippet: summaryOutput.followUpSnippet,
      modelName: summaryOutput.modelName,
      generationProvider: summaryOutput.generationProvider,
      generatedAt: summaryOutput.generatedAt,
      sourceArtifactIds: context.evidence.sourceArtifactIds,
      generationMetadata: {
        ...(summaryOutput.generationMetadata as Record<string, unknown>),
        evidenceSource: context.evidence.primarySource,
      },
      providerMetadata: {
        availableArtifactCount: context.evidence.availableArtifacts.length,
      },
    });

    const callSummary = await db.callSummary.upsert({
      where: { meetingId },
      update: {
        status: CallSummaryStatus.generated,
        summary: callSummaryInput.summary,
        keyDiscussionPoints: callSummaryInput.keyDiscussionPoints as Prisma.InputJsonValue | undefined,
        recommendedNextStep: callSummaryInput.recommendedNextStep,
        followUpSnippet: callSummaryInput.followUpSnippet,
        modelName: callSummaryInput.modelName,
        generationProvider: callSummaryInput.generationProvider,
        generatedAt: callSummaryInput.generatedAt,
        sourceArtifactIds: callSummaryInput.sourceArtifactIds,
        providerMetadata: callSummaryInput.providerMetadata as Prisma.InputJsonValue | undefined,
        generationMetadata: callSummaryInput.generationMetadata as Prisma.InputJsonValue | undefined,
      },
      create: {
        meetingId,
        status: CallSummaryStatus.generated,
        summary: callSummaryInput.summary,
        keyDiscussionPoints: callSummaryInput.keyDiscussionPoints as Prisma.InputJsonValue | undefined,
        recommendedNextStep: callSummaryInput.recommendedNextStep,
        followUpSnippet: callSummaryInput.followUpSnippet,
        modelName: callSummaryInput.modelName,
        generationProvider: callSummaryInput.generationProvider,
        generatedAt: callSummaryInput.generatedAt,
        sourceArtifactIds: callSummaryInput.sourceArtifactIds,
        providerMetadata: callSummaryInput.providerMetadata as Prisma.InputJsonValue | undefined,
        generationMetadata: callSummaryInput.generationMetadata as Prisma.InputJsonValue | undefined,
      },
    });

    await db.actionItem.deleteMany({
      where: { meetingId },
    });

    const createdActionItems = await Promise.all(
      actionItemOutputs.map((output) => {
        const actionItemInput = createActionItemSchema.parse({
          meetingId,
          callSummaryId: callSummary.id,
          leadId: context.facts.lead?.id,
          description: output.description,
          assigneeName: output.assigneeName,
          sourceExcerpt: output.sourceExcerpt,
          confidenceLabel: output.confidenceLabel,
          generatedAt: output.generatedAt,
          providerMetadata: output.providerMetadata,
        });

        return db.actionItem.create({
          data: {
            ...actionItemInput,
            providerMetadata:
              actionItemInput.providerMetadata as Prisma.InputJsonValue | undefined,
          },
        });
      }),
    );

    await db.emailDraft.updateMany({
      where: {
        meetingId,
        type: EmailDraftType.follow_up,
        status: EmailDraftStatus.draft,
      },
      data: {
        status: EmailDraftStatus.archived,
      },
    });

    const previewText = `${summaryOutput.recommendedNextStep ?? 'Follow up with the next best step.'} (${context.facts.lead?.company ?? 'Trainovations'}).`;
    const htmlPreview = await EmailTemplateService.renderOutreachDraft({
      previewText,
      recipientName:
        context.facts.lead?.firstName ??
        context.facts.participants[0]?.displayName ??
        'there',
      repName: context.facts.rep?.displayName ?? 'Trainovations',
      companyName:
        context.facts.rep?.signatureCompany ?? context.facts.lead?.company ?? 'Trainovations',
      bodyText: emailDraftOutput.bodyText,
    });

    const draftInput = createEmailDraftSchema.parse({
      userId: context.meeting.userId,
      repProfileId: context.meeting.repProfileId ?? undefined,
      leadId: context.meeting.leadId ?? undefined,
      meetingId,
      connectedAccountId: context.meeting.connectedAccountId ?? undefined,
      subject: emailDraftOutput.subject,
      bodyText: emailDraftOutput.bodyText,
      recipientEmail: emailDraftOutput.recipientEmail,
      modelName: emailDraftOutput.modelName,
      generationProvider: emailDraftOutput.generationProvider,
      generatedAt: emailDraftOutput.generatedAt,
      generationMetadata: {
        ...(emailDraftOutput.generationMetadata as Record<string, unknown>),
        evidenceSource: context.evidence.primarySource,
        previewText,
        htmlPreview,
      },
      providerMetadata: {
        aiAssisted: true,
      },
    });

    const emailDraft = await db.emailDraft.create({
      data: {
        ...draftInput,
        generationMetadata: draftInput.generationMetadata as Prisma.InputJsonValue | undefined,
        providerMetadata: draftInput.providerMetadata as Prisma.InputJsonValue | undefined,
      },
    });

    await createActivityLogEntry(
      {
        type: ActivityLogType.meeting_processed,
        description: 'Meeting intelligence generated from available meeting evidence.',
        actorUserId: context.meeting.userId,
        repProfileId: context.meeting.repProfileId ?? undefined,
        leadId: context.meeting.leadId ?? undefined,
        metadata: {
          meetingId,
          callSummaryId: callSummary.id,
          evidenceSource: context.evidence.primarySource,
          sourceArtifactIds: context.evidence.sourceArtifactIds,
          actionItemCount: createdActionItems.length,
        },
      },
      db,
    );

    if (context.facts.lead) {
      await createLeadNote(
        {
          leadId: context.facts.lead.id,
          meetingId,
          callSummaryId: callSummary.id,
          sourceType: LeadNoteSourceType.ai_generated,
          content: `AI meeting recap\n\nSummary: ${summaryOutput.summary}\n\nRecommended next step: ${summaryOutput.recommendedNextStep}\n\nAction items:\n${createdActionItems.map((item) => `- ${item.description}`).join('\n')}`,
          metadata: {
            evidenceSource: context.evidence.primarySource,
            generatedFromMeetingId: meetingId,
          },
        },
        {
          activityType: ActivityLogType.meeting_note_created,
          activityDescription:
            'AI-generated CRM note created from processed meeting outputs.',
          activityMetadata: {
            meetingId,
            callSummaryId: callSummary.id,
            evidenceSource: context.evidence.primarySource,
          },
          actorUserId: context.meeting.userId,
          repProfileId: context.meeting.repProfileId ?? undefined,
        },
        db,
      );
    }

    await createActivityLogEntry(
      {
        type: ActivityLogType.meeting_follow_up_drafted,
        description: 'Follow-up email draft generated from meeting outputs.',
        actorUserId: context.meeting.userId,
        repProfileId: context.meeting.repProfileId ?? undefined,
        leadId: context.meeting.leadId ?? undefined,
        metadata: {
          meetingId,
          emailDraftId: emailDraft.id,
          recipientEmail: emailDraft.recipientEmail,
          evidenceSource: context.evidence.primarySource,
        },
      },
      db,
    );

    return {
      callSummary: {
        id: callSummary.id,
        status: callSummary.status,
        summary: callSummary.summary,
      },
      actionItems: createdActionItems.map((item) => ({
        id: item.id,
        description: item.description,
      })),
      emailDraft: {
        id: emailDraft.id,
        subject: emailDraft.subject,
        status: emailDraft.status,
      },
      evidence: context.evidence,
    };
  }
}
