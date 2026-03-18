import type { JobsOptions } from 'bullmq';
import { Queue } from 'bullmq';

import { ObservabilityService } from '@/lib/observability/observability-service';

export enum QueueJobName {
  MeetingProcessing = 'meeting-processing',
  NotionSync = 'notion-sync',
  EnrichmentRefresh = 'enrichment-refresh',
  EmailDraftGeneration = 'email-draft-generation',
  OcrProcessing = 'ocr-processing',
}

export type QueueJobPayload = {
  entityId?: string;
  scheduledFor?: string;
  metadata?: Record<string, unknown>;
};

export type QueueJobDefinition = {
  name: string;
  queueName: string;
  payload: QueueJobPayload;
  options?: JobsOptions;
};

function getRedisConnection() {
  if (process.env.REDIS_URL) {
    return { url: process.env.REDIS_URL };
  }

  return {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

export class QueueService {
  static getQueueName(jobName: QueueJobName) {
    return `trainovations:${jobName}`;
  }

  static createQueue(jobName: QueueJobName) {
    return new Queue(this.getQueueName(jobName), {
      connection: getRedisConnection(),
    });
  }

  static buildJobPayload(jobName: QueueJobName, payload: QueueJobPayload) {
    return {
      name: jobName,
      queueName: this.getQueueName(jobName),
      payload,
    };
  }

  static async enqueue(
    jobName: QueueJobName,
    payload: QueueJobPayload,
    options?: JobsOptions,
  ) {
    const queue = this.createQueue(jobName);
    const jobDefinition = this.buildJobPayload(jobName, payload);

    try {
      return await queue.add(jobDefinition.name, jobDefinition.payload, options);
    } catch (error) {
      ObservabilityService.captureJobError(jobDefinition.name, error, {
        queueName: jobDefinition.queueName,
        payload: jobDefinition.payload,
      });
      throw error;
    }
  }
}
