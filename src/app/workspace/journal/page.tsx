import { redirect } from 'next/navigation';
import { BookOpen } from 'lucide-react';

import {
  TVCard,
  TVCardTitle,
  TVCardDescription,
  TVEmptyState,
  TVSectionHeader,
} from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { JournalEditorForm } from '@/components/workspace/journal-editor-form';
import { JournalEntryCard } from '@/components/workspace/journal-entry-card';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getRepJournalEntries } from '@/lib/services';

import { createRepJournalEntryAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function WorkspaceJournalPage() {
  const user = await requireAuthenticatedUser('/workspace/journal');

  if (user.role !== 'sales_rep') {
    redirect('/workspace');
  }

  const entries = await getRepJournalEntries(user.id);

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs crumbs={[{ label: 'Journal' }]} />
          <TVSectionHeader
            eyebrow="Rep Tools"
            title="Journal"
            description="Capture private field notes, reflections, and reminders. Your entries are visible only to you."
          />
        </div>

        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div>
            <TVCardTitle>New entry</TVCardTitle>
            <TVCardDescription>
              Add a quick note, field observation, or personal reminder. Type{' '}
              <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono text-[11px]">
                /
              </kbd>{' '}
              in the editor for headings, checklists, and more.
            </TVCardDescription>
          </div>
          <JournalEditorForm createEntryAction={createRepJournalEntryAction} />
        </TVCard>

        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground">Past entries</p>

          {entries.length ? (
            <div className="space-y-3">
              {entries.map((entry) => (
                <JournalEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            <TVEmptyState
              icon={<BookOpen className="h-6 w-6" />}
              title="No journal entries yet"
              description="Your saved entries will appear here. Use the form above to add your first one."
            />
          )}
        </div>
      </div>
    </main>
  );
}
