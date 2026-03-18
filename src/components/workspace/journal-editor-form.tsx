'use client';

import { useState } from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';

import { TVButton, TVInput } from '@/components/trainovations';

export function JournalEditorForm({
  createEntryAction,
}: {
  createEntryAction: (formData: FormData) => Promise<void>;
}) {
  const [bodyMarkdown, setBodyMarkdown] = useState('');

  const editor = useCreateBlockNote({
    initialContent: [{ type: 'paragraph', content: '' }],
  });

  function handleEditorChange() {
    setBodyMarkdown(editor.blocksToMarkdownLossy(editor.document));
  }

  return (
    <form action={createEntryAction} className="space-y-4">
      <TVInput name="title" placeholder="Title (optional)" type="text" />

      <input name="body" type="hidden" value={bodyMarkdown} />

      {/*
        NOTE: No overflow-hidden here.
        BlockNote's slash-command menu is rendered as a Mantine Popover with
        position:absolute inside the editor's own DOM subtree. overflow-hidden
        on a parent clips it before it can paint outside the editor box.
        We achieve the rounded-border look through targeted child rounding instead.
      */}
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

        {/*
          position:relative here gives BlockNote's absolute-positioned
          Popover dropdown a proper ancestor to anchor against, keeping
          it inside the visible scroll area and avoiding viewport overflow.
        */}
        <div className="journal-editor-body relative">
          <BlockNoteView
            editor={editor}
            onChange={handleEditorChange}
            theme="light"
          />
        </div>
      </div>

      <TVButton disabled={!bodyMarkdown.trim()} type="submit">
        Save entry
      </TVButton>
    </form>
  );
}
