import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div style={{ height: 240, width: 480 }}>{children}</div>
    ),
  };
});

import { RepManagementList } from './rep-management-list';

describe('RepManagementList', () => {
  it('renders the rep performance infographic block', () => {
    render(
      <RepManagementList
        inviteAction={async () => {}}
        offboardAction={async () => {}}
        repPerformance={[
          {
            repId: 'rep_1',
            repName: 'Jay Jones',
            lastLoginAt: new Date('2026-03-14T09:00:00.000Z'),
            inviteStatus: 'accepted',
            leadsOwned: 7,
            newLeadsLast30Days: 3,
            qualifiedLeads: 4,
            accountsOwned: 2,
            openOpportunities: 2,
            pipelineValueCents: 5000000,
            weightedForecastValueCents: 3250000,
            closedWonValueCents: 2100000,
            averageDealSizeCents: 2500000,
            winRatePercent: 50,
          },
        ]}
        reps={[
          {
            id: 'rep_1',
            userId: 'user_1',
            slug: 'jay-jones',
            firstName: 'Jay',
            lastName: 'Jones',
            displayName: 'Jay Jones',
            title: 'Safety Technology Specialist',
            email: 'jay@example.com',
            phone: '555-111-2222',
            website: 'https://example.com',
            location: 'Phoenix, Arizona',
            bio: 'Bio',
            isActive: true,
            inviteStatus: 'accepted',
            invitationSentAt: new Date('2026-03-10T09:00:00.000Z'),
            invitationAcceptedAt: new Date('2026-03-11T09:00:00.000Z'),
            lastLoginAt: new Date('2026-03-14T09:00:00.000Z'),
            ownedLeadCount: 7,
            ownedAccountCount: 2,
            ownedOpportunityCount: 2,
            landingPages: [{ slug: 'jay-jones', title: 'Jay Jones' }],
          },
        ]}
        resendInviteAction={async () => {}}
        updateAction={async () => {}}
      />,
    );

    expect(screen.getByText(/performance snapshot/i)).toBeInTheDocument();
    expect(screen.getAllByText('Jay Jones').length).toBeGreaterThan(0);
    expect(screen.getByText(/win rate/i)).toBeInTheDocument();
  });
});
