import { QueueJobName } from './queue-service';

export type QueueJobProcessor = (payload: {
  automationJobId?: string;
  [key: string]: unknown;
}) => Promise<void>;

export const queueProcessors: Partial<Record<QueueJobName, QueueJobProcessor>> = {
  [QueueJobName.MeetingProcessing]: async () => {
    return;
  },
  [QueueJobName.NotionSync]: async () => {
    return;
  },
  [QueueJobName.EmailDraftGeneration]: async () => {
    return;
  },
  [QueueJobName.EnrichmentRefresh]: async () => {
    return;
  },
  [QueueJobName.OcrProcessing]: async () => {
    return;
  },
};
