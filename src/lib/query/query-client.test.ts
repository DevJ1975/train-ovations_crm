import { describe, expect, it } from 'vitest';

import { createQueryClient, queryKeys } from './query-client';

describe('query client foundation', () => {
  it('creates a query client with stable defaults', () => {
    const client = createQueryClient();

    expect(client.getDefaultOptions().queries?.staleTime).toBe(30_000);
    expect(client.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
    expect(client.getDefaultOptions().mutations?.retry).toBe(0);
  });

  it('builds stable query keys for leads', () => {
    expect(queryKeys.leads.detail('lead_1')).toEqual(['leads', 'detail', 'lead_1']);
  });
});
