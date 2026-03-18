import * as React from 'react';

import { cn } from '@/lib/utils';

export type TVCheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

export const TVCheckbox = React.forwardRef<HTMLInputElement, TVCheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded border border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className,
        )}
        {...props}
      />
    );
  },
);

TVCheckbox.displayName = 'TVCheckbox';
