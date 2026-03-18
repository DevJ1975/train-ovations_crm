import {
  ActivityLogType,
  ConnectedProvider,
  MeetingArtifactStatus,
  MeetingArtifactType,
  MeetingStatus,
  SyncStatus,
  type Prisma,
} from '@prisma/client';

import { createActivityLogEntry } from '@/lib/services/activity-log-service';
import type { DatabaseClient } from '@/lib/services/types';
import { getPrismaClient } from '@/lib/prisma';
import {
  upsertMeetingArtifactSchema,
  upsertMeetingParticipantSchema,
  upsertMeetingRecordSchema,
} from '@/lib/validation/meeting-intelligence';

type JsonRecord = Prisma.InputJsonValue & Record<string, unknown>;

interface ZoomTrackingField {
  field?: string;
  label?: string;
  value?: string;
}

interface ZoomRecordingFile {
  id?: string | number;
  file_type?: string;
  file_extension?: string;
  file_size?: number;
  play_url?: string;
  download_url?: string;
  status?: string;
  recording_type?: string;
  recording_start?: string;
  recording_end?: string;
}

interface ZoomParticipant {
  id?: string | number;
  user_id?: string;
  name?: string;
  user_name?: string;
  email?: string;
  registrant_id?: string;
}

interface ZoomMeetingObject {
  id?: string | number;
  topic?: string;
  host_email?: string;
  join_url?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  uuid?: string;
  recording_count?: number;
  recording_files?: ZoomRecordingFile[];
  participant_count?: number;
  participants?: ZoomParticipant[];
  tracking_fields?: ZoomTrackingField[];
  calendar_event_id?: string;
  calendarEventId?: string;
  lead_id?: string;
  rep_profile_id?: string;
  share_url?: string;
  transcript_url?: string;
  transcript_text?: string;
  chat_file_url?: string;
  [key: string]: unknown;
}

interface ResolvedMeetingOwner {
  userId: string;
  repProfileId?: string;
  connectedAccountId?: string;
}

interface MeetingArtifactRecordInput {
  type: MeetingArtifactType;
  status: MeetingArtifactStatus;
  externalArtifactId?: string;
  sourceProvider?: ConnectedProvider;
  title?: string;
  sourceUrl?: string;
  storageUrl?: string;
  driveFileId?: string;
  mimeType?: string;
  contentText?: string;
  availableAt?: Date;
  providerMetadata?: Prisma.InputJsonValue;
  rawPayload?: Prisma.InputJsonValue;
}

export interface ProcessZoomMeetingCompletedResult {
  outcome: 'processed' | 'ignored';
  shouldQueueAutomation: boolean;
  meetingId?: string;
  userId?: string;
  connectedAccountId?: string;
  created: boolean;
  artifactSummary: {
    hasRecording: boolean;
    hasTranscript: boolean;
    participantCount: number;
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value ? (value as Record<string, unknown>) : undefined;
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseDate(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function normalizeTrackingKey(value?: string) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function extractTrackingValue(
  fields: ZoomTrackingField[] | undefined,
  keys: string[],
) {
  if (!fields?.length) {
    return undefined;
  }

  const keySet = new Set(keys.map((key) => normalizeTrackingKey(key)));

  for (const field of fields) {
    const normalized = normalizeTrackingKey(field.field ?? field.label);

    if (normalized && keySet.has(normalized)) {
      return asString(field.value);
    }
  }

  return undefined;
}

function extractMeetingPayload(payload: JsonRecord) {
  const payloadRecord = asRecord(payload.payload);
  const meetingObject = asRecord(payloadRecord?.object) as ZoomMeetingObject | undefined;

  return meetingObject;
}

function buildParticipantPayloads(meetingId: string, meeting: ZoomMeetingObject) {
  const participants = Array.isArray(meeting.participants) ? meeting.participants : [];

  return participants
    .map((participant) => {
      const payload = upsertMeetingParticipantSchema.safeParse({
        meetingId,
        externalUserId:
          asString(participant.user_id) ?? asString(participant.registrant_id),
        displayName:
          asString(participant.name) ??
          asString(participant.user_name) ??
          'Unknown attendee',
        email: asString(participant.email),
        role: 'external_attendee',
        attended: true,
        providerMetadata: participant as Prisma.InputJsonValue,
      });

      return payload.success ? payload.data : null;
    })
    .filter((participant): participant is NonNullable<typeof participant> => !!participant);
}

function buildArtifactPayloads(meetingId: string, meeting: ZoomMeetingObject) {
  const recordingFiles = Array.isArray(meeting.recording_files)
    ? meeting.recording_files
    : [];

  const artifacts: MeetingArtifactRecordInput[] = [];

  for (const file of recordingFiles) {
    const fileType = (file.file_type ?? file.recording_type ?? '').toUpperCase();
    const availableAt = parseDate(file.recording_end ?? file.recording_start);
    const artifactBase = {
      externalArtifactId:
        typeof file.id === 'string' || typeof file.id === 'number'
          ? String(file.id)
          : undefined,
      sourceProvider: ConnectedProvider.zoom,
      title: meeting.topic,
      sourceUrl: asString(file.play_url) ?? asString(file.download_url),
      storageUrl: asString(file.download_url),
      mimeType: asString(file.file_extension),
      availableAt,
      providerMetadata: file as Prisma.InputJsonValue,
      rawPayload: file as Prisma.InputJsonValue,
    };

    if (fileType.includes('TRANSCRIPT')) {
      artifacts.push({
        type: MeetingArtifactType.transcript,
        status: MeetingArtifactStatus.available,
        ...artifactBase,
      });
      continue;
    }

    if (fileType.includes('CHAT')) {
      artifacts.push({
        type: MeetingArtifactType.chat,
        status: MeetingArtifactStatus.available,
        ...artifactBase,
      });
      continue;
    }

    artifacts.push({
      type: MeetingArtifactType.recording,
      status: MeetingArtifactStatus.available,
      ...artifactBase,
    });
  }

  if (asString(meeting.transcript_url) || asString(meeting.transcript_text)) {
    artifacts.push({
      type: MeetingArtifactType.transcript,
      status: MeetingArtifactStatus.available,
      sourceProvider: ConnectedProvider.zoom,
      title: `${meeting.topic ?? 'Meeting'} transcript`,
      sourceUrl: asString(meeting.transcript_url),
      contentText: asString(meeting.transcript_text),
      providerMetadata: {
        transcriptUrl: asString(meeting.transcript_url),
      },
    });
  }

  if (asString(meeting.chat_file_url)) {
    artifacts.push({
      type: MeetingArtifactType.chat,
      status: MeetingArtifactStatus.available,
      sourceProvider: ConnectedProvider.zoom,
      title: `${meeting.topic ?? 'Meeting'} chat`,
      sourceUrl: asString(meeting.chat_file_url),
      providerMetadata: {
        chatFileUrl: asString(meeting.chat_file_url),
      },
    });
  }

  const hasRecording = artifacts.some(
    (artifact) => artifact.type === MeetingArtifactType.recording,
  );
  const hasTranscript = artifacts.some(
    (artifact) => artifact.type === MeetingArtifactType.transcript,
  );

  if (!hasRecording) {
    artifacts.push({
      type: MeetingArtifactType.recording,
      status: MeetingArtifactStatus.missing,
      sourceProvider: ConnectedProvider.zoom,
      title: `${meeting.topic ?? 'Meeting'} recording`,
      providerMetadata: {
        reason: 'No recording artifacts were available in the Zoom completion payload.',
      },
    });
  }

  if (!hasTranscript) {
    artifacts.push({
      type: MeetingArtifactType.transcript,
      status: MeetingArtifactStatus.missing,
      sourceProvider: ConnectedProvider.zoom,
      title: `${meeting.topic ?? 'Meeting'} transcript`,
      providerMetadata: {
        reason: 'No transcript artifacts were available in the Zoom completion payload.',
      },
    });
  }

  return artifacts
    .map((artifact) => {
      const payload = upsertMeetingArtifactSchema.safeParse({
        meetingId,
        ...artifact,
      });

      return payload.success ? payload.data : null;
    })
    .filter((artifact): artifact is NonNullable<typeof artifact> => !!artifact);
}

async function resolveMeetingOwner(
  meeting: ZoomMeetingObject,
  db: DatabaseClient,
): Promise<ResolvedMeetingOwner | null> {
  const hostEmail = asString(meeting.host_email)?.toLowerCase();
  const trackingFields = Array.isArray(meeting.tracking_fields)
    ? meeting.tracking_fields
    : undefined;

  const connectedAccount = hostEmail
    ? await db.connectedAccount.findFirst({
        where: {
          provider: ConnectedProvider.zoom,
          accountEmail: hostEmail,
        },
      })
    : null;

  if (connectedAccount) {
    const repProfile = await db.repProfile.findUnique({
      where: { userId: connectedAccount.userId },
    });

    return {
      userId: connectedAccount.userId,
      repProfileId:
        extractTrackingValue(trackingFields, ['rep_profile_id']) ?? repProfile?.id,
      connectedAccountId: connectedAccount.id,
    };
  }

  if (hostEmail) {
    const user = await db.user.findUnique({
      where: { email: hostEmail },
    });

    if (user) {
      const repProfile = await db.repProfile.findUnique({
        where: { userId: user.id },
      });

      return {
        userId: user.id,
        repProfileId:
          extractTrackingValue(trackingFields, ['rep_profile_id']) ?? repProfile?.id,
      };
    }
  }

  return null;
}

async function resolveCalendarEventId(
  meeting: ZoomMeetingObject,
  db: DatabaseClient,
) {
  const trackingFields = Array.isArray(meeting.tracking_fields)
    ? meeting.tracking_fields
    : undefined;
  const externalCalendarEventId =
    asString(meeting.calendar_event_id) ??
    asString(meeting.calendarEventId) ??
    extractTrackingValue(trackingFields, ['calendar_event_id']);

  if (!externalCalendarEventId) {
    return undefined;
  }

  const calendarEvent = await db.calendarEvent.findFirst({
    where: {
      externalEventId: externalCalendarEventId,
    },
  });

  return calendarEvent?.id;
}

export async function processZoomMeetingCompletedEvent(
  payload: JsonRecord,
  db: DatabaseClient = getPrismaClient(),
): Promise<ProcessZoomMeetingCompletedResult> {
  const meetingObject = extractMeetingPayload(payload);

  if (!meetingObject?.id) {
    return {
      outcome: 'ignored',
      shouldQueueAutomation: false,
      created: false,
      artifactSummary: {
        hasRecording: false,
        hasTranscript: false,
        participantCount: 0,
      },
    };
  }

  const externalMeetingId = String(meetingObject.id);
  const existingMeeting = await db.meeting.findFirst({
    where: {
      provider: ConnectedProvider.zoom,
      externalMeetingId,
    },
  });

  const owner = existingMeeting
    ? {
        userId: existingMeeting.userId,
        repProfileId: existingMeeting.repProfileId ?? undefined,
        connectedAccountId: existingMeeting.connectedAccountId ?? undefined,
      }
    : await resolveMeetingOwner(meetingObject, db);

  if (!owner) {
    return {
      outcome: 'ignored',
      shouldQueueAutomation: false,
      created: false,
      artifactSummary: {
        hasRecording: false,
        hasTranscript: false,
        participantCount: 0,
      },
    };
  }

  const trackingFields = Array.isArray(meetingObject.tracking_fields)
    ? meetingObject.tracking_fields
    : undefined;
  const leadId =
    extractTrackingValue(trackingFields, ['lead_id']) ??
    asString(meetingObject.lead_id) ??
    existingMeeting?.leadId ??
    undefined;
  const repProfileId =
    extractTrackingValue(trackingFields, ['rep_profile_id']) ??
    asString(meetingObject.rep_profile_id) ??
    owner.repProfileId ??
    existingMeeting?.repProfileId ??
    undefined;
  const calendarEventId =
    (await resolveCalendarEventId(meetingObject, db)) ??
    existingMeeting?.calendarEventId ??
    undefined;

  const artifactPayloads = buildArtifactPayloads(
    existingMeeting?.id ?? 'ck1234567890123456789012',
    meetingObject,
  );
  const participantPayloads = buildParticipantPayloads(
    existingMeeting?.id ?? 'ck1234567890123456789012',
    meetingObject,
  );
  const hasRecording = artifactPayloads.some(
    (artifact) =>
      artifact.type === MeetingArtifactType.recording &&
      artifact.status === MeetingArtifactStatus.available,
  );
  const hasTranscript = artifactPayloads.some(
    (artifact) =>
      artifact.type === MeetingArtifactType.transcript &&
      artifact.status === MeetingArtifactStatus.available,
  );

  const meetingInput = upsertMeetingRecordSchema.parse({
    userId: owner.userId,
    repProfileId,
    leadId,
    calendarEventId,
    connectedAccountId: owner.connectedAccountId ?? existingMeeting?.connectedAccountId ?? undefined,
    externalMeetingId,
    provider: 'zoom',
    topic: asString(meetingObject.topic) ?? 'Zoom meeting',
    joinUrl: asString(meetingObject.join_url),
    hostEmail: asString(meetingObject.host_email),
    participantCount:
      participantPayloads.length ||
      (typeof meetingObject.participant_count === 'number'
        ? meetingObject.participant_count
        : undefined),
    hasRecording,
    hasTranscript,
    recordingAvailableAt: hasRecording ? new Date() : undefined,
    transcriptAvailableAt: hasTranscript ? new Date() : undefined,
    processingStatus: SyncStatus.pending,
    startAt: parseDate(meetingObject.start_time),
    endAt: parseDate(meetingObject.end_time),
    status: MeetingStatus.completed,
    providerMetadata: {
      zoomUuid: asString(meetingObject.uuid),
      shareUrl: asString(meetingObject.share_url),
    },
    rawPayload: meetingObject as Prisma.InputJsonValue,
  });

  const meetingData = {
    ...meetingInput,
    provider: ConnectedProvider.zoom,
    providerMetadata: meetingInput.providerMetadata as Prisma.InputJsonValue | undefined,
    rawPayload: meetingInput.rawPayload as Prisma.InputJsonValue | undefined,
  };

  const meeting = existingMeeting
    ? await db.meeting.update({
        where: { id: existingMeeting.id },
        data: meetingData,
      })
    : await db.meeting.create({
        data: meetingData,
      });

  const finalizedArtifacts = buildArtifactPayloads(meeting.id, meetingObject);
  const finalizedParticipants = buildParticipantPayloads(meeting.id, meetingObject);

  await db.meetingArtifact.deleteMany({
    where: {
      meetingId: meeting.id,
      sourceProvider: ConnectedProvider.zoom,
    },
  });

  if (finalizedArtifacts.length) {
    await db.meetingArtifact.createMany({
      data: finalizedArtifacts.map((artifact) => ({
        ...artifact,
        providerMetadata: artifact.providerMetadata as Prisma.InputJsonValue | undefined,
        rawPayload: artifact.rawPayload as Prisma.InputJsonValue | undefined,
      })),
    });
  }

  await db.meetingParticipant.deleteMany({
    where: { meetingId: meeting.id },
  });

  if (finalizedParticipants.length) {
    await db.meetingParticipant.createMany({
      data: finalizedParticipants.map((participant) => ({
        ...participant,
        providerMetadata: participant.providerMetadata as Prisma.InputJsonValue | undefined,
      })),
    });
  }

  await createActivityLogEntry(
    {
      type: ActivityLogType.meeting_processed,
      description: 'Zoom meeting completion recorded.',
      actorUserId: meeting.userId,
      repProfileId: meeting.repProfileId ?? undefined,
      leadId: meeting.leadId ?? undefined,
      metadata: {
        meetingId: meeting.id,
        externalMeetingId,
        hasRecording,
        hasTranscript,
        participantCount: finalizedParticipants.length,
      },
    },
    db,
  );

  return {
    outcome: 'processed',
    shouldQueueAutomation: true,
    meetingId: meeting.id,
    userId: meeting.userId,
    connectedAccountId: meeting.connectedAccountId ?? undefined,
    created: !existingMeeting,
    artifactSummary: {
      hasRecording,
      hasTranscript,
      participantCount: finalizedParticipants.length,
    },
  };
}
