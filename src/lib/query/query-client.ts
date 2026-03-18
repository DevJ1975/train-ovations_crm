import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export const queryKeys = {
  leads: {
    all: ['leads'] as const,
    list: (filters?: Record<string, string | number | undefined>) =>
      ['leads', 'list', filters ?? {}] as const,
    detail: (leadId: string) => ['leads', 'detail', leadId] as const,
  },
  inbox: {
    all: ['inbox'] as const,
    list: (filters?: Record<string, string | number | undefined>) =>
      ['inbox', 'list', filters ?? {}] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    list: (filters?: Record<string, string | number | undefined>) =>
      ['alerts', 'list', filters ?? {}] as const,
  },
  reps: {
    all: ['reps'] as const,
    list: () => ['reps', 'list'] as const,
    detail: (repId: string) => ['reps', 'detail', repId] as const,
  },
  integrations: {
    all: ['integrations'] as const,
    settings: (userId: string) => ['integrations', 'settings', userId] as const,
  },
} as const;
