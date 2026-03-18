import {
  ActionItemStatus,
  CallSummaryStatus,
  ConnectedProvider,
  EmailDraftStatus,
  EmailDraftType,
  LeadNoteSourceType,
  MeetingArtifactStatus,
  MeetingArtifactType,
  MeetingParticipantRole,
  MeetingStatus,
  SyncStatus,
} from '@prisma/client';
import { z } from 'zod';

const optionalTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined);

const optionalUrlSchema = z
  .string()
  .trim()
  .url('Enter a valid URL')
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);

const optionalDateSchema = z.coerce.date().optional();

export const upsertMeetingRecordSchema = z.object({
  userId: z.string().cuid('User id must be a valid cuid'),
  repProfileId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  calendarEventId: z.string().cuid().optional(),
  connectedAccountId: z.string().cuid().optional(),
  externalMeetingId: z.string().trim().min(1, 'External meeting id is required').max(191),
  provider: z.enum(['zoom']),
  topic: z.string().trim().min(1, 'Meeting title is required').max(240),
  joinUrl: optionalUrlSchema,
  hostEmail: z.string().trim().email('Enter a valid email').optional().or(z.literal('')).transform((value) => value || undefined),
  participantCount: z.number().int().min(0).max(500).optional(),
  hasRecording: z.boolean().optional().default(false),
  hasTranscript: z.boolean().optional().default(false),
  recordingAvailableAt: optionalDateSchema,
  transcriptAvailableAt: optionalDateSchema,
  processingStatus: z.nativeEnum(SyncStatus).optional().default(SyncStatus.idle),
  processedAt: optionalDateSchema,
  startAt: optionalDateSchema,
  endAt: optionalDateSchema,
  status: z.nativeEnum(MeetingStatus).optional().default(MeetingStatus.scheduled),
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
  rawPayload: z.record(z.string(), z.unknown()).optional(),
});

export const upsertMeetingParticipantSchema = z.object({
  meetingId: z.string().cuid('Meeting id must be a valid cuid'),
  externalUserId: optionalTextSchema(191),
  displayName: z.string().trim().min(1, 'Participant name is required').max(140),
  email: z
    .string()
    .trim()
    .email('Enter a valid email')
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
  role: z
    .nativeEnum(MeetingParticipantRole)
    .optional()
    .default(MeetingParticipantRole.unknown),
  attended: z.boolean().optional().default(true),
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
});

export const upsertMeetingArtifactSchema = z.object({
  meetingId: z.string().cuid('Meeting id must be a valid cuid'),
  type: z.nativeEnum(MeetingArtifactType),
  status: z
    .nativeEnum(MeetingArtifactStatus)
    .optional()
    .default(MeetingArtifactStatus.pending),
  externalArtifactId: optionalTextSchema(191),
  sourceProvider: z
    .nativeEnum(ConnectedProvider)
    .refine(
      (provider) =>
        provider === ConnectedProvider.zoom ||
        provider === ConnectedProvider.google_drive,
      'Artifact source provider must be Zoom or Google Drive',
    )
    .optional(),
  title: optionalTextSchema(240),
  sourceUrl: optionalUrlSchema,
  storageUrl: optionalUrlSchema,
  driveFileId: optionalTextSchema(191),
  mimeType: optionalTextSchema(120),
  contentText: optionalTextSchema(50000),
  contentLanguage: optionalTextSchema(40),
  availableAt: optionalDateSchema,
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
  rawPayload: z.record(z.string(), z.unknown()).optional(),
});

export const createCallSummarySchema = z.object({
  meetingId: z.string().cuid('Meeting id must be a valid cuid'),
  status: z
    .nativeEnum(CallSummaryStatus)
    .optional()
    .default(CallSummaryStatus.generated),
  summary: z.string().trim().min(1, 'Summary text is required').max(12000),
  keyDiscussionPoints: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
  recommendedNextStep: optionalTextSchema(500),
  followUpSnippet: optionalTextSchema(2000),
  modelName: optionalTextSchema(120),
  generationProvider: optionalTextSchema(120),
  generatedAt: optionalDateSchema,
  sourceArtifactIds: z.array(z.string().cuid()).max(20).optional().default([]),
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
  generationMetadata: z.record(z.string(), z.unknown()).optional(),
});

export const createActionItemSchema = z.object({
  meetingId: z.string().cuid('Meeting id must be a valid cuid'),
  callSummaryId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  description: z.string().trim().min(1, 'Action item is required').max(500),
  assigneeName: optionalTextSchema(120),
  sourceExcerpt: optionalTextSchema(500),
  confidenceLabel: optionalTextSchema(40),
  dueAt: optionalDateSchema,
  generatedAt: optionalDateSchema,
  status: z.nativeEnum(ActionItemStatus).optional().default(ActionItemStatus.open),
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
});

export const createEmailDraftSchema = z.object({
  userId: z.string().cuid().optional(),
  repProfileId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  meetingId: z.string().cuid().optional(),
  connectedAccountId: z.string().cuid().optional(),
  type: z.nativeEnum(EmailDraftType).optional().default(EmailDraftType.follow_up),
  status: z.nativeEnum(EmailDraftStatus).optional().default(EmailDraftStatus.draft),
  subject: z.string().trim().min(1, 'Subject is required').max(240),
  bodyText: z.string().trim().min(1, 'Email body is required').max(20000),
  recipientEmail: z
    .string()
    .trim()
    .email('Enter a valid email')
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
  modelName: optionalTextSchema(120),
  generationProvider: optionalTextSchema(120),
  generatedAt: optionalDateSchema,
  approvedAt: optionalDateSchema,
  sentAt: optionalDateSchema,
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
  generationMetadata: z.record(z.string(), z.unknown()).optional(),
});

export const createAiGeneratedLeadNoteSchema = z.object({
  leadId: z.string().cuid('Lead id must be a valid cuid'),
  meetingId: z.string().cuid().optional(),
  callSummaryId: z.string().cuid().optional(),
  sourceType: z.literal(LeadNoteSourceType.ai_generated),
  content: z.string().trim().min(1, 'Note content is required').max(4000),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UpsertMeetingRecordInput = z.infer<typeof upsertMeetingRecordSchema>;
export type UpsertMeetingParticipantInput = z.infer<
  typeof upsertMeetingParticipantSchema
>;
export type UpsertMeetingArtifactInput = z.infer<typeof upsertMeetingArtifactSchema>;
export type CreateCallSummaryInput = z.infer<typeof createCallSummarySchema>;
export type CreateActionItemInput = z.infer<typeof createActionItemSchema>;
export type CreateEmailDraftInput = z.infer<typeof createEmailDraftSchema>;
export type CreateAiGeneratedLeadNoteInput = z.infer<
  typeof createAiGeneratedLeadNoteSchema
>;
