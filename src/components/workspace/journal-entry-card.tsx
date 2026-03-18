'use client';

import { Trash2 } from 'lucide-react';

import { TVBadge, TVButton } from '@/components/trainovations';
import { ToastForm } from '@/components/ui/toast-form';
import { formatDateTime } from '@/lib/format';
import { deleteRepJournalEntryAction } from '@/app/workspace/journal/actions';
import { JournalShareForm } from './journal-share-form';

export interface RepJournalEntryItem {
  id: string;
  title: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export function JournalEntryCard({ entry }: { entry: RepJournalEntryItem }) {
  return (
    <div className="rounded-xl border bg-surface-muted/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {entry.title ? (
            <p className="truncate text-sm font-semibold text-foreground">{entry.title}</p>
          ) : (
            <TVBadge variant="default">Untitled entry</TVBadge>
          )}
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {formatDateTime(entry.createdAt)}
          </p>
        </div>
        <ToastForm action={deleteRepJournalEntryAction} successMessage="Entry deleted">
          <input type="hidden" name="entryId" value={entry.id} />
          <TVButton size="sm" type="submit" variant="ghost">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Delete entry</span>
          </TVButton>
        </ToastForm>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{entry.body}</p>
      <JournalShareForm entryId={entry.id} />
    </div>
  );
}
