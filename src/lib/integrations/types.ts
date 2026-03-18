import type { ConnectedProvider } from '@prisma/client';

export type GoogleScopeSet =
  | 'basic'
  | 'gmail'
  | 'gmail_compose'
  | 'calendar'
  | 'drive'
  | 'workspace_basic';

export interface ProviderConnectionSummary {
  provider: ConnectedProvider;
  label: string;
  status: string;
  scopes: string[];
  syncEnabled: boolean;
  automationEnabled: boolean;
  lastSyncedAt?: Date | null;
}
