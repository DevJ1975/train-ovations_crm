'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from './query-client';

export type WorkspaceLeadInboxItem = {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  status: string;
  interest: string | null;
  createdAt: string;
  landingPageSlug: string | null;
  openAlertCount: number;
  latestMeetingSummary: string | null;
};

export type WorkspaceInboxThreadItem = {
  id: string;
  mailbox: {
    id: string;
    label: string;
    emailAddress: string;
    provider: string;
  };
  subject: string;
  snippet: string | null;
  unreadCount: number;
  status: string;
  awaitingReply: boolean;
  followUpNeeded: boolean;
  snoozedUntil: string | null;
  lastMessageAt: string;
  participants: string[];
  lead: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  account: {
    id: string;
    name: string;
  } | null;
  opportunity: {
    id: string;
    name: string;
    stage: string;
  } | null;
  messages: Array<{
    id: string;
    direction: string;
    fromEmail: string;
    toEmails: string[];
    bodyText: string;
    sentAt: string;
    isRead: boolean;
  }>;
};

export type WorkspaceAlertItem = {
  id: string;
  title: string;
  message: string;
  priority: string;
  status: string;
  suggestedNextStep: string | null;
  triggeredAt: string;
  resolvedAt: string | null;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
    email: string;
  };
};

export function useWorkspaceLeadsQuery(userId: string) {
  return useQuery({
    queryKey: queryKeys.leads.list({ scope: 'workspace', userId }),
    queryFn: async () => {
      const response = await fetch('/api/workspace/leads', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load workspace leads');
      }

      return (await response.json()) as {
        leads: WorkspaceLeadInboxItem[];
      };
    },
  });
}

export function useWorkspaceInboxQuery(userId: string, statusFilter = 'open') {
  return useQuery({
    queryKey: queryKeys.inbox.list({ scope: 'workspace', userId, statusFilter }),
    queryFn: async () => {
      const response = await fetch(`/api/workspace/inbox?status=${statusFilter}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load workspace inbox');
      }

      return (await response.json()) as {
        threads: WorkspaceInboxThreadItem[];
        canCompose: boolean;
      };
    },
  });
}

export function useWorkspaceAlertsQuery(userId: string) {
  return useQuery({
    queryKey: queryKeys.alerts.list({ scope: 'workspace', userId }),
    queryFn: async () => {
      const response = await fetch('/api/workspace/alerts', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load workspace alerts');
      }

      return (await response.json()) as {
        alerts: WorkspaceAlertItem[];
      };
    },
  });
}
