/**
 * Shared formatting utilities used across workspace and admin components.
 */

export function formatDate(value: Date | null | undefined): string {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

export function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

export function formatCurrency(amountCents: number | null): string {
  if (amountCents === null) {
    return 'Amount pending';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountCents / 100);
}

export function formatCompactCurrency(amountCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amountCents / 100);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatEnumLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

export function getPriorityTone(priority: string): {
  badgeClassName: string;
  panelClassName: string;
  label: string;
} {
  const normalized = priority.toLowerCase();

  if (normalized === 'urgent') {
    return {
      badgeClassName: 'bg-danger/15 text-danger',
      panelClassName: 'border-danger/25 bg-danger/5',
      label: 'Urgent',
    };
  }

  if (normalized === 'high') {
    return {
      badgeClassName: 'bg-accent/15 text-accent',
      panelClassName: 'border-accent/30 bg-accent/5',
      label: 'High',
    };
  }

  return {
    badgeClassName: 'bg-primary/10 text-primary',
    panelClassName: 'border-primary/20 bg-primary/5',
    label: normalized.replace('_', ' '),
  };
}

export function getPriorityVariant(priority: string): 'accent' | 'default' {
  return priority === 'urgent' || priority === 'high' ? 'accent' : 'default';
}

export function formatDateLabel(value: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(value);
}

export function formatTimeLabel(value: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

export function formatDateTimeRange(startAt: Date, endAt: Date): string {
  const startLabel = `${formatDateLabel(startAt)} at ${formatTimeLabel(startAt)}`;
  const endLabel = formatTimeLabel(endAt);

  if (startAt.getTime() === endAt.getTime()) {
    return startLabel;
  }

  return `${startLabel} to ${endLabel}`;
}
