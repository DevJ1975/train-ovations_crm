import * as React from 'react';

import { cn } from '@/lib/utils';

export type TVInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const TVInput = React.forwardRef<HTMLInputElement, TVInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn('tv-form-input', className)}
        {...props}
      />
    );
  },
);

TVInput.displayName = 'TVInput';
