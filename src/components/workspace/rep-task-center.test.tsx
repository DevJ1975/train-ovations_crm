import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RepTaskCenter } from './rep-task-center';

describe('RepTaskCenter', () => {
  it('renders active rep tasks with workflow actions', () => {
    render(
      <RepTaskCenter
        tasks={[
          {
            id: 'task_1',
            type: 'send_follow_up',
            status: 'generated',
            priority: 'high',
            title: 'Respond to new lead',
            reason: 'This lead is still new and needs a first response.',
            explanation: 'Generated because no first-response workflow has been completed yet.',
            recommendedDueAt: new Date('2026-03-15T12:00:00.000Z'),
            scheduledAt: null,
            scheduledEndAt: null,
            snoozedUntil: null,
            lead: {
              id: 'lead_1',
              firstName: 'Alex',
              lastName: 'Stone',
              company: 'Metro Transit Systems',
            },
          },
        ]}
        updateTaskStatusAction={vi.fn(async () => {})}
        scheduleTaskAction={vi.fn(async () => {})}
        unscheduleTaskAction={vi.fn(async () => {})}
        snoozeTaskAction={vi.fn(async () => {})}
      />,
    );

    expect(screen.getByText(/task center/i)).toBeInTheDocument();
    expect(screen.getByText(/respond to new lead/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open lead/i })).toHaveAttribute(
      'href',
      '/workspace/leads/lead_1',
    );
    expect(screen.getByRole('button', { name: /acknowledge/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
  });
});
