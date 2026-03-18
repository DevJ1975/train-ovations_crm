import { AutomationJobType, ConnectedProvider } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { AUTOMATION_QUEUE_JOB_MAP } from './job-types';
import { QueueJobName } from './queue-service';

describe('AUTOMATION_QUEUE_JOB_MAP', () => {
  it('maps meeting automation jobs onto the meeting-processing queue', () => {
    expect(AUTOMATION_QUEUE_JOB_MAP[AutomationJobType.zoom_meeting_ingest]).toMatchObject(
      {
        queueName: QueueJobName.MeetingProcessing,
        provider: ConnectedProvider.zoom,
      },
    );
  });

  it('maps follow-up email generation onto the email draft queue', () => {
    expect(
      AUTOMATION_QUEUE_JOB_MAP[AutomationJobType.follow_up_email_draft].queueName,
    ).toBe(QueueJobName.EmailDraftGeneration);
  });
});
