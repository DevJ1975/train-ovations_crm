import {
  ActionItemStatus,
  ActivityLogType,
  AutomationJobType,
  EmailDraftStatus,
  LeadNoteSourceType,
  MeetingArtifactStatus,
  MeetingArtifactType,
} from '@prisma/client';

export const SOURCE_BACKED_MEETING_ARTIFACT_TYPES = [
  MeetingArtifactType.recording,
  MeetingArtifactType.transcript,
  MeetingArtifactType.chat,
  MeetingArtifactType.note,
  MeetingArtifactType.drive_link,
] as const;

export const GENERATED_MEETING_OUTPUT_JOB_TYPES = [
  AutomationJobType.call_summary_generation,
  AutomationJobType.action_item_extraction,
  AutomationJobType.meeting_note_creation,
  AutomationJobType.follow_up_email_draft,
  AutomationJobType.calendar_follow_up,
  AutomationJobType.notion_sync,
] as const;

export const AI_GENERATED_AUDIT_FIELDS = {
  noteSourceType: LeadNoteSourceType.ai_generated,
  draftStatus: EmailDraftStatus.draft,
  actionItemStatus: ActionItemStatus.open,
  artifactMissingStatus: MeetingArtifactStatus.missing,
  activityTypes: [
    ActivityLogType.meeting_processed,
    ActivityLogType.meeting_note_created,
    ActivityLogType.meeting_follow_up_drafted,
  ],
} as const;

export function isSourceBackedArtifactType(type: MeetingArtifactType) {
  return SOURCE_BACKED_MEETING_ARTIFACT_TYPES.includes(
    type as (typeof SOURCE_BACKED_MEETING_ARTIFACT_TYPES)[number],
  );
}
