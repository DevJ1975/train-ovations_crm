import {
  ActivityLogType,
  CallSummaryStatus,
  EmailDraftStatus,
  LeadNoteSourceType,
  MeetingArtifactStatus,
  MeetingArtifactType,
} from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MeetingIntelligenceService,
  type MeetingIntelligenceProvider,
} from './meeting-intelligence-service';

function createDatabaseMock() {
  return {
    meeting: {
      findUnique: vi.fn(),
    },
    callSummary: {
      upsert: vi.fn(),
    },
    actionItem: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    emailDraft: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    leadNote: {
      create: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
  };
}

describe('MeetingIntelligenceService', () => {
  const ids = {
    meeting: 'ck1234567890123456789012',
    lead: 'ck2234567890123456789012',
    rep: 'ck3234567890123456789012',
    user: 'ck4234567890123456789012',
    transcriptArtifact: 'ck5234567890123456789012',
    recordingArtifact: 'ck6234567890123456789012',
    callSummary: 'ck7234567890123456789012',
    actionItem: 'ck8234567890123456789012',
    emailDraft: 'ck9234567890123456789012',
  };

  let db: ReturnType<typeof createDatabaseMock>;

  beforeEach(() => {
    db = createDatabaseMock();
  });

  afterEach(() => {
    MeetingIntelligenceService.resetProvider();
  });

  it('builds evidence from transcript artifacts when available', async () => {
    db.meeting.findUnique.mockResolvedValue({
      id: ids.meeting,
      topic: 'Pilot rollout planning',
      startAt: new Date('2026-03-13T17:00:00.000Z'),
      endAt: new Date('2026-03-13T17:30:00.000Z'),
      hostEmail: 'rep@trainovations.com',
      participantCount: 2,
      hasTranscript: true,
      hasRecording: true,
      userId: ids.user,
      repProfileId: ids.rep,
      leadId: ids.lead,
      connectedAccountId: null,
      lead: {
        id: ids.lead,
        firstName: 'Taylor',
        lastName: 'Brooks',
        company: 'Northstar Rail',
        email: 'taylor@northstarrail.com',
        interest: 'Pilot rollout',
      },
      repProfile: {
        id: ids.rep,
        displayName: 'Jay Jones',
        title: 'Safety Technology Specialist',
        email: 'jay@trainovations.com',
        signatureProfile: {
          companyName: 'Trainovations',
          primaryPhone: '555-111-2222',
        },
      },
      participants: [
        {
          displayName: 'Taylor Brooks',
          email: 'taylor@northstarrail.com',
        },
      ],
      artifacts: [
        {
          id: ids.transcriptArtifact,
          type: MeetingArtifactType.transcript,
          status: MeetingArtifactStatus.available,
          title: 'Transcript',
          contentText:
            'Customer wants a phased pilot rollout. Send proposal deck by Friday.',
          sourceUrl: 'https://zoom.us/transcript',
        },
        {
          id: ids.recordingArtifact,
          type: MeetingArtifactType.recording,
          status: MeetingArtifactStatus.available,
          title: 'Recording',
          contentText: null,
          sourceUrl: 'https://zoom.us/recording',
        },
      ],
    });

    const summary = await MeetingIntelligenceService.summarizeMeeting(ids.meeting, db as never);

    expect(summary.generationMetadata.evidenceSource).toBe('transcript');
    expect(summary.summary).toContain('Jay Jones');
    expect(summary.summary).toContain('Northstar Rail');
    expect(summary.recommendedNextStep).toContain('pilot scope');
  });

  it('generates and stores summary, action items, draft, and AI note', async () => {
    db.meeting.findUnique.mockResolvedValue({
      id: ids.meeting,
      topic: 'Proposal review',
      startAt: new Date('2026-03-13T17:00:00.000Z'),
      endAt: new Date('2026-03-13T17:30:00.000Z'),
      hostEmail: 'rep@trainovations.com',
      participantCount: 2,
      hasTranscript: true,
      hasRecording: true,
      userId: ids.user,
      repProfileId: ids.rep,
      leadId: ids.lead,
      connectedAccountId: null,
      lead: {
        id: ids.lead,
        firstName: 'Taylor',
        lastName: 'Brooks',
        company: 'Northstar Rail',
        email: 'taylor@northstarrail.com',
        interest: 'Proposal review',
      },
      repProfile: {
        id: ids.rep,
        displayName: 'Jay Jones',
        title: 'Safety Technology Specialist',
        email: 'jay@trainovations.com',
        signatureProfile: {
          companyName: 'Trainovations',
          primaryPhone: '555-111-2222',
        },
      },
      participants: [
        {
          displayName: 'Taylor Brooks',
          email: 'taylor@northstarrail.com',
        },
      ],
      artifacts: [
        {
          id: ids.transcriptArtifact,
          type: MeetingArtifactType.transcript,
          status: MeetingArtifactStatus.available,
          title: 'Transcript',
          contentText:
            'Please send the proposal deck by Friday. We should schedule a procurement review next week.',
          sourceUrl: 'https://zoom.us/transcript',
        },
      ],
    });
    db.callSummary.upsert.mockResolvedValue({
      id: ids.callSummary,
      status: CallSummaryStatus.generated,
      summary: 'Generated summary',
    });
    db.actionItem.deleteMany.mockResolvedValue({ count: 0 });
    db.actionItem.create
      .mockResolvedValueOnce({
        id: ids.actionItem,
        description: 'Please send the proposal deck by Friday.',
      })
      .mockResolvedValueOnce({
        id: 'ck1034567890123456789012',
        description: 'We should schedule a procurement review next week.',
      });
    db.emailDraft.updateMany.mockResolvedValue({ count: 0 });
    db.emailDraft.create.mockResolvedValue({
      id: ids.emailDraft,
      subject: 'Next steps from our Proposal review conversation',
      status: EmailDraftStatus.draft,
    });
    db.leadNote.create.mockResolvedValue({
      id: 'ck1134567890123456789012',
      leadId: ids.lead,
      authorId: null,
      sourceType: LeadNoteSourceType.ai_generated,
    });
    db.activityLog.create.mockResolvedValue({ id: 'activity_1' });

    const result = await MeetingIntelligenceService.generateMeetingIntelligence(
      ids.meeting,
      db as never,
    );

    expect(result.callSummary.status).toBe(CallSummaryStatus.generated);
    expect(result.actionItems).toHaveLength(2);
    expect(result.emailDraft.status).toBe(EmailDraftStatus.draft);
    expect(result.evidence.primarySource).toBe('transcript');

    expect(db.callSummary.upsert).toHaveBeenCalledWith({
      where: { meetingId: ids.meeting },
      update: expect.objectContaining({
        status: CallSummaryStatus.generated,
        sourceArtifactIds: [ids.transcriptArtifact],
      }),
      create: expect.objectContaining({
        meetingId: ids.meeting,
        status: CallSummaryStatus.generated,
      }),
    });

    expect(db.emailDraft.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        meetingId: ids.meeting,
        leadId: ids.lead,
        repProfileId: ids.rep,
        recipientEmail: 'taylor@northstarrail.com',
        generationMetadata: expect.objectContaining({
          evidenceSource: 'transcript',
          previewText: expect.any(String),
          htmlPreview: expect.stringContaining('<!DOCTYPE html'),
        }),
      }),
    });

    expect(db.leadNote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: ids.lead,
        meetingId: ids.meeting,
        callSummaryId: ids.callSummary,
        sourceType: LeadNoteSourceType.ai_generated,
      }),
    });
    expect(db.activityLog.create).toHaveBeenCalledTimes(3);
    expect(db.activityLog.create).toHaveBeenNthCalledWith(
      1,
      {
        data: expect.objectContaining({
          type: ActivityLogType.meeting_processed,
          leadId: ids.lead,
          metadata: expect.objectContaining({
            meetingId: ids.meeting,
            callSummaryId: ids.callSummary,
            actionItemCount: 2,
          }),
        }),
      },
    );
    expect(db.activityLog.create).toHaveBeenNthCalledWith(
      2,
      {
        data: expect.objectContaining({
          type: ActivityLogType.meeting_note_created,
          leadId: ids.lead,
          metadata: expect.objectContaining({
            meetingId: ids.meeting,
            callSummaryId: ids.callSummary,
          }),
        }),
      },
    );
    expect(db.activityLog.create).toHaveBeenNthCalledWith(
      3,
      {
        data: expect.objectContaining({
          type: ActivityLogType.meeting_follow_up_drafted,
          leadId: ids.lead,
          metadata: expect.objectContaining({
            meetingId: ids.meeting,
            emailDraftId: ids.emailDraft,
          }),
        }),
      },
    );
  });

  it('supports swapping in a provider implementation and keeps outputs typed', async () => {
    const provider: MeetingIntelligenceProvider = {
      providerName: 'test_provider',
      modelName: 'test-model',
      summarizeMeeting: vi.fn().mockResolvedValue({
        summary: 'Typed summary',
        keyDiscussionPoints: ['Point A'],
        recommendedNextStep: 'Book the next meeting',
        followUpSnippet: 'Follow-up snippet',
        modelName: 'test-model',
        generationProvider: 'test_provider',
        generatedAt: new Date('2026-03-13T18:00:00.000Z'),
        generationMetadata: {
          evidenceSource: 'metadata_only',
        },
      }),
      extractActionItems: vi.fn().mockResolvedValue([]),
      draftFollowUpEmail: vi.fn().mockResolvedValue({
        subject: 'Subject',
        bodyText: 'Body',
        recipientEmail: 'lead@example.com',
        modelName: 'test-model',
        generationProvider: 'test_provider',
        generatedAt: new Date('2026-03-13T18:00:00.000Z'),
        generationMetadata: {
          evidenceSource: 'metadata_only',
        },
      }),
      recommendNextStep: vi.fn().mockResolvedValue('Book the next meeting'),
    };

    MeetingIntelligenceService.setProvider(provider);

    db.meeting.findUnique.mockResolvedValue({
      id: ids.meeting,
      topic: 'Intro call',
      startAt: null,
      endAt: null,
      hostEmail: 'rep@trainovations.com',
      participantCount: 0,
      hasTranscript: false,
      hasRecording: false,
      userId: ids.user,
      repProfileId: ids.rep,
      leadId: null,
      connectedAccountId: null,
      lead: null,
      repProfile: {
        id: ids.rep,
        displayName: 'Jay Jones',
        title: 'Safety Technology Specialist',
        email: 'jay@trainovations.com',
        signatureProfile: null,
      },
      participants: [],
      artifacts: [],
    });

    const draft = await MeetingIntelligenceService.draftFollowUpEmail(ids.meeting, db as never);

    expect(provider.summarizeMeeting).toHaveBeenCalledTimes(1);
    expect(provider.extractActionItems).toHaveBeenCalledTimes(1);
    expect(draft.subject).toBe('Subject');
    expect(draft.generationProvider).toBe('test_provider');
  });
});
