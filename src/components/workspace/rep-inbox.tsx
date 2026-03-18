'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Archive, Bell, CheckCheck, Clock, Flag, RefreshCw, Reply, Tag, X } from 'lucide-react';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVEmptyState,
} from '@/components/trainovations';
import { formatDateTime } from '@/lib/format';
import type { WorkspaceInboxThreadItem } from '@/lib/query/workspace-hooks';
import type { InboxStatusFilter } from '@/lib/services/workspace-service';
import {
  archiveThreadAction,
  createTaskFromThreadAction,
  flagAwaitingReplyAction,
  flagFollowUpNeededAction,
  relinkThreadAction,
  reopenThreadAction,
  sendReplyAction,
  snoozeThreadAction,
} from '@/app/workspace/inbox/actions';

const STATUS_TABS: { label: string; value: InboxStatusFilter }[] = [
  { label: 'Open', value: 'open' },
  { label: 'Awaiting Reply', value: 'awaiting_reply' },
  { label: 'Follow-up Needed', value: 'follow_up_needed' },
  { label: 'Snoozed', value: 'snoozed' },
  { label: 'Archived', value: 'archived' },
];

function snoozePresets() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const threeDays = new Date();
  threeDays.setDate(threeDays.getDate() + 3);
  threeDays.setHours(9, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(9, 0, 0, 0);

  return [
    { label: 'Tomorrow 9am', value: tomorrow.toISOString() },
    { label: 'In 3 days', value: threeDays.toISOString() },
    { label: 'Next week', value: nextWeek.toISOString() },
  ];
}

// ─── Thread action panels ─────────────────────────────────────────────────────

function SnoozePanel({ threadId, onClose }: { threadId: string; onClose: () => void }) {
  const presets = snoozePresets();
  return (
    <div className="rounded-lg border bg-surface-muted p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Snooze until…</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <form key={preset.value} action={snoozeThreadAction}>
            <input name="threadId" type="hidden" value={threadId} />
            <input name="snoozedUntil" type="hidden" value={preset.value} />
            <TVButton size="sm" type="submit" variant="secondary">
              {preset.label}
            </TVButton>
          </form>
        ))}
        <TVButton onClick={onClose} size="sm" type="button" variant="ghost">
          <X className="h-3.5 w-3.5" />
        </TVButton>
      </div>
    </div>
  );
}

function CreateTaskPanel({ threadId, onClose }: { threadId: string; onClose: () => void }) {
  return (
    <form action={createTaskFromThreadAction} className="rounded-lg border bg-surface-muted p-3 space-y-3">
      <input name="threadId" type="hidden" value={threadId} />
      <p className="text-xs font-medium text-muted-foreground">Create task from this thread</p>
      <input
        className="tv-form-input"
        name="title"
        placeholder="Task title…"
        required
        type="text"
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="tv-form-select"
          name="priority"
          defaultValue="medium"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <input
          className="tv-form-input"
          name="dueAt"
          type="date"
        />
        <TVButton size="sm" type="submit">
          Create task
        </TVButton>
        <TVButton onClick={onClose} size="sm" type="button" variant="ghost">
          Cancel
        </TVButton>
      </div>
    </form>
  );
}

function RelinkPanel({
  threadId,
  current,
  onClose,
}: {
  threadId: string;
  current: { leadId: string | null; accountId: string | null; opportunityId: string | null };
  onClose: () => void;
}) {
  return (
    <form action={relinkThreadAction} className="rounded-lg border bg-surface-muted p-3 space-y-3">
      <input name="threadId" type="hidden" value={threadId} />
      <p className="text-xs font-medium text-muted-foreground">Relink thread ownership</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label className="text-xs text-muted-foreground">Lead ID</label>
          <input
            className="tv-form-input mt-1"
            defaultValue={current.leadId ?? ''}
            name="leadId"
            placeholder="lead_cuid…"
            type="text"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Account ID</label>
          <input
            className="tv-form-input mt-1"
            defaultValue={current.accountId ?? ''}
            name="accountId"
            placeholder="account_cuid…"
            type="text"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Opportunity ID</label>
          <input
            className="tv-form-input mt-1"
            defaultValue={current.opportunityId ?? ''}
            name="opportunityId"
            placeholder="opp_cuid…"
            type="text"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <TVButton size="sm" type="submit">
          Save links
        </TVButton>
        <TVButton onClick={onClose} size="sm" type="button" variant="ghost">
          Cancel
        </TVButton>
      </div>
    </form>
  );
}

function ReplyPanel({
  threadId,
  providerThreadId,
  replyTo,
  subject,
  canCompose,
  onClose,
}: {
  threadId: string;
  providerThreadId: string;
  replyTo: string;
  subject: string;
  canCompose: boolean;
  onClose: () => void;
}) {
  if (!canCompose) {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-foreground">
        <p className="font-medium">Gmail compose not enabled</p>
        <p className="mt-1 text-muted-foreground">
          Reconnect your Gmail account with compose access to send replies from the CRM.
        </p>
        <div className="mt-3 flex gap-2">
          <TVButton asChild size="sm" variant="secondary">
            <Link href="/api/integrations/google/connect?scopeSet=gmail_compose">
              Upgrade Gmail connection
            </Link>
          </TVButton>
          <TVButton onClick={onClose} size="sm" type="button" variant="ghost">
            Cancel
          </TVButton>
        </div>
      </div>
    );
  }

  return (
    <form action={sendReplyAction} className="rounded-lg border bg-surface-muted p-3 space-y-3">
      <input name="threadId" type="hidden" value={threadId} />
      <input name="providerThreadId" type="hidden" value={providerThreadId} />
      <input name="subject" type="hidden" value={subject} />
      <p className="text-xs font-medium text-muted-foreground">
        Reply to <span className="text-foreground">{replyTo}</span>
      </p>
      <textarea
        className="tv-form-textarea min-h-[100px] resize-y"
        name="body"
        placeholder="Write your reply…"
        required
      />
      <input name="to" type="hidden" value={replyTo} />
      <div className="flex gap-2">
        <TVButton size="sm" type="submit">
          Send reply
        </TVButton>
        <TVButton onClick={onClose} size="sm" type="button" variant="ghost">
          Cancel
        </TVButton>
      </div>
    </form>
  );
}

// ─── Thread card ──────────────────────────────────────────────────────────────

type ActivePanel = 'snooze' | 'create_task' | 'relink' | 'reply' | null;

function ThreadCard({
  thread,
  canCompose,
}: {
  thread: WorkspaceInboxThreadItem;
  canCompose: boolean;
}) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  const isArchived = thread.status === 'archived';
  const isSnoozed = thread.status === 'snoozed';
  const lastInbound = [...thread.messages].find((m) => m.direction === 'inbound');
  const replyTo = lastInbound?.fromEmail ?? thread.participants[0] ?? '';

  function toggle(panel: ActivePanel) {
    setActivePanel((current) => (current === panel ? null : panel));
  }

  return (
    <TVCard className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <TVCardTitle className="truncate">{thread.subject}</TVCardTitle>
            {thread.unreadCount > 0 && (
              <TVBadge variant="accent">{thread.unreadCount} unread</TVBadge>
            )}
            {thread.awaitingReply && (
              <TVBadge variant="primary">
                <Clock className="mr-1 h-3 w-3" />
                Awaiting reply
              </TVBadge>
            )}
            {thread.followUpNeeded && (
              <TVBadge variant="accent">
                <Flag className="mr-1 h-3 w-3" />
                Follow-up needed
              </TVBadge>
            )}
            {isSnoozed && (
              <TVBadge>
                <Bell className="mr-1 h-3 w-3" />
                Snoozed
                {thread.snoozedUntil
                  ? ` until ${new Date(thread.snoozedUntil).toLocaleDateString()}`
                  : ''}
              </TVBadge>
            )}
            {isArchived && <TVBadge>Archived</TVBadge>}
          </div>
          <TVCardDescription className="mt-1">
            {thread.snippet ?? 'No preview available.'}
          </TVCardDescription>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(new Date(thread.lastMessageAt))} · {thread.mailbox.label}
          </p>
        </div>
      </div>

      {/* Body grid */}
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          {/* CRM links */}
          <div className="rounded-lg border bg-surface-muted px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">CRM links</p>
            <div className="mt-2 space-y-1.5 text-sm">
              <p className="text-foreground">
                Lead:{' '}
                {thread.lead ? (
                  <Link
                    className="text-primary hover:underline"
                    href={`/workspace/leads/${thread.lead.id}`}
                  >
                    {thread.lead.firstName} {thread.lead.lastName}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Not linked</span>
                )}
              </p>
              <p className="text-foreground">
                Account:{' '}
                <span className={thread.account ? '' : 'text-muted-foreground'}>
                  {thread.account?.name ?? 'Not linked'}
                </span>
              </p>
              <p className="text-foreground">
                Opportunity:{' '}
                <span className={thread.opportunity ? '' : 'text-muted-foreground'}>
                  {thread.opportunity
                    ? `${thread.opportunity.name} · ${thread.opportunity.stage.replace('_', ' ')}`
                    : 'Not linked'}
                </span>
              </p>
            </div>
          </div>

          {/* Participants */}
          <div className="rounded-lg border bg-surface-muted px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Participants
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {thread.participants.length ? (
                thread.participants.map((p) => <TVBadge key={p}>{p}</TVBadge>)
              ) : (
                <p className="text-sm text-muted-foreground">None recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-3">
          {thread.messages.map((message) => (
            <div key={message.id} className="rounded-lg border bg-surface-muted px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TVBadge variant={message.direction === 'inbound' ? 'accent' : 'primary'}>
                    {message.direction}
                  </TVBadge>
                  <p className="truncate text-sm font-medium text-foreground">
                    {message.fromEmail}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(new Date(message.sentAt))}
                </p>
              </div>
              <p className="mt-2 line-clamp-5 whitespace-pre-line text-sm text-foreground">
                {message.bodyText}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action panels */}
      {activePanel === 'snooze' && (
        <SnoozePanel threadId={thread.id} onClose={() => setActivePanel(null)} />
      )}
      {activePanel === 'create_task' && (
        <CreateTaskPanel threadId={thread.id} onClose={() => setActivePanel(null)} />
      )}
      {activePanel === 'relink' && (
        <RelinkPanel
          threadId={thread.id}
          current={{
            leadId: thread.lead?.id ?? null,
            accountId: thread.account?.id ?? null,
            opportunityId: thread.opportunity?.id ?? null,
          }}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === 'reply' && (
        <ReplyPanel
          threadId={thread.id}
          providerThreadId={thread.id}
          replyTo={replyTo}
          subject={thread.subject}
          canCompose={canCompose}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 border-t pt-3">
        {/* Primary: reply */}
        <TVButton
          aria-pressed={activePanel === 'reply'}
          onClick={() => toggle('reply')}
          size="sm"
          type="button"
          variant={activePanel === 'reply' ? 'secondary' : 'primary'}
        >
          <Reply className="mr-1.5 h-3.5 w-3.5" />
          Reply
        </TVButton>

        {/* Flag: awaiting reply */}
        <form action={flagAwaitingReplyAction}>
          <input name="threadId" type="hidden" value={thread.id} />
          <input name="value" type="hidden" value={thread.awaitingReply ? 'false' : 'true'} />
          <TVButton size="sm" type="submit" variant="ghost">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            {thread.awaitingReply ? 'Unmark awaiting' : 'Awaiting reply'}
          </TVButton>
        </form>

        {/* Flag: follow-up needed */}
        <form action={flagFollowUpNeededAction}>
          <input name="threadId" type="hidden" value={thread.id} />
          <input name="value" type="hidden" value={thread.followUpNeeded ? 'false' : 'true'} />
          <TVButton size="sm" type="submit" variant="ghost">
            <Flag className="mr-1.5 h-3.5 w-3.5" />
            {thread.followUpNeeded ? 'Clear follow-up' : 'Follow-up needed'}
          </TVButton>
        </form>

        {/* Create task */}
        <TVButton
          aria-pressed={activePanel === 'create_task'}
          onClick={() => toggle('create_task')}
          size="sm"
          type="button"
          variant="ghost"
        >
          <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
          Create task
        </TVButton>

        {/* Snooze */}
        {!isArchived && (
          <TVButton
            aria-pressed={activePanel === 'snooze'}
            onClick={() => toggle('snooze')}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Bell className="mr-1.5 h-3.5 w-3.5" />
            Snooze
          </TVButton>
        )}

        {/* Relink */}
        <TVButton
          aria-pressed={activePanel === 'relink'}
          onClick={() => toggle('relink')}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Tag className="mr-1.5 h-3.5 w-3.5" />
          Relink
        </TVButton>

        {/* Archive / Reopen */}
        {isArchived || isSnoozed ? (
          <form action={reopenThreadAction}>
            <input name="threadId" type="hidden" value={thread.id} />
            <TVButton size="sm" type="submit" variant="ghost">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Reopen
            </TVButton>
          </form>
        ) : (
          <form action={archiveThreadAction}>
            <input name="threadId" type="hidden" value={thread.id} />
            <TVButton size="sm" type="submit" variant="ghost">
              <Archive className="mr-1.5 h-3.5 w-3.5" />
              Archive
            </TVButton>
          </form>
        )}

        {/* Lead link */}
        {thread.lead && (
          <TVButton asChild size="sm" variant="secondary">
            <Link href={`/workspace/leads/${thread.lead.id}`}>Open contact</Link>
          </TVButton>
        )}
      </div>
    </TVCard>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function RepInbox({
  threads,
  activeFilter,
  onFilterChange,
  canCompose = false,
}: {
  threads: WorkspaceInboxThreadItem[];
  activeFilter: InboxStatusFilter;
  onFilterChange: (filter: InboxStatusFilter) => void;
  canCompose?: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-muted text-muted-foreground hover:bg-surface-muted/80 hover:text-foreground'
            }`}
            onClick={() => onFilterChange(tab.value)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {threads.length ? (
        threads.map((thread) => (
          <ThreadCard key={thread.id} canCompose={canCompose} thread={thread} />
        ))
      ) : (
        <TVEmptyState
          title={`No ${activeFilter.replace('_', ' ')} threads`}
          description="Threads will appear here once your Gmail account is synced and threads are linked to rep context."
        />
      )}
    </div>
  );
}
