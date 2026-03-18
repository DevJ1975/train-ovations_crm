import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const TVDialog = DialogPrimitive.Root;
const TVDialogTrigger = DialogPrimitive.Trigger;
const TVDialogPortal = DialogPrimitive.Portal;
const TVDialogClose = DialogPrimitive.Close;

function TVDialogOverlay({
  className,
  ...props
}: DialogPrimitive.DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'tv-dialog-overlay fixed inset-0 z-50 bg-foreground/35 backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  );
}

function TVDialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.DialogContentProps) {
  return (
    <TVDialogPortal>
      <TVDialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'tv-dialog-content fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-surface p-6 shadow-lg',
          className,
        )}
        {...props}
      >
        {children}
        <TVDialogClose className="absolute right-4 top-4 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </TVDialogClose>
      </DialogPrimitive.Content>
    </TVDialogPortal>
  );
}

function TVDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-2', className)} {...props} />;
}

function TVDialogTitle({
  className,
  ...props
}: DialogPrimitive.DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      className={cn('text-card text-foreground', className)}
      {...props}
    />
  );
}

function TVDialogDescription({
  className,
  ...props
}: DialogPrimitive.DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      className={cn('text-body text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  TVDialog,
  TVDialogTrigger,
  TVDialogContent,
  TVDialogHeader,
  TVDialogTitle,
  TVDialogDescription,
};
