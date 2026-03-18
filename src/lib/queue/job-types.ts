import { AutomationJobType, ConnectedProvider } from '@prisma/client';
import type { JobsOptions } from 'bullmq';

import { QueueJobName } from './queue-service';

export type AutomationQueueJobDefinition = {
  queueName: QueueJobName;
  jobType: AutomationJobType;
  provider: ConnectedProvider;
  options?: JobsOptions;
};

export const AUTOMATION_QUEUE_JOB_MAP: Record<
  AutomationJobType,
  AutomationQueueJobDefinition
> = {
  [AutomationJobType.zoom_meeting_ingest]: {
    queueName: QueueJobName.MeetingProcessing,
    jobType: AutomationJobType.zoom_meeting_ingest,
    provider: ConnectedProvider.zoom,
    options: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3_000,
      },
      removeOnComplete: 50,
    },
  },
  [AutomationJobType.call_summary_generation]: {
    queueName: QueueJobName.MeetingProcessing,
    jobType: AutomationJobType.call_summary_generation,
    provider: ConnectedProvider.zoom,
    options: {
      attempts: 3,
      removeOnComplete: 50,
    },
  },
  [AutomationJobType.action_item_extraction]: {
    queueName: QueueJobName.MeetingProcessing,
    jobType: AutomationJobType.action_item_extraction,
    provider: ConnectedProvider.zoom,
    options: {
      attempts: 3,
      removeOnComplete: 50,
    },
  },
  [AutomationJobType.crm_note_sync]: {
    queueName: QueueJobName.NotionSync,
    jobType: AutomationJobType.crm_note_sync,
    provider: ConnectedProvider.notion,
  },
  [AutomationJobType.calendar_follow_up]: {
    queueName: QueueJobName.MeetingProcessing,
    jobType: AutomationJobType.calendar_follow_up,
    provider: ConnectedProvider.google_calendar,
  },
  [AutomationJobType.notion_sync]: {
    queueName: QueueJobName.NotionSync,
    jobType: AutomationJobType.notion_sync,
    provider: ConnectedProvider.notion,
  },
  [AutomationJobType.meeting_note_creation]: {
    queueName: QueueJobName.MeetingProcessing,
    jobType: AutomationJobType.meeting_note_creation,
    provider: ConnectedProvider.zoom,
  },
  [AutomationJobType.follow_up_email_draft]: {
    queueName: QueueJobName.EmailDraftGeneration,
    jobType: AutomationJobType.follow_up_email_draft,
    provider: ConnectedProvider.google_gmail,
  },
  [AutomationJobType.drive_artifact_link]: {
    queueName: QueueJobName.EnrichmentRefresh,
    jobType: AutomationJobType.drive_artifact_link,
    provider: ConnectedProvider.google_drive,
  },
};
