import * as React from 'react';

import { cn } from '@/lib/utils';

export function TVCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('tv-panel tv-interactive-card p-6', className)} {...props} />;
}

export function TVCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-card text-foreground', className)} {...props} />;
}

export function TVCardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-body text-muted-foreground', className)} {...props} />
  );
}
