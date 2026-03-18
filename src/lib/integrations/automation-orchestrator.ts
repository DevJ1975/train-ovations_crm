import { MeetingStatus } from '@prisma/client';

import { JobEnqueuer } from '@/lib/queue/job-enqueuer';

export class AutomationOrchestrator {
  static async queueZoomMeetingCompletionPipeline(input: {
    userId: string;
    connectedAccountId?: string;
    meetingId: string;
  }) {
    return JobEnqueuer.enqueueMeetingPipeline(input);
  }

  static shouldQueueMeetingPipeline(status: MeetingStatus) {
    return status === MeetingStatus.completed;
  }
}
