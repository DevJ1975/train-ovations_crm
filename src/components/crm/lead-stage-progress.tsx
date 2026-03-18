import type { LeadStatus } from '@prisma/client';

import { cn } from '@/lib/utils';

const leadStages: Array<{
  value: LeadStatus;
  label: string;
  shortLabel: string;
}> = [
  { value: 'new', label: 'New', shortLabel: 'New' },
  { value: 'contacted', label: 'Contacted', shortLabel: 'Contact' },
  { value: 'qualified', label: 'Qualified', shortLabel: 'Qualify' },
  { value: 'proposal', label: 'Proposal', shortLabel: 'Proposal' },
  { value: 'won', label: 'Won', shortLabel: 'Won' },
  { value: 'lost', label: 'Lost', shortLabel: 'Lost' },
];

function getStageIndex(status: LeadStatus) {
  return leadStages.findIndex((stage) => stage.value === status);
}

function getCompletedStageValues(status: LeadStatus) {
  if (status === 'lost') {
    return ['new', 'contacted', 'qualified', 'proposal', 'lost'] as LeadStatus[];
  }

  return leadStages
    .slice(0, Math.max(getStageIndex(status), 0) + 1)
    .map((stage) => stage.value)
    .filter((value) => value !== 'lost');
}

export function LeadStageProgress({
  status,
  compact = false,
}: {
  status: LeadStatus;
  compact?: boolean;
}) {
  const completedStages = getCompletedStageValues(status);

  return (
    <div
      aria-label={`Lead stage progress: ${status.replace('_', ' ')}`}
      className={cn('space-y-3', compact ? 'min-w-[12rem]' : 'space-y-4')}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={cn('font-medium text-foreground', compact ? 'text-xs uppercase tracking-[0.18em]' : 'text-sm')}>
          Sales stage
        </p>
        <p className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
          {status.replace('_', ' ')}
        </p>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {leadStages.map((stage, index) => {
          const isCurrent = stage.value === status;
          const isComplete = completedStages.includes(stage.value);
          const isWon = stage.value === 'won';
          const isLost = stage.value === 'lost';

          return (
            <div key={stage.value} className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-2.5 flex-1 rounded-full transition-colors',
                    isCurrent && isWon && 'bg-success',
                    isCurrent && isLost && 'bg-danger',
                    !isCurrent && isComplete && 'bg-primary',
                    !isComplete && 'bg-border',
                    isCurrent && !isWon && !isLost && 'bg-primary',
                  )}
                />
                {index < leadStages.length - 1 ? (
                  <div
                    className={cn(
                      'hidden h-px flex-1 rounded-full sm:block',
                      isComplete && stage.value !== 'lost' ? 'bg-primary/40' : 'bg-border',
                    )}
                  />
                ) : null}
              </div>
              <p
                className={cn(
                  'leading-tight',
                  compact ? 'text-[11px]' : 'text-xs',
                  isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground',
                )}
              >
                {compact ? stage.shortLabel : stage.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
