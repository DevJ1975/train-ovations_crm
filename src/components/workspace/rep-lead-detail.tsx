'use client';

import type React from 'react';
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';
import type { LeadStatus } from '@prisma/client';
import {
  Bell,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Tag,
  UserCheck,
  UserPlus,
  Zap,
} from 'lucide-react';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVTextarea,
} from '@/components/trainovations';
import { LeadStageProgress } from '@/components/crm/lead-stage-progress';
import { LeadTimeContext } from '@/components/crm/lead-time-context';
import { ManualLeadDialog } from '@/components/workspace/manual-lead-dialog';
import type { RepLeadDetail } from '@/lib/services/workspace-service';
import { formatDate, formatCurrency, formatEnumLabel } from '@/lib/format';

function getActivityIcon(type: string): { node: React.ReactNode; color: string } {
  if (type.includes('note')) return { node: <MessageSquare size={11} />, color: 'text-blue-500' };
  if (type.includes('status')) return { node: <Tag size={11} />, color: 'text-purple-500' };
  if (type.includes('created')) return { node: <UserPlus size={11} />, color: 'text-green-500' };
  if (type.includes('meeting')) return { node: <Phone size={11} />, color: 'text-orange-500' };
  if (type.includes('email') || type.includes('draft')) return { node: <Mail size={11} />, color: 'text-sky-500' };
  if (type.includes('profile')) return { node: <UserCheck size={11} />, color: 'text-teal-500' };
  if (type.includes('alert') || type.includes('flag')) return { node: <Bell size={11} />, color: 'text-red-500' };
  if (type.includes('document') || type.includes('note')) return { node: <FileText size={11} />, color: 'text-slate-500' };
  return { node: <Zap size={11} />, color: 'text-muted-foreground' };
}

const leadStatuses: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'won',
  'lost',
];

export function RepLeadDetail({
  lead,
  activity,
  actions,
}: {
  lead: RepLeadDetail;
  activity: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: Date;
    actorUser: { name: string | null; email: string | null } | null;
  }>;
  actions: {
    updateLeadStatusAction: (formData: FormData) => Promise<void>;
    addLeadNoteAction: (formData: FormData) => Promise<void>;
    deleteLeadAction: (formData: FormData) => Promise<void>;
  };
}) {
  const [isPendingStatus, startStatusTransition] = useTransition();
  const [isPendingNote, startNoteTransition] = useTransition();
  const [isPendingDelete, startDeleteTransition] = useTransition();

  const leadName = `${lead.firstName} ${lead.lastName}`;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <TVCard className="space-y-6 rounded-[2rem] border-white/60 bg-white/90">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <TVCardTitle className="truncate">{leadName}</TVCardTitle>
              <TVCardDescription className="mt-2 truncate">
                {lead.company ?? 'Company pending'}
                {lead.jobTitle ? ` • ${lead.jobTitle}` : ''}
              </TVCardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <TVBadge variant="accent">{formatEnumLabel(lead.status)}</TVBadge>
              <TVBadge>{formatEnumLabel(lead.sourceType)}</TVBadge>
              <ManualLeadDialog
                lead={{
                  id: lead.id,
                  firstName: lead.firstName,
                  lastName: lead.lastName,
                  company: lead.company,
                  jobTitle: lead.jobTitle,
                  email: lead.email,
                  phone: lead.phone,
                  location: lead.location,
                  industry: lead.industry,
                  interest: lead.interest,
                  notes: lead.notes,
                  consent: lead.consent,
                  status: lead.status as LeadStatus,
                  duplicateOfLeadId: lead.duplicateOfLead?.id ?? null,
                }}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border bg-surface-muted/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Email</p>
              <p className="mt-2 text-sm text-foreground">{lead.email}</p>
            </div>
            <div className="rounded-2xl border bg-surface-muted/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Phone</p>
              <p className="mt-2 text-sm text-foreground">{lead.phone ?? 'Phone pending'}</p>
            </div>
            <div className="rounded-2xl border bg-surface-muted/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Submitted</p>
              <p className="mt-2 text-sm text-foreground">{formatDate(lead.submittedAt)}</p>
            </div>
            <div className="rounded-2xl border bg-surface-muted/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Interest</p>
              <p className="mt-2 text-sm text-foreground">{lead.interest ?? 'Interest pending'}</p>
            </div>
            <div className="rounded-2xl border bg-surface-muted/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Location</p>
              <p className="mt-2 text-sm text-foreground">{lead.location ?? 'Location pending'}</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-surface-muted/60 p-4">
            <LeadStageProgress status={lead.status as LeadStatus} />
          </div>

          <div className="rounded-2xl border bg-surface-muted/60 p-4">
            <LeadTimeContext leadLocation={lead.location} repLocation={lead.repLocation} />
          </div>

          {lead.notes ? (
            <div className="rounded-2xl border bg-surface-muted/60 p-4">
              <p className="text-sm font-medium text-foreground">Capture notes</p>
              <p className="mt-2 text-sm text-muted-foreground">{lead.notes}</p>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <TVCard className="space-y-4 border bg-surface-muted/40 shadow-none">
              <TVCardTitle>Status update</TVCardTitle>
              <TVCardDescription>Move the lead forward without leaving the workspace.</TVCardDescription>
              <form
                action={(fd) => {
                  startStatusTransition(async () => {
                    try {
                      await actions.updateLeadStatusAction(fd);
                      toast.success('Status updated');
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Failed to update status');
                    }
                  });
                }}
                className="space-y-3"
              >
                <input name="leadId" type="hidden" value={lead.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  {leadStatuses.map((status) => (
                    <TVButton
                      key={status}
                      disabled={isPendingStatus}
                      name="status"
                      size="sm"
                      type="submit"
                      value={status}
                      variant={lead.status === status ? 'primary' : 'secondary'}
                    >
                      {formatEnumLabel(status)}
                    </TVButton>
                  ))}
                </div>
              </form>
            </TVCard>

            <TVCard className="space-y-4 border bg-surface-muted/40 shadow-none">
              <TVCardTitle>Add note</TVCardTitle>
              <TVCardDescription>Capture what happened and keep the next rep touch grounded.</TVCardDescription>
              <form
                action={(fd) => {
                  startNoteTransition(async () => {
                    try {
                      await actions.addLeadNoteAction(fd);
                      toast.success('Note saved');
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Failed to save note');
                    }
                  });
                }}
                className="space-y-3"
              >
                <input name="leadId" type="hidden" value={lead.id} />
                <TVTextarea name="content" placeholder="Add a follow-up note, call summary, or next-step detail." />
                <TVButton disabled={isPendingNote} type="submit">
                  {isPendingNote ? 'Saving…' : 'Save note'}
                </TVButton>
              </form>
            </TVCard>
          </div>
        </TVCard>

        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div className="flex items-center justify-between gap-3">
            <div>
              <TVCardTitle>Linked accounts and pipeline</TVCardTitle>
              <TVCardDescription>Company context connected to this lead.</TVCardDescription>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Accounts</p>
              {lead.accounts.length ? (
                lead.accounts.map((account) => (
                  <Link
                    key={account.id}
                    className="block rounded-2xl border bg-surface-muted/60 p-4 transition-colors hover:border-primary/20 hover:bg-white"
                    href={`/workspace/accounts/${account.id}`}
                  >
                    <p className="text-sm font-medium text-foreground">{account.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {account.relationshipLabel ?? 'Relationship pending'}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No linked accounts yet.</p>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Opportunities</p>
              {lead.opportunities.length ? (
                lead.opportunities.map((opportunity) => (
                  <Link
                    key={opportunity.id}
                    className="block rounded-2xl border bg-surface-muted/60 p-4 transition-colors hover:border-primary/20 hover:bg-white"
                    href={`/workspace/opportunities/${opportunity.id}`}
                  >
                    <p className="text-sm font-medium text-foreground">{opportunity.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatEnumLabel(opportunity.stage)} · {formatCurrency(opportunity.amountCents)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No opportunities linked yet.</p>
              )}
            </div>
          </div>
        </TVCard>

        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div>
            <TVCardTitle>Recent notes</TVCardTitle>
            <TVCardDescription>Rep-authored and system-generated notes for this contact.</TVCardDescription>
          </div>

          {lead.notesList.length ? (
            <div className="space-y-3">
              {lead.notesList.map((note) => (
                <div key={note.id} className="rounded-2xl border bg-surface-muted/60 p-4">
                  <p className="text-sm text-foreground">{note.content}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {note.author?.name ?? note.author?.email ?? 'System'} • {formatDate(note.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No notes added yet.</p>
          )}
        </TVCard>
      </div>

      <div className="space-y-6">
        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div>
            <TVCardTitle>Alert context</TVCardTitle>
            <TVCardDescription>Open and recent alerts tied to this lead.</TVCardDescription>
          </div>

          {lead.alerts.length ? (
            <div className="space-y-3">
              {lead.alerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border bg-surface-muted/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <TVBadge variant={alert.status === 'open' ? 'accent' : 'default'}>
                      {formatEnumLabel(alert.status)}
                    </TVBadge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{alert.message}</p>
                  {alert.suggestedNextStep ? (
                    <p className="mt-3 text-sm text-foreground">
                      Suggested next step: {alert.suggestedNextStep}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No alert context tied to this lead.</p>
          )}
        </TVCard>

        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div>
            <TVCardTitle>Meeting context</TVCardTitle>
            <TVCardDescription>Recent processed conversations and next steps.</TVCardDescription>
          </div>

          {lead.meetings.length ? (
            <div className="space-y-3">
              {lead.meetings.map((meeting) => (
                <div key={meeting.id} className="rounded-2xl border bg-surface-muted/60 p-4">
                  <p className="text-sm font-medium text-foreground">{meeting.topic}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {formatDate(meeting.startAt)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {meeting.recommendedNextStep ?? meeting.summary ?? 'No meeting summary yet.'}
                  </p>
                  {meeting.draft ? (
                    <div className="mt-3 rounded-xl border bg-white/70 p-3">
                      <p className="text-sm font-medium text-foreground">{meeting.draft.subject}</p>
                      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                        {meeting.draft.bodyText}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No processed meetings for this lead yet.</p>
          )}
        </TVCard>

        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div>
            <TVCardTitle>Suggested tasks</TVCardTitle>
            <TVCardDescription>Generated follow-up work tied to this lead.</TVCardDescription>
          </div>

          {lead.repTaskSuggestions.length ? (
            <div className="space-y-3">
              {lead.repTaskSuggestions.map((task) => (
                <div key={task.id} className="rounded-2xl border bg-surface-muted/60 p-4">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium text-foreground">{task.title}</p>
                    <TVBadge variant="accent">{formatEnumLabel(task.priority)}</TVBadge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{task.reason}</p>
                  {task.recommendedDueAt ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Due {formatDate(task.recommendedDueAt)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active tasks are tied to this lead.</p>
          )}
        </TVCard>

        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div>
            <TVCardTitle>Activity timeline</TVCardTitle>
            <TVCardDescription>Every CRM event for this lead, newest first.</TVCardDescription>
          </div>

          {activity.length ? (
            <ol className="relative border-l border-border/50 pl-6 space-y-0">
              {activity.map((entry, i) => {
                const icon = getActivityIcon(entry.type);
                const isLast = i === activity.length - 1;
                return (
                  <li key={entry.id} className={isLast ? 'pb-0' : 'pb-5'}>
                    <span className="absolute -left-[11px] flex h-[22px] w-[22px] items-center justify-center rounded-full border border-border/60 bg-white shadow-sm">
                      <span className={`${icon.color}`}>{icon.node}</span>
                    </span>
                    <p className="text-sm font-medium text-foreground leading-snug">{entry.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatEnumLabel(entry.type)}
                      {entry.actorUser ? ` · ${entry.actorUser.name ?? entry.actorUser.email}` : ''}
                      {' · '}{formatDate(entry.createdAt)}
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">No activity logged yet.</p>
          )}
        </TVCard>

        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div>
            <TVCardTitle>Quick links</TVCardTitle>
            <TVCardDescription>Jump to the most common follow-up paths.</TVCardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <TVButton asChild size="sm">
              <Link href={`mailto:${lead.email}`}>Email contact</Link>
            </TVButton>
            <TVButton asChild size="sm" variant="secondary">
              <Link href="/workspace/alerts">Open alert queue</Link>
            </TVButton>
            <TVButton asChild size="sm" variant="secondary">
              <Link href="/workspace/tasks">Open task center</Link>
            </TVButton>
            {lead.landingPage ? (
              <TVButton asChild size="sm" variant="secondary">
                <Link href={`/rep/${lead.landingPage.slug}`}>View public page</Link>
              </TVButton>
            ) : null}
            <form
              action={(fd) => {
                startDeleteTransition(async () => {
                  try {
                    await actions.deleteLeadAction(fd);
                    toast.success('Lead deleted');
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Failed to delete lead');
                  }
                });
              }}
            >
              <input name="leadId" type="hidden" value={lead.id} />
              <TVButton disabled={isPendingDelete} size="sm" type="submit" variant="ghost">
                {isPendingDelete ? 'Deleting…' : 'Delete lead'}
              </TVButton>
            </form>
          </div>
        </TVCard>
      </div>
    </div>
  );
}
