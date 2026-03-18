import {
  OutreachDraftStatus,
  OutreachDraftType,
  type Prisma,
} from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import {
  draftGenerationContextSchema,
  outreachDraftSchema,
} from '@/lib/validation/outreach-intelligence';

import type { DatabaseClient } from './types';

function buildLeadFollowUpDraft(input: {
  lead: {
    firstName: string;
    company: string | null;
    interest: string | null;
    status: string;
    email: string;
  };
  rep: {
    displayName: string;
    title: string;
    signatureCompany: string | null;
  } | null;
  movementAlert:
    | {
        title: string;
        suggestedNextStep: string | null;
      }
    | null
    | undefined;
  latestMeeting:
    | {
        topic: string;
        callSummary: { summary: string | null; recommendedNextStep: string | null } | null;
      }
    | null
    | undefined;
}) {
  const repName = input.rep?.displayName ?? 'Trainovations';
  const repTitle = input.rep?.title ?? 'Trainovations team';
  const companyName = input.rep?.signatureCompany ?? 'Trainovations';
  const leadName = input.lead.firstName;
  const leadCompany = input.lead.company ?? 'your team';
  const interestLine = input.lead.interest
    ? `You mentioned interest in ${input.lead.interest.toLowerCase()}, so I wanted to follow up with a clear next step.`
    : 'I wanted to follow up with a clear next step and keep the conversation moving.';

  if (input.movementAlert) {
    return {
      type: OutreachDraftType.reentry,
      subject: `Congrats on the move to ${leadCompany}`,
      bodyText: `Hi ${leadName},

Congratulations on the move to ${leadCompany}. ${input.movementAlert.title} surfaced in our CRM, and it felt like a good time to reconnect.

${input.movementAlert.suggestedNextStep ?? 'If it would be helpful, I can share a quick overview of how Trainovations supports safety and operational training programs.'}

If it makes sense, I would be glad to set up a short conversation and learn what matters most in your new role.

Best,
${repName}
${repTitle}
${companyName}`,
      explanation:
        'Generated because the contact has an open career-movement alert and looks like a strong re-entry opportunity.',
      suggestedCta: 'Reconnect with a short introduction call.',
    };
  }

  if (input.latestMeeting?.callSummary) {
    return {
      type: OutreachDraftType.post_meeting_follow_up,
      subject: `Next steps from our ${input.latestMeeting.topic} conversation`,
      bodyText: `Hi ${leadName},

Thank you again for the time on ${input.latestMeeting.topic}. ${input.latestMeeting.callSummary.summary ?? 'It was helpful to better understand your current training priorities.'}

${input.latestMeeting.callSummary.recommendedNextStep ?? 'I would be happy to outline a practical next step based on the conversation.'}

If you are open to it, I can send over a concise follow-up and coordinate the right next discussion.

Best,
${repName}
${repTitle}
${companyName}`,
      explanation:
        'Generated from the latest processed meeting context so the rep can review a ready-to-send follow-up.',
      suggestedCta: 'Send meeting follow-up and confirm next step.',
    };
  }

  return {
    type:
      input.lead.status === 'new'
        ? OutreachDraftType.lead_follow_up
        : OutreachDraftType.reconnect,
    subject:
      input.lead.status === 'new'
        ? `Following up on ${leadCompany}'s Trainovations inquiry`
        : `Reconnecting on training priorities at ${leadCompany}`,
    bodyText: `Hi ${leadName},

I’m reaching out from ${companyName}. ${interestLine}

Trainovations helps operations and safety teams make training easier to deploy, track, and improve without adding unnecessary process overhead.

If helpful, I can send a short overview tailored to ${leadCompany} and suggest a simple next conversation.

Best,
${repName}
${repTitle}
${companyName}`,
    explanation:
      input.lead.status === 'new'
        ? 'Generated because the lead is still new and needs first response.'
        : 'Generated as a reconnect draft based on current lead context.',
    suggestedCta: 'Send a short intro and propose a next conversation.',
  };
}

export class OutreachDraftService {
  static async generateDraftForLead(
    leadId: string,
    actorUserId?: string,
    db: DatabaseClient = getPrismaClient() as DatabaseClient,
  ) {
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        repProfile: {
          include: {
            signatureProfile: true,
          },
        },
        careerMovementAlerts: {
          where: { status: 'open' },
          orderBy: { triggeredAt: 'desc' },
          take: 1,
        },
        meetings: {
          where: {
            processedAt: {
              not: null,
            },
          },
          include: {
            callSummary: {
              select: {
                summary: true,
                recommendedNextStep: true,
              },
            },
          },
          orderBy: {
            startAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    const generated = buildLeadFollowUpDraft({
      lead: {
        firstName: lead.firstName,
        company: lead.company,
        interest: lead.interest,
        status: lead.status,
        email: lead.email,
      },
      rep: lead.repProfile
        ? {
            displayName: lead.repProfile.displayName,
            title:
              lead.repProfile.signatureProfile?.jobTitle ?? lead.repProfile.title,
            signatureCompany:
              lead.repProfile.signatureProfile?.companyName ?? null,
          }
        : null,
      movementAlert: lead.careerMovementAlerts[0],
      latestMeeting: lead.meetings[0],
    });

    await db.outreachDraft.updateMany({
      where: {
        leadId,
        type: generated.type,
        status: {
          in: [
            OutreachDraftStatus.generated,
            OutreachDraftStatus.reviewed,
            OutreachDraftStatus.edited,
          ],
        },
      },
      data: {
        status: OutreachDraftStatus.archived,
        archivedAt: new Date(),
      },
    });

    const draftInput = outreachDraftSchema.parse({
      generatedByUserId: actorUserId,
      repProfileId: lead.repProfileId ?? undefined,
      leadId,
      meetingId: lead.meetings[0]?.id,
      type: generated.type,
      status: OutreachDraftStatus.generated,
      subject: generated.subject,
      bodyText: generated.bodyText,
      recipientEmail: lead.email,
      toneStyle: 'professional',
      suggestedCta: generated.suggestedCta,
      explanation: generated.explanation,
      confidenceScore: lead.careerMovementAlerts[0] ? 0.82 : lead.meetings[0] ? 0.86 : 0.72,
      generatedAt: new Date(),
      generationProvider: 'trainovations_workflow',
      modelName: 'ruleset-v1',
      sourceContext: {
        leadStatus: lead.status,
        interest: lead.interest,
        company: lead.company,
        movementAlertId: lead.careerMovementAlerts[0]?.id,
        meetingId: lead.meetings[0]?.id,
      },
      generationMetadata: {
        generatedFrom: lead.careerMovementAlerts[0]
          ? 'career_movement'
          : lead.meetings[0]
            ? 'meeting_follow_up'
            : 'lead_context',
      },
    });

    const draft = await db.outreachDraft.create({
      data: {
        ...draftInput,
        sourceContext: draftInput.sourceContext as Prisma.InputJsonValue | undefined,
        generationMetadata:
          draftInput.generationMetadata as Prisma.InputJsonValue | undefined,
      },
    });

    const contextInput = draftGenerationContextSchema.parse({
      outreachDraftId: draft.id,
      leadId,
      meetingId: lead.meetings[0]?.id,
      repProfileId: lead.repProfileId ?? undefined,
      sourceEntityType: 'lead',
      sourceEntityId: leadId,
      contextSummary: generated.explanation,
      contextSnapshot: {
        leadStatus: lead.status,
        company: lead.company,
        interest: lead.interest,
      },
      explanationData: {
        movementAlertId: lead.careerMovementAlerts[0]?.id,
        meetingId: lead.meetings[0]?.id,
      },
    });

    await db.draftGenerationContext.create({
      data: {
        ...contextInput,
        contextSnapshot: contextInput.contextSnapshot as Prisma.InputJsonValue | undefined,
        explanationData:
          contextInput.explanationData as Prisma.InputJsonValue | undefined,
      },
    });

    return draft;
  }

  static async updateDraftStatus(
    draftId: string,
    status: OutreachDraftStatus,
    editorUserId?: string,
    db: DatabaseClient = getPrismaClient() as DatabaseClient,
  ) {
    return db.outreachDraft.update({
      where: { id: draftId },
      data: {
        status,
        lastEditedByUserId: editorUserId,
        approvedAt: status === OutreachDraftStatus.approved ? new Date() : undefined,
        archivedAt: status === OutreachDraftStatus.archived ? new Date() : undefined,
      },
    });
  }
}
