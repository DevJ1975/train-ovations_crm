'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
} from '@/components/trainovations';

const MEETING_NOTE_TAKER_STORAGE_KEY = 'trainovations-meeting-note-taker-sections';

const defaultSections = [
  'Introductions',
  'Discovery',
  'Demo',
  'Next steps',
] as const;

function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export function MeetingNoteTakerWidget() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(defaultSections[0]);
  const [sections, setSections] = useState<string[]>([...defaultSections]);

  useEffect(() => {
    const storedSections = window.localStorage.getItem(MEETING_NOTE_TAKER_STORAGE_KEY);

    if (!storedSections) {
      return;
    }

    const parsed = JSON.parse(storedSections) as string[] | null;

    if (Array.isArray(parsed) && parsed.length) {
      setSections(parsed);
      setActiveSection(parsed[0]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(MEETING_NOTE_TAKER_STORAGE_KEY, JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  const sectionIndex = useMemo(
    () => Math.max(sections.findIndex((section) => section === activeSection), 0),
    [activeSection, sections],
  );

  function cycleSection() {
    setActiveSection((current) => {
      const currentIndex = sections.findIndex((section) => section === current);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % sections.length;

      return sections[nextIndex] ?? sections[0];
    });
  }

  function resetMeeting() {
    setElapsedSeconds(0);
    setIsRunning(false);
    setActiveSection(sections[0] ?? defaultSections[0]);
  }

  return (
    <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <TVCardTitle>Meeting note timer</TVCardTitle>
          <TVCardDescription>
            Track live meeting time and move through note-taking sections while the call is happening.
          </TVCardDescription>
        </div>
        <TVBadge className="bg-primary/10 text-primary" variant="default">
          Section {sectionIndex + 1} of {sections.length}
        </TVBadge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.5rem] border bg-[linear-gradient(180deg,_rgba(37,99,235,0.07),_rgba(255,255,255,0.92))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Elapsed time</p>
          <p className="mt-3 font-mono text-5xl font-semibold text-foreground">
            {formatElapsedTime(elapsedSeconds)}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <TVButton onClick={() => setIsRunning(true)} size="sm" type="button">
              Start
            </TVButton>
            <TVButton onClick={() => setIsRunning(false)} size="sm" type="button" variant="ghost">
              Pause
            </TVButton>
            <TVButton onClick={resetMeeting} size="sm" type="button" variant="ghost">
              Reset
            </TVButton>
          </div>
        </div>

        <div className="space-y-3 rounded-[1.5rem] border bg-surface-muted/60 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Active section</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{activeSection}</p>
          </div>

          <TVButton onClick={cycleSection} size="sm" type="button" variant="ghost">
            Next note section
          </TVButton>

          <div className="space-y-2 pt-2">
            {sections.map((section) => {
              const isActive = section === activeSection;

              return (
                <div
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    isActive
                      ? 'border-primary/30 bg-primary/10 text-foreground'
                      : 'border-border bg-white/80 text-muted-foreground'
                  }`}
                  key={section}
                >
                  {section}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </TVCard>
  );
}
