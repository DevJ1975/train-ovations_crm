import {
  ConnectedProvider,
  MeetingArtifactStatus,
  MeetingArtifactType,
  MeetingStatus,
  SyncStatus,
} from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { processZoomMeetingCompletedEvent } from './meeting-completion-service';

function createDatabaseMock() {
  return {
    connectedAccount: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    repProfile: {
      findUnique: vi.fn(),
    },
    calendarEvent: {
      findFirst: vi.fn(),
    },
    meeting: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    meetingArtifact: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    meetingParticipant: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
  };
}

describe('processZoomMeetingCompletedEvent', () => {
  const ids = {
    user: 'ck1234567890123456789012',
    rep: 'ck2234567890123456789012',
    lead: 'ck3234567890123456789012',
    calendar: 'ck4234567890123456789012',
    meeting: 'ck5234567890123456789012',
    account: 'ck6234567890123456789012',
  };

  const payload = {
    event: 'meeting.ended',
    payload: {
      object: {
        id: 'zoom_123',
        topic: 'Pilot proposal review',
        host_email: 'rep@trainovations.com',
        join_url: 'https://zoom.us/j/123',
        start_time: '2026-03-13T17:00:00.000Z',
        end_time: '2026-03-13T17:30:00.000Z',
        participant_count: 2,
        tracking_fields: [
          {
            field: 'lead_id',
            value: ids.lead,
          },
          {
            field: 'calendar_event_id',
            value: 'google-event-1',
          },
        ],
        participants: [
          {
            user_id: 'zoom-user-1',
            name: 'Taylor Brooks',
            email: 'taylor@company.com',
          },
          {
            user_id: 'zoom-user-2',
            name: 'Morgan Manager',
            email: 'morgan@trainovations.com',
          },
        ],
        recording_files: [
          {
            id: 'recording-1',
            file_type: 'MP4',
            play_url: 'https://zoom.us/recording/1',
            download_url: 'https://zoom.us/recording/1/download',
            recording_end: '2026-03-13T17:32:00.000Z',
          },
        ],
      },
    },
  } as const;

  let db: ReturnType<typeof createDatabaseMock>;

  beforeEach(() => {
    db = createDatabaseMock();
  });

  it('creates a meeting, participants, and missing transcript placeholder when a rep connection exists', async () => {
    db.meeting.findFirst.mockResolvedValue(null);
    db.connectedAccount.findFirst.mockResolvedValue({
      id: ids.account,
      userId: ids.user,
    });
    db.repProfile.findUnique.mockResolvedValue({
      id: ids.rep,
      userId: ids.user,
    });
    db.calendarEvent.findFirst.mockResolvedValue({
      id: ids.calendar,
    });
    db.meeting.create.mockResolvedValue({
      id: ids.meeting,
      userId: ids.user,
      repProfileId: ids.rep,
      leadId: ids.lead,
      connectedAccountId: ids.account,
      status: MeetingStatus.completed,
    });
    db.meetingArtifact.deleteMany.mockResolvedValue({ count: 0 });
    db.meetingArtifact.createMany.mockResolvedValue({ count: 2 });
    db.meetingParticipant.deleteMany.mockResolvedValue({ count: 0 });
    db.meetingParticipant.createMany.mockResolvedValue({ count: 2 });
    db.activityLog.create.mockResolvedValue({ id: 'activity_1' });

    const result = await processZoomMeetingCompletedEvent(payload as never, db as never);

    expect(result).toEqual({
      outcome: 'processed',
      shouldQueueAutomation: true,
      meetingId: ids.meeting,
      userId: ids.user,
      connectedAccountId: ids.account,
      created: true,
      artifactSummary: {
        hasRecording: true,
        hasTranscript: false,
        participantCount: 2,
      },
    });

    expect(db.meeting.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: ids.user,
        repProfileId: ids.rep,
        leadId: ids.lead,
        calendarEventId: ids.calendar,
        externalMeetingId: 'zoom_123',
        provider: ConnectedProvider.zoom,
        status: MeetingStatus.completed,
        processingStatus: SyncStatus.pending,
        hasRecording: true,
        hasTranscript: false,
      }),
    });

    expect(db.meetingArtifact.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          meetingId: ids.meeting,
          type: MeetingArtifactType.recording,
          status: MeetingArtifactStatus.available,
        }),
        expect.objectContaining({
          meetingId: ids.meeting,
          type: MeetingArtifactType.transcript,
          status: MeetingArtifactStatus.missing,
        }),
      ]),
    });

    expect(db.meetingParticipant.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          meetingId: ids.meeting,
          displayName: 'Taylor Brooks',
          email: 'taylor@company.com',
        }),
      ]),
    });
  });

  it('updates an existing meeting and stores missing recording and transcript states when artifacts are absent', async () => {
    db.meeting.findFirst.mockResolvedValue({
      id: ids.meeting,
      userId: ids.user,
      repProfileId: ids.rep,
      leadId: null,
      connectedAccountId: ids.account,
      calendarEventId: null,
    });
    db.meeting.update.mockResolvedValue({
      id: ids.meeting,
      userId: ids.user,
      repProfileId: ids.rep,
      leadId: null,
      connectedAccountId: ids.account,
      status: MeetingStatus.completed,
    });
    db.meetingArtifact.deleteMany.mockResolvedValue({ count: 1 });
    db.meetingArtifact.createMany.mockResolvedValue({ count: 2 });
    db.meetingParticipant.deleteMany.mockResolvedValue({ count: 0 });
    db.activityLog.create.mockResolvedValue({ id: 'activity_1' });

    const result = await processZoomMeetingCompletedEvent(
      {
        event: 'meeting.ended',
        payload: {
          object: {
            id: 'zoom_123',
            topic: 'Check-in meeting',
            host_email: 'rep@trainovations.com',
          },
        },
      } as never,
      db as never,
    );

    expect(result.outcome).toBe('processed');
    expect(result.created).toBe(false);
    expect(result.artifactSummary).toEqual({
      hasRecording: false,
      hasTranscript: false,
      participantCount: 0,
    });
    expect(db.meeting.update).toHaveBeenCalledWith({
      where: { id: ids.meeting },
      data: expect.objectContaining({
        status: MeetingStatus.completed,
        hasRecording: false,
        hasTranscript: false,
      }),
    });
    expect(db.meetingArtifact.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          meetingId: ids.meeting,
          type: MeetingArtifactType.recording,
          status: MeetingArtifactStatus.missing,
        }),
        expect.objectContaining({
          meetingId: ids.meeting,
          type: MeetingArtifactType.transcript,
          status: MeetingArtifactStatus.missing,
        }),
      ]),
    });
  });

  it('returns ignored when the meeting cannot be associated to a connected rep or existing meeting', async () => {
    db.meeting.findFirst.mockResolvedValue(null);
    db.connectedAccount.findFirst.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue(null);

    const result = await processZoomMeetingCompletedEvent(payload as never, db as never);

    expect(result.outcome).toBe('ignored');
    expect(db.meeting.create).not.toHaveBeenCalled();
    expect(db.activityLog.create).not.toHaveBeenCalled();
  });
});
