import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-surface-muted text-foreground',
        primary: 'bg-primary/10 text-primary',
        accent: 'bg-accent/15 text-accent',
        success: 'bg-success/15 text-success',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface TVBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function TVBadge({ className, variant, ...props }: TVBadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
