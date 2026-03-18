import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div style={{ height: 320, width: 640 }}>{children}</div>
    ),
  };
});

import { DashboardOverview } from './dashboard-overview';

describe('DashboardOverview', () => {
  it('renders dashboard metric cards and grouped summaries', () => {
    render(
      <DashboardOverview
        metrics={{
          totalLeads: 12,
          recentLeads: 4,
          totalAccounts: 2,
          openOpportunities: 2,
          activeReps: 2,
          recentlyActiveReps: 1,
          pendingInvites: 1,
          pipelineValueCents: 12500000,
          weightedForecastValueCents: 7300000,
          closedWonValueCents: 6400000,
          averageOpenDealSizeCents: 6250000,
          winRatePercent: 50,
          averageSalesCycleDays: 42,
          overdueOpenOpportunities: 1,
          leadsByRep: [
            { repId: 'rep_1', repName: 'Jay Jones', count: 7 },
            { repId: 'rep_2', repName: 'Casey Rivera', count: 5 },
          ],
          leadsByStatus: [
            { status: 'new', count: 8 },
            { status: 'contacted', count: 4 },
          ],
          forecastByStage: [
            {
              stage: 'proposal',
              opportunityCount: 1,
              amountCents: 5000000,
              weightedAmountCents: 3250000,
            },
          ],
          repPerformance: [
            {
              repId: 'rep_1',
              repName: 'Jay Jones',
              lastLoginAt: new Date('2026-03-14T09:00:00.000Z'),
              inviteStatus: 'accepted',
              leadsOwned: 7,
              newLeadsLast30Days: 3,
              qualifiedLeads: 4,
              accountsOwned: 2,
              openOpportunities: 1,
              pipelineValueCents: 5000000,
              weightedForecastValueCents: 3250000,
              closedWonValueCents: 2500000,
              averageDealSizeCents: 5000000,
              winRatePercent: 50,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(/global sales dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/sales visuals and infographics/i)).toBeInTheDocument();
    expect(screen.getByText(/forecast by stage/i)).toBeInTheDocument();
    expect(screen.getAllByText(/weighted forecast/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/rep performance dashboards/i)).toBeInTheDocument();
    expect(screen.getByText('Total Leads')).toBeInTheDocument();
    expect(screen.getByText('Total Accounts')).toBeInTheDocument();
    expect(screen.getByText('Open Opportunities')).toBeInTheDocument();
    expect(screen.getAllByText('Jay Jones').length).toBeGreaterThan(0);
    expect(screen.getByText('contacted')).toBeInTheDocument();
    expect(screen.getByText(/proposal/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /review new leads/i })).toHaveAttribute(
      'href',
      '/admin/leads?status=new',
    );
    expect(screen.getByRole('link', { name: /manage reps/i })).toHaveAttribute(
      'href',
      '/admin/reps',
    );
  });
});
