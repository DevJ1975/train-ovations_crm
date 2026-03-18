import { ActivityLogType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { createActivityLogEntry } from './activity-log-service';

describe('activity log service', () => {
  it('creates an activity log entry', async () => {
    const db = {
      activityLog: {
        create: vi.fn().mockResolvedValue({ id: 'log_1' }),
      },
    };

    const result = await createActivityLogEntry(
      {
        type: ActivityLogType.lead_created,
        description: 'Lead created for Alex Stone.',
        leadId: 'lead_1',
      },
      db as never,
    );

    expect(db.activityLog.create).toHaveBeenCalledWith({
      data: {
        type: ActivityLogType.lead_created,
        description: 'Lead created for Alex Stone.',
        leadId: 'lead_1',
      },
    });
    expect(result).toEqual({ id: 'log_1' });
  });
});
