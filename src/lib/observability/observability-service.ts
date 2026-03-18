import * as Sentry from '@sentry/nextjs';

export class ObservabilityService {
  static captureException(error: unknown, context?: Record<string, unknown>) {
    Sentry.captureException(error, {
      extra: context,
    });
  }

  static captureMessage(message: string, context?: Record<string, unknown>) {
    Sentry.captureMessage(message, {
      level: 'info',
      extra: context,
    });
  }

  static captureIntegrationError(
    integration: string,
    error: unknown,
    context?: Record<string, unknown>,
  ) {
    this.captureException(error, {
      area: 'integration',
      integration,
      ...context,
    });
  }

  static captureJobError(
    jobName: string,
    error: unknown,
    context?: Record<string, unknown>,
  ) {
    this.captureException(error, {
      area: 'queue',
      jobName,
      ...context,
    });
  }
}
