'use client';

import { useState } from 'react';
import { FileText, Search, Trash2 } from 'lucide-react';
import type { NoteTemplateType } from '@prisma/client';

import { TVBadge, TVButton, TVEmptyState } from '@/components/trainovations';
import { ToastForm } from '@/components/ui/toast-form';
import { formatDateTime } from '@/lib/format';
import type { RepNoteItem } from '@/lib/services/note-service';

const templateLabel: Record<NoteTemplateType, string> = {
  blank: 'Note',
  meeting_notes: 'Meeting notes',
  account_brief: 'Account brief',
  follow_up_plan: 'Follow-up plan',
};

const templateTone: Record<NoteTemplateType, string> = {
  blank: '',
  meeting_notes: 'bg-primary/10 text-primary',
  account_brief: 'bg-accent/15 text-accent',
  follow_up_plan: 'bg-success/10 text-success',
};

const ALL_TEMPLATES = ['all', 'blank', 'meeting_notes', 'account_brief', 'follow_up_plan'] as const;
const TEMPLATE_FILTER_LABELS: Record<string, string> = {
  all: 'All',
  blank: 'Notes',
  meeting_notes: 'Meeting notes',
  account_brief: 'Account briefs',
  follow_up_plan: 'Follow-up plans',
};

export function RepNotesWorkspace({
  notes,
  deleteNoteAction,
}: {
  notes: RepNoteItem[];
  deleteNoteAction: (formData: FormData) => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [templateFilter, setTemplateFilter] = useState<string>('all');

  const filtered = notes.filter((n) => {
    const matchesTemplate = templateFilter === 'all' || n.templateType === templateFilter;
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      (n.title ?? '').toLowerCase().includes(q) ||
      n.body.toLowerCase().includes(q) ||
      (n.lead ? `${n.lead.firstName} ${n.lead.lastName}`.toLowerCase().includes(q) : false) ||
      (n.account ? n.account.name.toLowerCase().includes(q) : false);
    return matchesTemplate && matchesQuery;
  });

  if (notes.length === 0) {
    return (
      <TVEmptyState
        description="Notes you save will appear here. Use the form above to create your first note."
        icon={<FileText className="h-6 w-6" />}
        title="No notes yet"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="tv-form-input pl-9"
            placeholder="Search notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TEMPLATES.map((t) => (
            <button
              key={t}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                templateFilter === t
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/60 bg-surface-muted/40 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
              type="button"
              onClick={() => setTemplateFilter(t)}
            >
              {TEMPLATE_FILTER_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <TVEmptyState title="No notes match your search." />
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => (
            <NoteCard deleteNoteAction={deleteNoteAction} key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  deleteNoteAction,
}: {
  note: RepNoteItem;
  deleteNoteAction: (formData: FormData) => Promise<void>;
}) {
  const hasContext = note.lead || note.account || note.opportunity;

  return (
    <div className="rounded-xl border bg-surface-muted/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {note.title ? (
              <p className="truncate text-sm font-semibold text-foreground">{note.title}</p>
            ) : (
              <TVBadge variant="default">Untitled note</TVBadge>
            )}
            <TVBadge
              className={templateTone[note.templateType] ?? ''}
              variant="default"
            >
              {templateLabel[note.templateType]}
            </TVBadge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {formatDateTime(note.createdAt)}
            </p>
            {hasContext ? (
              <>
                <span className="text-xs text-border">·</span>
                {note.lead ? (
                  <TVBadge variant="default">
                    {note.lead.firstName} {note.lead.lastName}
                  </TVBadge>
                ) : null}
                {note.account ? (
                  <TVBadge variant="default">{note.account.name}</TVBadge>
                ) : null}
                {note.opportunity ? (
                  <TVBadge variant="default">{note.opportunity.name}</TVBadge>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <ToastForm action={deleteNoteAction} successMessage="Note deleted">
          <input name="noteId" type="hidden" value={note.id} />
          <TVButton size="sm" type="submit" variant="ghost">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Delete note</span>
          </TVButton>
        </ToastForm>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {note.body}
      </p>
    </div>
  );
}
