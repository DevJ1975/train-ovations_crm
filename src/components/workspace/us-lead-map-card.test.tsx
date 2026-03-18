import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UsLeadMapCard } from './us-lead-map-card';

describe('UsLeadMapCard', () => {
  it('renders clickable lead markers and summary chips', () => {
    render(
      <UsLeadMapCard
        leads={[
          {
            id: 'lead_1',
            firstName: 'Alex',
            lastName: 'Stone',
            company: 'Metro Transit Systems',
            location: 'Dallas, Texas',
            x: 52,
            y: 58,
          },
          {
            id: 'lead_2',
            firstName: 'Jamie',
            lastName: 'Cole',
            company: 'Northstar Rail',
            location: 'Phoenix, Arizona',
            x: 27,
            y: 72,
          },
        ]}
      />,
    );

    expect(screen.getByText(/lead coverage map/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /open alex stone from dallas, texas/i }),
    ).toHaveAttribute('href', '/workspace/leads/lead_1');
    expect(screen.getByRole('link', { name: /jamie cole • phoenix, arizona/i })).toHaveAttribute(
      'href',
      '/workspace/leads/lead_2',
    );
  });
});
