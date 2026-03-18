'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Clock, DollarSign, Search, Target } from 'lucide-react';
import { toast } from 'sonner';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVEmptyState,
} from '@/components/trainovations';
import { formatCompactCurrency, formatDate } from '@/lib/format';
import type { RepOpportunityItem } from '@/lib/services/workspace-service';

const ALL_STAGES = [
  'prospecting',
  'discovery',
  'demo',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const;

type Stage = (typeof ALL_STAGES)[number];

const stageLabel: Record<Stage, string> = {
  prospecting: 'Prospecting',
  discovery: 'Discovery',
  demo: 'Demo',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

const stageTone: Record<Stage, string> = {
  prospecting: 'border-border/60 bg-surface-muted/40',
  discovery: 'border-primary/20 bg-primary/5',
  demo: 'border-accent/20 bg-accent/5',
  proposal: 'border-accent/30 bg-accent/8',
  negotiation: 'border-warning/20 bg-warning/5',
  closed_won: 'border-success/25 bg-success/8',
  closed_lost: 'border-destructive/20 bg-destructive/5',
};

const stageBadgeTone: Record<Stage, string> = {
  prospecting: '',
  discovery: 'bg-primary/10 text-primary',
  demo: 'bg-accent/15 text-accent',
  proposal: 'bg-accent/20 text-accent',
  negotiation: 'bg-warning/15 text-warning-foreground',
  closed_won: 'bg-success/15 text-success',
  closed_lost: 'bg-destructive/10 text-destructive',
};

function StageForm({
  opportunityId,
  currentStage,
  moveStageAction,
}: {
  opportunityId: string;
  currentStage: string;
  moveStageAction: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  const otherStages = ALL_STAGES.filter((s) => s !== currentStage);

  return (
    <div className="relative">
      <TVButton
        className="gap-1.5"
        size="sm"
        type="button"
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
      >
        Move stage
        <ChevronDown className="h-3.5 w-3.5" />
      </TVButton>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-border bg-white py-1 shadow-lg">
          {otherStages.map((stage) => (
            <form
              key={stage}
              action={async (fd) => {
                setOpen(false);
                try {
                  await moveStageAction(fd);
                  toast.success('Stage updated');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to move stage');
                }
              }}
            >
              <input name="opportunityId" type="hidden" value={opportunityId} />
              <input name="stage" type="hidden" value={stage} />
              <button
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
                type="submit"
              >
                {stageLabel[stage]}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}

function NextStepForm({
  opportunityId,
  currentDescription,
  updateNextStepAction,
}: {
  opportunityId: string;
  currentDescription: string | null;
  updateNextStepAction: (formData: FormData) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        className="mt-2 w-full rounded-lg border border-dashed border-border/60 px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        type="button"
        onClick={() => setEditing(true)}
      >
        {currentDescription ? (
          <span className="line-clamp-2">{currentDescription}</span>
        ) : (
          <span>Add next step...</span>
        )}
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        try {
          await updateNextStepAction(fd);
          toast.success('Next step saved');
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to save next step');
        }
        setEditing(false);
      }}
      className="mt-2 space-y-2"
    >
      <input name="opportunityId" type="hidden" value={opportunityId} />
      <textarea
        autoFocus
        className="tv-form-textarea min-h-0"
        defaultValue={currentDescription ?? ''}
        name="description"
        placeholder="What is the next step for this deal?"
        rows={3}
      />
      <div className="flex items-center gap-2">
        <TVButton size="sm" type="submit">
          Save
        </TVButton>
        <TVButton size="sm" type="button" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </TVButton>
      </div>
    </form>
  );
}

function OpportunityCard({
  opp,
  moveStageAction,
  updateNextStepAction,
}: {
  opp: RepOpportunityItem;
  moveStageAction: (formData: FormData) => Promise<void>;
  updateNextStepAction: (formData: FormData) => Promise<void>;
}) {
  const stage = opp.stage as Stage;
  const isClosedLost = opp.stage === 'closed_lost';
  const isClosedWon = opp.stage === 'closed_won';
  const isClosed = isClosedLost || isClosedWon;
  const daysInStage = Math.floor((Date.now() - new Date(opp.updatedAt).getTime()) / 86_400_000);

  return (
    <TVCard className={`flex flex-col gap-3 border ${stageTone[stage] ?? ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link className="group" href={`/workspace/opportunities/${opp.id}`}>
            <TVCardTitle className="truncate transition-colors group-hover:text-primary">{opp.name}</TVCardTitle>
          </Link>
          <Link
            className="text-xs text-muted-foreground hover:text-primary hover:underline"
            href={`/workspace/accounts/${opp.account.id}`}
          >
            {opp.account.name}
          </Link>
        </div>
        <TVBadge className={stageBadgeTone[stage] ?? ''} variant="default">
          {stageLabel[stage] ?? opp.stage}
        </TVBadge>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {opp.amountCents != null ? (
          <span className="flex items-center gap-1 font-medium text-foreground">
            <DollarSign className="h-3.5 w-3.5 text-success" />
            {formatCompactCurrency(opp.amountCents)}
          </span>
        ) : null}
        {opp.targetCloseDate ? (
          <span className="flex items-center gap-1">
            <Target className="h-3.5 w-3.5" />
            Close {formatDate(opp.targetCloseDate)}
          </span>
        ) : null}
        {!isClosed ? (
          <span className={`flex items-center gap-1 ${daysInStage >= 30 ? 'text-destructive' : daysInStage >= 14 ? 'text-warning-foreground' : ''}`}>
            <Clock className="h-3.5 w-3.5" />
            {daysInStage}d in stage
          </span>
        ) : null}
      </div>

      {opp.primaryLead ? (
        <TVCardDescription className="text-xs">
          Primary:{' '}
          <Link
            className="font-medium text-foreground hover:text-primary hover:underline"
            href={`/workspace/leads/${opp.primaryLead.id}`}
          >
            {opp.primaryLead.firstName} {opp.primaryLead.lastName}
          </Link>{' '}
          · {opp.primaryLead.email}
        </TVCardDescription>
      ) : null}

      {!isClosed ? (
        <NextStepForm
          currentDescription={opp.description}
          opportunityId={opp.id}
          updateNextStepAction={updateNextStepAction}
        />
      ) : opp.description ? (
        <TVCardDescription className="line-clamp-2 text-xs">{opp.description}</TVCardDescription>
      ) : null}

      {!isClosed ? (
        <div className="mt-auto flex items-center justify-end border-t border-border/50 pt-2">
          <StageForm
            currentStage={opp.stage}
            moveStageAction={moveStageAction}
            opportunityId={opp.id}
          />
        </div>
      ) : null}
    </TVCard>
  );
}

export function RepOpportunitiesWorkspace({
  opportunities,
  moveStageAction,
  updateNextStepAction,
  accountFilter,
}: {
  opportunities: RepOpportunityItem[];
  moveStageAction: (formData: FormData) => Promise<void>;
  updateNextStepAction: (formData: FormData) => Promise<void>;
  accountFilter?: string | null;
}) {
  const [query, setQuery] = useState('');

  const byAccount = accountFilter
    ? opportunities.filter((o) => o.account.id === accountFilter)
    : opportunities;

  const filtered = byAccount.filter((o) => {
    const q = query.toLowerCase();
    return (
      !q ||
      o.name.toLowerCase().includes(q) ||
      o.account.name.toLowerCase().includes(q) ||
      (o.primaryLead
        ? `${o.primaryLead.firstName} ${o.primaryLead.lastName}`.toLowerCase().includes(q)
        : false)
    );
  });

  const openDeals = filtered.filter(
    (o) => o.stage !== 'closed_won' && o.stage !== 'closed_lost',
  );
  const closedDeals = filtered.filter(
    (o) => o.stage === 'closed_won' || o.stage === 'closed_lost',
  );

  const totalPipeline = openDeals.reduce((sum, o) => sum + (o.amountCents ?? 0), 0);
  const wonValue = closedDeals
    .filter((o) => o.stage === 'closed_won')
    .reduce((sum, o) => sum + (o.amountCents ?? 0), 0);

  const isEmpty = byAccount.length === 0;
  const noResults = !isEmpty && filtered.length === 0;

  if (isEmpty) {
    return (
      <TVEmptyState
        title="No opportunities yet"
        description="Opportunities assigned to your rep profile will appear here once they are created."
        icon={<Target className="h-8 w-8 text-muted-foreground" />}
      />
    );
  }

  const stageGroups = ALL_STAGES.map((stage) => ({
    stage,
    items: openDeals.filter((o) => o.stage === stage),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="tv-form-input pl-9"
          placeholder="Search deals, accounts, contacts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-surface-muted/60 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Open pipeline</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {totalPipeline > 0 ? formatCompactCurrency(totalPipeline) : '—'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {openDeals.length} deal{openDeals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="rounded-2xl border bg-success/5 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Closed won</p>
          <p className="mt-1 text-2xl font-semibold text-success">
            {wonValue > 0 ? formatCompactCurrency(wonValue) : '—'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {closedDeals.filter((o) => o.stage === 'closed_won').length} deal
            {closedDeals.filter((o) => o.stage === 'closed_won').length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="rounded-2xl border bg-surface-muted/60 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total tracked</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{filtered.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            across {new Set(filtered.map((o) => o.account.id)).size} account
            {new Set(filtered.map((o) => o.account.id)).size !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {noResults ? (
        <TVEmptyState title="No deals match your search." />
      ) : null}

      {stageGroups.map(({ stage, items }) => (
        <div key={stage} className="space-y-3">
          <div className="flex items-center gap-3">
            <TVBadge className={stageBadgeTone[stage] ?? ''} variant="default">
              {stageLabel[stage]}
            </TVBadge>
            <span className="text-xs text-muted-foreground">
              {items.length} deal{items.length !== 1 ? 's' : ''}
              {items.some((o) => o.amountCents != null)
                ? ` · ${formatCompactCurrency(items.reduce((s, o) => s + (o.amountCents ?? 0), 0))}`
                : ''}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((opp) => (
              <OpportunityCard
                key={opp.id}
                moveStageAction={moveStageAction}
                opp={opp}
                updateNextStepAction={updateNextStepAction}
              />
            ))}
          </div>
        </div>
      ))}

      {closedDeals.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-muted-foreground">Closed deals</p>
            <span className="text-xs text-muted-foreground">{closedDeals.length}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {closedDeals.map((opp) => (
              <OpportunityCard
                key={opp.id}
                moveStageAction={moveStageAction}
                opp={opp}
                updateNextStepAction={updateNextStepAction}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
