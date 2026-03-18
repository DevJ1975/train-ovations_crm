import { AutomationJobStatus, type AutomationJobType, type Prisma } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';

import { AUTOMATION_QUEUE_JOB_MAP } from './job-types';
import { QueueService } from './queue-service';

type QueueableAutomationJobInput = {
  type: AutomationJobType;
  userId?: string;
  connectedAccountId?: string;
  meetingId?: string;
  payload?: Record<string, unknown>;
};

interface QueueAutomationDatabaseClient {
  automationJob: ReturnType<typeof getPrismaClient>['automationJob'];
}

export class JobEnqueuer {
  static async enqueueAutomationJob(
    input: QueueableAutomationJobInput,
    db: QueueAutomationDatabaseClient = getPrismaClient(),
  ) {
    const config = AUTOMATION_QUEUE_JOB_MAP[input.type];

    const automationJob = await db.automationJob.create({
      data: {
        userId: input.userId,
        connectedAccountId: input.connectedAccountId,
        meetingId: input.meetingId,
        provider: config.provider,
        type: input.type,
        status: AutomationJobStatus.queued,
        payload: input.payload as Prisma.InputJsonValue | undefined,
      },
    });

    await QueueService.enqueue(
      config.queueName,
      {
        entityId: automationJob.id,
        metadata: {
          automationJobId: automationJob.id,
          type: input.type,
          meetingId: input.meetingId,
          userId: input.userId,
          connectedAccountId: input.connectedAccountId,
          ...input.payload,
        },
      },
      {
        jobId: automationJob.id,
        ...config.options,
      },
    );

    return automationJob;
  }

  static async enqueueMeetingPipeline(input: {
    userId: string;
    connectedAccountId?: string;
    meetingId: string;
  }, db: QueueAutomationDatabaseClient = getPrismaClient()) {
    return Promise.all([
      this.enqueueAutomationJob({
        type: 'zoom_meeting_ingest',
        userId: input.userId,
        connectedAccountId: input.connectedAccountId,
        meetingId: input.meetingId,
      }, db),
      this.enqueueAutomationJob({
        type: 'call_summary_generation',
        userId: input.userId,
        connectedAccountId: input.connectedAccountId,
        meetingId: input.meetingId,
      }, db),
      this.enqueueAutomationJob({
        type: 'action_item_extraction',
        userId: input.userId,
        connectedAccountId: input.connectedAccountId,
        meetingId: input.meetingId,
      }, db),
    ]);
  }
}
