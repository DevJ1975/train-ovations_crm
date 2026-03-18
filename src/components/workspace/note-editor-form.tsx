'use client';

import { useState } from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import type { Block } from '@blocknote/core';
import type { NoteTemplateType } from '@prisma/client';

import { TVButton, TVInput } from '@/components/trainovations';

// ─── Template initial content ─────────────────────────────────────────────────

const TEMPLATE_CONTENT: Record<NoteTemplateType, Block[]> = {
  blank: [{ type: 'paragraph', content: '' }] as unknown as Block[],
  meeting_notes: [
    { type: 'heading', content: 'Meeting Summary', props: { level: 2 } },
    { type: 'paragraph', content: 'Summarize the key points discussed...' },
    { type: 'heading', content: 'Action Items', props: { level: 2 } },
    { type: 'bulletListItem', content: '' },
    { type: 'heading', content: 'Follow-Up', props: { level: 2 } },
    { type: 'paragraph', content: 'What happens next...' },
  ] as unknown as Block[],
  account_brief: [
    { type: 'heading', content: 'Account Overview', props: { level: 2 } },
    { type: 'paragraph', content: 'Describe the account, their business, and goals...' },
    { type: 'heading', content: 'Key Contacts', props: { level: 2 } },
    { type: 'bulletListItem', content: '' },
    { type: 'heading', content: 'Current Status', props: { level: 2 } },
    { type: 'paragraph', content: 'Where are we in the relationship...' },
    { type: 'heading', content: 'Opportunities', props: { level: 2 } },
    { type: 'paragraph', content: 'Open deals and expansion signals...' },
  ] as unknown as Block[],
  follow_up_plan: [
    { type: 'heading', content: 'Follow-Up Plan', props: { level: 2 } },
    { type: 'paragraph', content: 'Context for this follow-up...' },
    { type: 'heading', content: 'Next Steps', props: { level: 2 } },
    { type: 'numberedListItem', content: '' },
    { type: 'heading', content: 'Timeline', props: { level: 2 } },
    { type: 'paragraph', content: 'When each step should happen...' },
  ] as unknown as Block[],
};

const TEMPLATE_LABELS: Record<NoteTemplateType, string> = {
  blank: 'Blank note',
  meeting_notes: 'Meeting notes',
  account_brief: 'Account brief',
  follow_up_plan: 'Follow-up plan',
};

const TEMPLATE_DESCRIPTIONS: Record<NoteTemplateType, string> = {
  blank: 'Start from scratch',
  meeting_notes: 'Summary, action items, follow-up',
  account_brief: 'Overview, contacts, status, opportunities',
  follow_up_plan: 'Context, next steps, timeline',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function NoteEditorForm({
  createNoteAction,
  defaultTemplate = 'blank',
  contextLabel,
}: {
  createNoteAction: (formData: FormData) => Promise<void>;
  defaultTemplate?: NoteTemplateType;
  contextLabel?: string;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplateType>(defaultTemplate);
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [templateApplied, setTemplateApplied] = useState<NoteTemplateType>(defaultTemplate);

  const editor = useCreateBlockNote({
    initialContent: TEMPLATE_CONTENT[defaultTemplate],
  });

  function applyTemplate(template: NoteTemplateType) {
    if (template === templateApplied) return;
    const content = TEMPLATE_CONTENT[template];
    editor.replaceBlocks(editor.document, content);
    setTemplateApplied(template);
    setSelectedTemplate(template);
    setBodyMarkdown(editor.blocksToMarkdownLossy(editor.document));
  }

  function handleEditorChange() {
    setBodyMarkdown(editor.blocksToMarkdownLossy(editor.document));
  }

  const allTemplates = Object.keys(TEMPLATE_LABELS) as NoteTemplateType[];

  return (
    <form action={createNoteAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {allTemplates.map((t) => (
          <button
            key={t}
            className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
              selectedTemplate === t
                ? 'border-primary/50 bg-primary/8 text-foreground shadow-sm'
                : 'border-border/60 bg-surface-muted/40 text-muted-foreground hover:border-primary/30 hover:bg-surface-muted/70 hover:text-foreground'
            }`}
            type="button"
            onClick={() => {
              setSelectedTemplate(t);
              applyTemplate(t);
            }}
          >
            <p className="font-medium">{TEMPLATE_LABELS[t]}</p>
            <p className="mt-0.5 text-xs opacity-75">{TEMPLATE_DESCRIPTIONS[t]}</p>
          </button>
        ))}
      </div>

      <TVInput name="title" placeholder={contextLabel ? `Title — ${contextLabel}` : 'Title (optional)'} type="text" />

      <input name="templateType" type="hidden" value={selectedTemplate} />
      <input name="body" type="hidden" value={bodyMarkdown} />

      <div className="journal-editor-shell rounded-xl border border-border bg-white shadow-sm">
        <div className="rounded-t-xl border-b bg-surface-muted/40 px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            Type{' '}
            <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono text-[11px]">
              /
            </kbd>{' '}
            for headings, bullet lists, checklists, and more
          </p>
        </div>
        <div className="journal-editor-body relative">
          <BlockNoteView editor={editor} onChange={handleEditorChange} theme="light" />
        </div>
      </div>

      <TVButton disabled={!bodyMarkdown.trim()} type="submit">
        Save note
      </TVButton>
    </form>
  );
}
