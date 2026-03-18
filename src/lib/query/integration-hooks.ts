'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ConnectedProvider } from '@prisma/client';

import { queryKeys } from './query-client';

export type IntegrationSummary = {
  provider: ConnectedProvider;
  label: string;
  status: string;
  scopes: string[];
  syncEnabled: boolean;
  automationEnabled: boolean;
  lastSyncedAt: string | null;
};

export type IntegrationAccount = {
  provider: ConnectedProvider;
  accountEmail: string | null;
};

export function useIntegrationSettingsQuery(userId: string) {
  return useQuery({
    queryKey: queryKeys.integrations.settings(userId),
    queryFn: async () => {
      const response = await fetch('/api/settings/integrations', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load integration settings');
      }

      return (await response.json()) as {
        accounts: IntegrationAccount[];
        summaries: IntegrationSummary[];
      };
    },
  });
}

export function useUpdateIntegrationPreferencesMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      provider: ConnectedProvider;
      syncEnabled: boolean;
      automationEnabled: boolean;
    }) => {
      const response = await fetch('/api/settings/integrations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to update integration preferences');
      }

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.settings(userId),
      });
    },
  });
}

export function useDisconnectIntegrationMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: ConnectedProvider) => {
      const response = await fetch(
        `/api/settings/integrations?provider=${provider}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to disconnect integration');
      }

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.settings(userId),
      });
    },
  });
}
