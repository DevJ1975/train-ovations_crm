'use client';

import { useActionState } from 'react';
import { Mail } from 'lucide-react';

import { TVButton, TVInput } from '@/components/trainovations';
import { shareRepJournalEntryAction } from '@/app/workspace/journal/actions';

const initialState = { error: undefined, sent: undefined };

export function JournalShareForm({ entryId }: { entryId: string }) {
  const [state, dispatch, pending] = useActionState(shareRepJournalEntryAction, initialState);

  if (state.sent) {
    return (
      <p className="text-xs text-emerald-600 font-medium">
        Sent successfully.
      </p>
    );
  }

  return (
    <form action={dispatch} className="flex items-center gap-2 pt-3 border-t">
      <input type="hidden" name="entryId" value={entryId} />
      <TVInput
        className="h-8 text-xs"
        name="toEmail"
        placeholder="Share to email address"
        type="email"
        required
      />
      <TVButton
        className="h-8 shrink-0 gap-1.5 px-3 text-xs"
        disabled={pending}
        type="submit"
        variant="secondary"
      >
        <Mail className="h-3.5 w-3.5" />
        {pending ? 'Sending…' : 'Send'}
      </TVButton>
      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
    </form>
  );
}
