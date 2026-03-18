import { AutomationJobType, AutomationJobStatus, ConnectedProvider } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { enqueueMock } = vi.hoisted(() => ({
  enqueueMock: vi.fn(),
}));

vi.mock('./queue-service', async () => {
  const actual = await vi.importActual<typeof import('./queue-service')>('./queue-service');

  return {
    ...actual,
    QueueService: {
      ...actual.QueueService,
      enqueue: enqueueMock,
    },
  };
});

import { JobEnqueuer } from './job-enqueuer';

describe('JobEnqueuer', () => {
  beforeEach(() => {
    enqueueMock.mockReset();
  });

  it('creates a queued automation job record and enqueues it through BullMQ', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'job_1',
      type: AutomationJobType.zoom_meeting_ingest,
      provider: ConnectedProvider.zoom,
      status: AutomationJobStatus.queued,
    });

    const result = await JobEnqueuer.enqueueAutomationJob(
      {
        type: AutomationJobType.zoom_meeting_ingest,
        userId: 'user_1',
        connectedAccountId: 'account_1',
        meetingId: 'meeting_1',
      },
      {
        automationJob: {
          create,
        },
      } as never,
    );

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: AutomationJobType.zoom_meeting_ingest,
        status: AutomationJobStatus.queued,
      }),
    });
    expect(enqueueMock).toHaveBeenCalled();
    expect(result.id).toBe('job_1');
  });

  it('enqueues the three-part Zoom meeting pipeline', async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce({ id: 'job_1' })
      .mockResolvedValueOnce({ id: 'job_2' })
      .mockResolvedValueOnce({ id: 'job_3' });

    const result = await JobEnqueuer.enqueueMeetingPipeline(
      {
        userId: 'user_1',
        connectedAccountId: 'account_1',
        meetingId: 'meeting_1',
      },
      {
        automationJob: {
          create,
        },
      } as never,
    );

    expect(create).toHaveBeenCalledTimes(3);
    expect(enqueueMock).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(3);
  });
});
