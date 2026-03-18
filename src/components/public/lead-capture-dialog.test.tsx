import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LeadCaptureDialog } from './lead-capture-dialog';

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>(
    'next/navigation',
  );

  return {
    ...actual,
    useSearchParams: () => new URLSearchParams('utm_source=qr'),
  };
});

describe('LeadCaptureDialog', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders the trigger button', () => {
    render(
      <LeadCaptureDialog
        endpoint="/api/public/leads"
        landingPageId="ck1234567890123456789012"
        repSlug="jay-jones"
        repFirstName="Jay"
        triggerLabel="Request Info"
      />,
    );

    expect(screen.getByRole('button', { name: /request info/i })).toBeInTheDocument();
  });

  it('validates required fields when submitted empty', async () => {
    const user = userEvent.setup();

    render(
      <LeadCaptureDialog
        endpoint="/api/public/leads"
        landingPageId="ck1234567890123456789012"
        repSlug="jay-jones"
        repFirstName="Jay"
        triggerLabel="Request Info"
      />,
    );

    await user.click(screen.getByRole('button', { name: /request info/i }));
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
  });

  it('submits lead capture data and shows success feedback', async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'lead_1' }),
    });

    render(
      <LeadCaptureDialog
        endpoint="/api/public/leads"
        landingPageId="ck1234567890123456789012"
        repSlug="jay-jones"
        repFirstName="Jay"
        triggerLabel="Request Info"
      />,
    );

    await user.click(screen.getByRole('button', { name: /request info/i }));
    await user.type(screen.getByLabelText(/first name/i), 'Taylor');
    await user.type(screen.getByLabelText(/last name/i), 'Brooks');
    await user.type(screen.getByLabelText(/^email$/i), 'taylor@company.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/public/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.any(String),
      });
    });

    expect(
      await screen.findByText(/Jay has your details/i),
    ).toBeInTheDocument();
  });
});
