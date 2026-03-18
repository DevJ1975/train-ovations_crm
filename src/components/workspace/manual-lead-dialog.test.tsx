import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ManualLeadDialog } from './manual-lead-dialog';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ManualLeadDialog', () => {
  it('creates a lead from the workspace form', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        lead: {
          id: 'lead_1',
          duplicateOfLeadId: null,
        },
      }),
    });
    const onCreated = vi.fn();

    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<ManualLeadDialog onCreated={onCreated} />);

    await user.click(screen.getByRole('button', { name: /add lead manually/i }));

    await user.type(screen.getByLabelText(/first name/i), 'Jordan');
    await user.type(screen.getByLabelText(/last name/i), 'Lee');
    await user.type(screen.getByLabelText(/email/i), 'jordan@example.com');
    await user.type(screen.getByLabelText(/company/i), 'Apex Industrial');
    await user.type(screen.getByLabelText(/location/i), 'Dallas, Texas');

    await user.click(screen.getByRole('button', { name: /^create lead$/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/workspace/leads',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Dallas, Texas'),
        }),
      );
    });

    expect(await screen.findByText(/lead created and added to your rep queue/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open created lead/i })).toHaveAttribute(
      'href',
      '/workspace/leads/lead_1',
    );
    expect(onCreated).toHaveBeenCalled();
  });
});
