'use client';

import { useTransition, type ReactNode, type FormEvent } from 'react';
import { toast } from 'sonner';

interface ToastFormProps {
  action: (formData: FormData) => Promise<void>;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Drop-in replacement for <form action={serverAction}>.
 * Intercepts submission, calls the server action, and shows a toast on
 * success or failure. Accepts the same children as a normal form.
 */
export function ToastForm({
  action,
  successMessage = 'Saved',
  errorMessage = 'Something went wrong. Please try again.',
  onSuccess,
  children,
  className,
}: ToastFormProps) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await action(formData);
        toast.success(successMessage);
        onSuccess?.();
      } catch (err) {
        const msg = err instanceof Error ? err.message : errorMessage;
        toast.error(msg);
      }
    });
  }

  return (
    <form className={className} onSubmit={handleSubmit} aria-busy={pending}>
      {children}
    </form>
  );
}
