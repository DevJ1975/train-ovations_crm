import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QueryProvider } from '@/components/providers/query-provider';

import { WorkspaceLeadsClient } from './workspace-leads-client';

describe('WorkspaceLeadsClient', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              leads: [
                {
                  id: 'lead_1',
                  firstName: 'Jordan',
                  lastName: 'Lee',
                  company: 'Apex Industrial',
                  email: 'jordan@apex.com',
                  phone: '555-101-1111',
                  location: 'Dallas, Texas',
                  status: 'new',
                  interest: 'Pilot rollout',
                  createdAt: '2026-03-13T12:00:00.000Z',
                  landingPageSlug: 'jay-jones',
                  openAlertCount: 2,
                  latestMeetingSummary: 'Discussed next steps.',
                },
              ],
            }),
          ),
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the rep inbox through React Query', async () => {
    render(
      <QueryProvider>
        <WorkspaceLeadsClient repLocation="Phoenix, Arizona" userId="user_1" />
      </QueryProvider>,
    );

    expect(await screen.findByText('Jordan Lee')).toBeInTheDocument();
    expect(screen.getByText(/discussed next steps/i)).toBeInTheDocument();
  });
});
