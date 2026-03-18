import { describe, expect, it, vi } from 'vitest';

const { queueMock, captureJobError } = vi.hoisted(() => ({
  queueMock: vi.fn(),
  captureJobError: vi.fn(),
}));

vi.mock('bullmq', () => ({
  Queue: queueMock,
}));

vi.mock('@/lib/observability/observability-service', () => ({
  ObservabilityService: {
    captureJobError,
  },
}));

import { QueueJobName, QueueService } from './queue-service';

describe('QueueService', () => {
  it('names queues consistently by job domain', () => {
    expect(QueueService.getQueueName(QueueJobName.MeetingProcessing)).toBe(
      'trainovations:meeting-processing',
    );
  });

  it('creates a BullMQ queue with the derived queue name', () => {
    QueueService.createQueue(QueueJobName.NotionSync);

    expect(queueMock).toHaveBeenCalledWith(
      'trainovations:notion-sync',
      expect.objectContaining({
        connection: expect.any(Object),
      }),
    );
  });

  it('captures queue errors before rethrowing enqueue failures', async () => {
    const add = vi.fn().mockRejectedValue(new Error('redis unavailable'));
    queueMock.mockImplementationOnce(() => ({ add }));

    await expect(
      QueueService.enqueue(QueueJobName.OcrProcessing, {
        entityId: 'scan_1',
      }),
    ).rejects.toThrow('redis unavailable');

    expect(captureJobError).toHaveBeenCalledWith(
      'ocr-processing',
      expect.any(Error),
      expect.objectContaining({
        queueName: 'trainovations:ocr-processing',
      }),
    );
  });
});
