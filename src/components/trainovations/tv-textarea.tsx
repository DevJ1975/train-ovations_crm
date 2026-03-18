import * as React from 'react';

import { cn } from '@/lib/utils';

export type TVTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TVTextarea = React.forwardRef<HTMLTextAreaElement, TVTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn('tv-form-textarea', className)}
        {...props}
      />
    );
  },
);

TVTextarea.displayName = 'TVTextarea';
