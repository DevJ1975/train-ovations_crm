import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'tv-pressable inline-flex items-center justify-center gap-2 rounded-md border text-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-primary/30 bg-[linear-gradient(180deg,hsl(var(--tv-primary)/0.94),hsl(var(--tv-primary)/0.8))] text-primary-foreground shadow-[0_14px_30px_-18px_hsl(var(--tv-primary)/0.7)] hover:border-primary/40 hover:bg-[linear-gradient(180deg,hsl(var(--tv-primary)/0.98),hsl(var(--tv-primary)/0.84))]',
        secondary:
          'border-border/80 bg-[linear-gradient(180deg,hsl(var(--tv-surface)),hsl(var(--tv-surface-muted)/0.88))] text-foreground shadow-[0_12px_24px_-20px_hsl(var(--tv-foreground)/0.24)] hover:border-primary/20 hover:bg-[linear-gradient(180deg,hsl(var(--tv-surface)),hsl(var(--tv-background)))]',
        accent:
          'border-accent/30 bg-[linear-gradient(180deg,hsl(var(--tv-accent)/0.24),hsl(var(--tv-accent)/0.14))] text-accent-foreground shadow-[0_14px_28px_-18px_hsl(var(--tv-accent)/0.35)] hover:border-accent/40 hover:bg-[linear-gradient(180deg,hsl(var(--tv-accent)/0.28),hsl(var(--tv-accent)/0.18))]',
        ghost:
          'border-transparent bg-[linear-gradient(180deg,hsl(var(--tv-surface)/0.82),hsl(var(--tv-surface-muted)/0.76))] text-foreground hover:border-border/70 hover:bg-[linear-gradient(180deg,hsl(var(--tv-surface)),hsl(var(--tv-surface-muted)/0.92))]',
        danger:
          'border-danger/30 bg-[linear-gradient(180deg,hsl(var(--tv-danger)/0.9),hsl(var(--tv-danger)/0.75))] text-white shadow-[0_14px_30px_-18px_hsl(var(--tv-danger)/0.6)] hover:border-danger/50 hover:bg-[linear-gradient(180deg,hsl(var(--tv-danger)/0.95),hsl(var(--tv-danger)/0.82))]',
      },
      size: {
        sm: 'h-9 px-4',
        md: 'h-11 px-5',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface TVButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function TVButton({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: TVButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled ?? loading}
      {...props}
    >
      {asChild ? children : (
        <>
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
}
