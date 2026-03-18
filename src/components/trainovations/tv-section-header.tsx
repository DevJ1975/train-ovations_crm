import * as React from 'react';

import { cn } from '@/lib/utils';

interface TVSectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}

export function TVSectionHeader({
  eyebrow,
  title,
  description,
  className,
}: TVSectionHeaderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {eyebrow ? (
        <p className="text-label uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      ) : null}
      <div className="space-y-2">
        <h2 className="text-section text-foreground">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-body text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
