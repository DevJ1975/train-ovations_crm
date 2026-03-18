import {
  ActivityLogType,
  AutomationJobType,
  LeadNoteSourceType,
  MeetingArtifactType,
} from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  AI_GENERATED_AUDIT_FIELDS,
  GENERATED_MEETING_OUTPUT_JOB_TYPES,
  SOURCE_BACKED_MEETING_ARTIFACT_TYPES,
  isSourceBackedArtifactType,
} from './contracts';

describe('meeting intelligence contracts', () => {
  it('treats transcripts and drive links as source-backed artifacts', () => {
    expect(SOURCE_BACKED_MEETING_ARTIFACT_TYPES).toContain(
      MeetingArtifactType.transcript,
    );
    expect(SOURCE_BACKED_MEETING_ARTIFACT_TYPES).toContain(
      MeetingArtifactType.drive_link,
    );
    expect(isSourceBackedArtifactType(MeetingArtifactType.summary)).toBe(false);
  });

  it('defines the generated-output automation jobs separately from ingestion', () => {
    expect(GENERATED_MEETING_OUTPUT_JOB_TYPES).toContain(
      AutomationJobType.follow_up_email_draft,
    );
    expect(GENERATED_MEETING_OUTPUT_JOB_TYPES).not.toContain(
      AutomationJobType.zoom_meeting_ingest,
    );
  });

  it('marks AI outputs with audit-friendly defaults', () => {
    expect(AI_GENERATED_AUDIT_FIELDS.noteSourceType).toBe(
      LeadNoteSourceType.ai_generated,
    );
    expect(AI_GENERATED_AUDIT_FIELDS.activityTypes).toContain(
      ActivityLogType.meeting_note_created,
    );
  });
});
