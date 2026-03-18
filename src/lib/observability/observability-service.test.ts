import { describe, expect, it, vi } from 'vitest';

const { captureException, captureMessage } = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException,
  captureMessage,
}));

import { ObservabilityService } from './observability-service';

describe('ObservabilityService', () => {
  it('forwards exception capture to Sentry', () => {
    ObservabilityService.captureException(new Error('boom'), { area: 'test' });

    expect(captureException).toHaveBeenCalled();
  });

  it('forwards message capture to Sentry', () => {
    ObservabilityService.captureMessage('hello', { area: 'test' });

    expect(captureMessage).toHaveBeenCalledWith(
      'hello',
      expect.objectContaining({
        level: 'info',
      }),
    );
  });

  it('adds integration metadata for integration failures', () => {
    ObservabilityService.captureIntegrationError('google', new Error('bad token'), {
      provider: 'gmail',
    });

    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({
          area: 'integration',
          integration: 'google',
          provider: 'gmail',
        }),
      }),
    );
  });

  it('adds queue metadata for job failures', () => {
    ObservabilityService.captureJobError('meeting-processing', new Error('boom'), {
      entityId: 'meeting_1',
    });

    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({
          area: 'queue',
          jobName: 'meeting-processing',
          entityId: 'meeting_1',
        }),
      }),
    );
  });
});
