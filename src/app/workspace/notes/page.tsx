import { redirect } from 'next/navigation';

import { NoteEditorForm } from '@/components/workspace/note-editor-form';
import { RepNotesWorkspace } from '@/components/workspace/rep-notes-workspace';
import {
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVSectionHeader,
} from '@/components/trainovations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getRepNotes } from '@/lib/services';
import { createRepNoteAction, deleteRepNoteAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function WorkspaceNotesPage() {
  const user = await requireAuthenticatedUser('/workspace/notes');

  if (user.role !== 'sales_rep') {
    redirect('/workspace');
  }

  const notes = await getRepNotes(user.id);

  return (
    <main className="tv-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="tv-stagger mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <Breadcrumbs crumbs={[{ label: 'Notes' }]} />
          <TVSectionHeader
            description="Capture meeting notes, account briefs, and follow-up plans. Notes can be linked to leads, accounts, and opportunities for easy retrieval."
            eyebrow="Rep Tools"
            title="Notes"
          />
        </div>

        <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
          <div>
            <TVCardTitle>New note</TVCardTitle>
            <TVCardDescription>
              Choose a template to pre-populate structure, or start blank. Type{' '}
              <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono text-[11px]">
                /
              </kbd>{' '}
              in the editor for headings, checklists, and more.
            </TVCardDescription>
          </div>
          <NoteEditorForm createNoteAction={createRepNoteAction} />
        </TVCard>

        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground">
            Saved notes
            {notes.length > 0 ? (
              <span className="ml-2 text-muted-foreground">({notes.length})</span>
            ) : null}
          </p>
          <RepNotesWorkspace deleteNoteAction={deleteRepNoteAction} notes={notes} />
        </div>
      </div>
    </main>
  );
}
