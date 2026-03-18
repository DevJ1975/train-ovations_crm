import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LeadsTable } from './leads-table';

describe('LeadsTable', () => {
  it('renders lead rows with core CRM fields', () => {
    render(
      <LeadsTable
        leads={[
          {
            id: 'lead_1',
            firstName: 'Taylor',
            lastName: 'Brooks',
            company: 'Acme Rail',
            location: 'Dallas, Texas',
            email: 'taylor@acme.com',
            phone: '555-101-2222',
            status: 'new',
            createdAt: new Date('2026-03-13T12:00:00.000Z'),
            repProfile: {
              displayName: 'Jay Jones',
              location: 'Phoenix, Arizona',
            },
          },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: /taylor brooks/i })).toHaveAttribute(
      'href',
      '/admin/leads/lead_1',
    );
    expect(screen.getByLabelText(/lead stage progress: new/i)).toBeInTheDocument();
    expect(screen.getByText('Acme Rail')).toBeInTheDocument();
    expect(screen.getByText('Jay Jones')).toBeInTheDocument();
  });
});
