'use client';

import { useEffect, useMemo, useState } from 'react';

import { TVBadge, TVCard, TVCardDescription, TVCardTitle } from '@/components/trainovations';

const CLOCK_TIMEZONE_STORAGE_KEY = 'trainovations-analog-clock-timezone';

const timeZoneOptions = [
  { value: 'America/Los_Angeles', label: 'Pacific' },
  { value: 'America/Phoenix', label: 'Arizona' },
  { value: 'America/Denver', label: 'Mountain' },
  { value: 'America/Chicago', label: 'Central' },
  { value: 'America/New_York', label: 'Eastern' },
] as const;

function getTimeParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(date);

  return {
    hour: Number(parts.find((part) => part.type === 'hour')?.value ?? '0'),
    minute: Number(parts.find((part) => part.type === 'minute')?.value ?? '0'),
    second: Number(parts.find((part) => part.type === 'second')?.value ?? '0'),
  };
}

function getDisplayLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export function AnalogClockWidget() {
  const [now, setNow] = useState(() => new Date());
  const [timeZone, setTimeZone] = useState<string>('America/New_York');

  useEffect(() => {
    const stored = window.localStorage.getItem(CLOCK_TIMEZONE_STORAGE_KEY);

    if (stored && timeZoneOptions.some((option) => option.value === stored)) {
      setTimeZone(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CLOCK_TIMEZONE_STORAGE_KEY, timeZone);
  }, [timeZone]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const timeParts = useMemo(() => getTimeParts(now, timeZone), [now, timeZone]);
  const hourRotation = (timeParts.hour % 12) * 30 + timeParts.minute * 0.5;
  const minuteRotation = timeParts.minute * 6 + timeParts.second * 0.1;
  const secondRotation = timeParts.second * 6;
  const selectedOption =
    timeZoneOptions.find((option) => option.value === timeZone) ?? timeZoneOptions[0];

  return (
    <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <TVCardTitle>Analog clock</TVCardTitle>
          <TVCardDescription>
            Keep a live clock on the command center and switch time zones based on who you are working.
          </TVCardDescription>
        </div>
        <TVBadge className="bg-primary/10 text-primary" variant="default">
          {selectedOption.label}
        </TVBadge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
        <div className="flex justify-center">
          <div
            aria-label={`Analog clock for ${selectedOption.label}`}
            className="relative h-48 w-48 rounded-full border border-primary/20 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.10),_transparent_45%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.96))] shadow-inner"
          >
            {Array.from({ length: 12 }).map((_, index) => {
              const rotation = index * 30;

              return (
                <div
                  key={rotation}
                  className="absolute left-1/2 top-2 h-4 w-px origin-bottom bg-slate-400"
                  style={{ transform: `translateX(-50%) rotate(${rotation}deg)`, transformOrigin: 'center 88px' }}
                />
              );
            })}

            <div
              className="absolute left-1/2 top-1/2 h-12 w-1.5 -translate-x-1/2 -translate-y-full rounded-full bg-slate-900"
              style={{ transform: `translate(-50%, -100%) rotate(${hourRotation}deg)`, transformOrigin: 'center bottom' }}
            />
            <div
              className="absolute left-1/2 top-1/2 h-16 w-1 -translate-x-1/2 -translate-y-full rounded-full bg-primary"
              style={{ transform: `translate(-50%, -100%) rotate(${minuteRotation}deg)`, transformOrigin: 'center bottom' }}
            />
            <div
              className="absolute left-1/2 top-1/2 h-[4.5rem] w-0.5 -translate-x-1/2 -translate-y-full rounded-full bg-danger"
              style={{ transform: `translate(-50%, -100%) rotate(${secondRotation}deg)`, transformOrigin: 'center bottom' }}
            />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-surface-muted/60 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current time</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{getDisplayLabel(now, timeZone)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="analog-clock-time-zone">
              Time zone
            </label>
            <select
              aria-label="Clock time zone"
              className="h-11 w-full rounded-md border bg-surface px-3 text-body text-foreground"
              id="analog-clock-time-zone"
              onChange={(event) => setTimeZone(event.target.value)}
              value={timeZone}
            >
              {timeZoneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </TVCard>
  );
}
