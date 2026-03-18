import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RepAlerts } from './rep-alerts';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RepAlerts', () => {
  it('renders alerts and supports status updates', async () => {
    const onStatusChange = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <RepAlerts
        alerts={[
          {
            id: 'alert_1',
            title: 'Champion changed companies',
            message: 'A key contact moved to a new organization.',
            priority: 'urgent',
            status: 'open',
            suggestedNextStep: 'Reach out within 48 hours.',
            triggeredAt: '2026-03-14T12:00:00.000Z',
            resolvedAt: null,
            lead: {
              id: 'lead_1',
              firstName: 'Alex',
              lastName: 'Stone',
              company: 'Metro Transit Systems',
              email: 'alex@metrotransit.com',
            },
          },
        ]}
        onStatusChange={onStatusChange}
      />,
    );

    expect(screen.getByText(/alert queue/i)).toBeInTheDocument();
    expect(screen.getByText(/champion changed companies/i)).toBeInTheDocument();
    expect(screen.getByText(/reach out within 48 hours/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /mark resolved/i }));

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith('alert_1', 'resolved');
    });
  });
});
