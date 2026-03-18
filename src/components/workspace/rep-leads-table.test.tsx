import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RepLeadsTable } from './rep-leads-table';

describe('RepLeadsTable', () => {
  it('renders rep lead actions and context', () => {
    render(
      <RepLeadsTable
        leads={[
          {
            id: 'lead_1',
            firstName: 'Alex',
            lastName: 'Stone',
            company: 'Metro Transit Systems',
            email: 'alex.stone@metrotransit.com',
            phone: '555-101-2201',
            location: 'Dallas, Texas',
            status: 'new',
            interest: 'Pilot rollout',
            createdAt: new Date('2026-03-13T00:00:00.000Z'),
            landingPageSlug: 'jay-jones',
            openAlertCount: 2,
            latestMeetingSummary: 'Aligned on pilot next steps.',
          },
        ]}
        repLocation="Phoenix, Arizona"
      />,
    );

    expect(screen.getByText(/lead inbox/i)).toBeInTheDocument();
    expect(screen.getByText(/aligned on pilot next steps/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lead stage progress: new/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lead time comparison/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open lead/i })).toHaveAttribute(
      'href',
      '/workspace/leads/lead_1',
    );
    expect(screen.getByRole('link', { name: /email lead/i })).toHaveAttribute(
      'href',
      'mailto:alex.stone@metrotransit.com',
    );
    expect(screen.getByRole('link', { name: /view public page/i })).toHaveAttribute(
      'href',
      '/rep/jay-jones',
    );
  });
});
