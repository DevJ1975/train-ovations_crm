'use client';

import React, { useState, useTransition } from 'react';
import { Copy, Trash2 } from 'lucide-react';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVInput,
} from '@/components/trainovations';
import { cn } from '@/lib/utils';

type WebhookEndpoint = {
  id: string;
  userId: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const ALL_EVENTS = [
  { value: 'lead.created', label: 'Lead Created' },
  { value: 'lead.status_changed', label: 'Lead Status Changed' },
  { value: 'opportunity.stage_changed', label: 'Opportunity Stage Changed' },
  { value: 'proposal.signed', label: 'Proposal Signed' },
];

function maskSecret(secret: string) {
  return `${secret.slice(0, 8)}••••••••••••••••`;
}

type Props = {
  webhooks: WebhookEndpoint[];
};

export function WebhookSettings({ webhooks: initialWebhooks }: Props) {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(initialWebhooks);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [newWebhookId, setNewWebhookId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [urlInput, setUrlInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  function handleCreate() {
    if (!urlInput.trim()) {
      setFormError('URL is required.');
      return;
    }
    try {
      new URL(urlInput.trim());
    } catch {
      setFormError('Please enter a valid URL (e.g. https://example.com/webhook).');
      return;
    }
    if (selectedEvents.length === 0) {
      setFormError('Select at least one event to subscribe to.');
      return;
    }
    setFormError(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/workspace/webhooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: urlInput.trim(),
            events: selectedEvents,
            description: descInput.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setFormError((data as { error?: string }).error ?? 'Failed to create webhook.');
          return;
        }

        const data = await res.json() as { webhook: WebhookEndpoint; secret: string };
        setWebhooks((prev) => [data.webhook, ...prev]);
        setNewSecret(data.secret);
        setNewWebhookId(data.webhook.id);
        // Reset form
        setUrlInput('');
        setDescInput('');
        setSelectedEvents([]);
      } catch {
        setFormError('Network error. Please try again.');
      }
    });
  }

  function handleToggleActive(id: string, isActive: boolean) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/workspace/webhooks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        });
        if (res.ok) {
          const data = await res.json() as { webhook: WebhookEndpoint };
          setWebhooks((prev) =>
            prev.map((w) => (w.id === id ? data.webhook : w)),
          );
        }
      } catch {
        // silently fail; the toggle will visually remain at the last good state
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/workspace/webhooks/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setWebhooks((prev) => prev.filter((w) => w.id !== id));
          if (newWebhookId === id) {
            setNewSecret(null);
            setNewWebhookId(null);
          }
        }
      } catch {
        // silently fail
      }
    });
  }

  async function handleCopySecret(secret: string) {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="space-y-6">
      {/* Add webhook form */}
      <TVCard className="space-y-5">
        <div>
          <TVCardTitle>Add Webhook Endpoint</TVCardTitle>
          <TVCardDescription className="mt-1">
            Register a URL to receive POST requests when CRM events fire.
          </TVCardDescription>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="webhookUrl">
              Endpoint URL
            </label>
            <TVInput
              id="webhookUrl"
              type="url"
              placeholder="https://your-server.com/webhook"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="webhookDesc">
              Description (optional)
            </label>
            <TVInput
              id="webhookDesc"
              type="text"
              placeholder="e.g. Zapier lead pipeline trigger"
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Events to subscribe</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_EVENTS.map(({ value, label }) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors',
                    selectedEvents.includes(value)
                      ? 'border-primary/30 bg-primary/5 text-foreground'
                      : 'border-border bg-surface-muted/60 text-muted-foreground hover:border-primary/20',
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={selectedEvents.includes(value)}
                    onChange={() => toggleEvent(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {formError && (
            <p className="text-sm text-danger">{formError}</p>
          )}

          <TVButton
            disabled={isPending}
            onClick={handleCreate}
          >
            {isPending ? 'Creating…' : 'Create Webhook'}
          </TVButton>
        </div>
      </TVCard>

      {/* New secret reveal banner */}
      {newSecret && newWebhookId && (
        <div className="rounded-2xl border border-success/30 bg-success/5 p-5 space-y-3">
          <p className="text-sm font-semibold text-foreground">
            Webhook created — save your secret now
          </p>
          <p className="text-xs text-muted-foreground">
            This is the only time the full signing secret is shown. Copy it and store it securely.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 rounded-xl border bg-surface px-4 py-3 font-mono text-xs text-foreground break-all">
              {newSecret}
            </code>
            <TVButton
              className="w-full sm:w-auto whitespace-nowrap"
              size="sm"
              variant="secondary"
              onClick={() => handleCopySecret(newSecret)}
            >
              <Copy className="mr-2 h-4 w-4" />
              {copied ? 'Copied!' : 'Copy Secret'}
            </TVButton>
          </div>
          <TVButton
            size="sm"
            variant="ghost"
            onClick={() => { setNewSecret(null); setNewWebhookId(null); }}
          >
            Dismiss
          </TVButton>
        </div>
      )}

      {/* Existing webhooks */}
      <TVCard className="space-y-5">
        <div>
          <TVCardTitle>Registered Endpoints</TVCardTitle>
          <TVCardDescription className="mt-1">
            {webhooks.length} endpoint{webhooks.length !== 1 ? 's' : ''} configured.
          </TVCardDescription>
        </div>

        {webhooks.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed bg-surface-muted/60 px-4 py-6 text-sm text-muted-foreground">
            No webhook endpoints registered yet. Use the form above to create one.
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="rounded-2xl border bg-surface-muted/60 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {webhook.url}
                    </p>
                    {webhook.description && (
                      <p className="text-xs text-muted-foreground">{webhook.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Active toggle */}
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                      <span>{webhook.isActive ? 'Active' : 'Inactive'}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={webhook.isActive}
                        disabled={isPending}
                        className={cn(
                          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none',
                          webhook.isActive ? 'bg-success' : 'bg-muted',
                        )}
                        onClick={() => handleToggleActive(webhook.id, !webhook.isActive)}
                      >
                        <span
                          className={cn(
                            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                            webhook.isActive ? 'translate-x-4' : 'translate-x-0',
                          )}
                        />
                      </button>
                    </label>

                    <TVButton
                      size="sm"
                      variant="ghost"
                      className="text-danger hover:bg-danger/10 hover:text-danger"
                      disabled={isPending}
                      onClick={() => handleDelete(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </TVButton>
                  </div>
                </div>

                {/* Events */}
                <div className="flex flex-wrap gap-2">
                  {webhook.events.map((event) => (
                    <TVBadge key={event} className="bg-primary/10 text-primary font-mono text-[11px]" variant="default">
                      {event}
                    </TVBadge>
                  ))}
                </div>

                {/* Masked secret */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Signing secret:</span>
                  <code className="rounded-lg border bg-surface px-3 py-1 font-mono text-xs text-foreground">
                    {maskSecret(webhook.secret)}
                  </code>
                </div>
              </div>
            ))}
          </div>
        )}
      </TVCard>
    </div>
  );
}
