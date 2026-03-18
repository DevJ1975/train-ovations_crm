'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PartialBlock } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';

import { TVBadge, TVButton, TVCard, TVCardDescription, TVCardTitle } from '@/components/trainovations';
import { buildDaytimerTemplate, getDaytimerDateKey } from '@/lib/daytimer/daytimer-note';

const DAYTIMER_STORAGE_KEY = 'trainovations-daytimer-notes';

type DaytimerDocuments = Record<string, PartialBlock[]>;

function formatDateLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function DaytimerNotesWidget() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateValue);
  const [documents, setDocuments] = useState<DaytimerDocuments>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedDocuments = window.localStorage.getItem(DAYTIMER_STORAGE_KEY);

    if (storedDocuments) {
      const parsed = JSON.parse(storedDocuments) as DaytimerDocuments | null;

      if (parsed && typeof parsed === 'object') {
        setDocuments(parsed);
      }
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(DAYTIMER_STORAGE_KEY, JSON.stringify(documents));
  }, [documents, isHydrated]);

  const dateKey = getDaytimerDateKey(selectedDate);
  const initialContent = useMemo(
    () => documents[dateKey] ?? buildDaytimerTemplate(formatDateLabel(selectedDate)),
    [dateKey, documents, selectedDate],
  );

  const editor = useCreateBlockNote(
    {
      initialContent,
    },
    [dateKey, initialContent],
  );

  function resetDay() {
    const resetBlocks = buildDaytimerTemplate(formatDateLabel(selectedDate));

    setDocuments((current) => ({
      ...current,
      [dateKey]: resetBlocks,
    }));
  }

  return (
    <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <TVCardTitle>Daytimer notes</TVCardTitle>
          <TVCardDescription>
            A robust daily planner workspace with block editing, slash commands, checklists, and date-based notes for each rep day.
          </TVCardDescription>
        </div>
        <TVBadge className="bg-primary/10 text-primary" variant="default">
          BlockNote powered
        </TVBadge>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4 rounded-[1.5rem] border bg-surface-muted/45 p-5">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="daytimer-date">
              Day page
            </label>
            <input
              className="tv-form-input mt-2"
              id="daytimer-date"
              onChange={(event) => setSelectedDate(event.target.value)}
              type="date"
              value={selectedDate}
            />
          </div>

          <div className="rounded-2xl border bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">How to use it</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              <li>Type `/` for block commands and richer note structure.</li>
              <li>Use `Tab` and `Shift+Tab` to nest lists and action items.</li>
              <li>Keep one note page per day so meeting prep and follow-up stay in the same place.</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <TVButton onClick={resetDay} size="sm" type="button" variant="ghost">
              Reset day template
            </TVButton>
            <TVBadge variant="success">Saved locally</TVBadge>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border bg-white">
          <BlockNoteView
            editor={editor}
            onChange={() => {
              setDocuments((current) => ({
                ...current,
                [dateKey]: editor.document as PartialBlock[],
              }));
            }}
          />
        </div>
      </div>
    </TVCard>
  );
}
