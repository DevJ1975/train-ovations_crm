import {
  CallSummaryStatus,
  ConnectedProvider,
  EmailDraftStatus,
  EmailDraftType,
  MeetingArtifactStatus,
  MeetingArtifactType,
  MeetingParticipantRole,
  MeetingStatus,
  SyncStatus,
} from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  createActionItemSchema,
  createAiGeneratedLeadNoteSchema,
  createCallSummarySchema,
  createEmailDraftSchema,
  upsertMeetingArtifactSchema,
  upsertMeetingParticipantSchema,
  upsertMeetingRecordSchema,
} from './meeting-intelligence';

describe('meeting intelligence validation schemas', () => {
  it('accepts a verified meeting record payload with lead and rep links', () => {
    const result = upsertMeetingRecordSchema.parse({
      userId: 'ck1234567890123456789012',
      repProfileId: 'ck2234567890123456789012',
      leadId: 'ck3234567890123456789012',
      calendarEventId: 'ck4234567890123456789012',
      externalMeetingId: 'zoom_12345',
      provider: 'zoom',
      topic: 'Proposal review',
      status: MeetingStatus.completed,
      processingStatus: SyncStatus.pending,
      hasRecording: true,
      hasTranscript: false,
    });

    expect(result.status).toBe(MeetingStatus.completed);
    expect(result.processingStatus).toBe(SyncStatus.pending);
  });

  it('validates source-backed meeting artifacts and allows missing transcript status', () => {
    const result = upsertMeetingArtifactSchema.parse({
      meetingId: 'ck1234567890123456789012',
      type: MeetingArtifactType.transcript,
      status: MeetingArtifactStatus.missing,
      sourceProvider: ConnectedProvider.zoom,
    });

    expect(result.type).toBe(MeetingArtifactType.transcript);
    expect(result.status).toBe(MeetingArtifactStatus.missing);
  });

  it('defaults participant role to unknown', () => {
    const result = upsertMeetingParticipantSchema.parse({
      meetingId: 'ck1234567890123456789012',
      displayName: 'Taylor Brooks',
    });

    expect(result.role).toBe(MeetingParticipantRole.unknown);
  });

  it('stores AI summaries separately from meeting facts', () => {
    const result = createCallSummarySchema.parse({
      meetingId: 'ck1234567890123456789012',
      summary: 'The customer wants a phased rollout with a pilot in Q2.',
      keyDiscussionPoints: ['Pilot scope', 'Procurement timing'],
      sourceArtifactIds: ['ck2234567890123456789012'],
    });

    expect(result.status).toBe(CallSummaryStatus.generated);
    expect(result.sourceArtifactIds).toEqual(['ck2234567890123456789012']);
  });

  it('validates action items with optional source excerpts', () => {
    const result = createActionItemSchema.parse({
      meetingId: 'ck1234567890123456789012',
      description: 'Send the proposal deck by Friday.',
      sourceExcerpt: 'Can you get the proposal deck over by Friday?',
    });

    expect(result.description).toContain('proposal deck');
  });

  it('creates follow-up draft contracts with draft defaults', () => {
    const result = createEmailDraftSchema.parse({
      meetingId: 'ck1234567890123456789012',
      leadId: 'ck2234567890123456789012',
      type: EmailDraftType.follow_up,
      subject: 'Next steps from our Trainovations meeting',
      bodyText: 'Thanks again for the time today.',
    });

    expect(result.status).toBe(EmailDraftStatus.draft);
  });

  it('requires AI-generated lead notes to be labeled as AI content', () => {
    expect(
      createAiGeneratedLeadNoteSchema.safeParse({
        leadId: 'ck1234567890123456789012',
        content: 'AI-generated summary content.',
        sourceType: 'user_authored',
      }).success,
    ).toBe(false);
  });
});
