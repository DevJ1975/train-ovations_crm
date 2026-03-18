'use client';

import { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TVButton, TVCard, TVCardTitle, TVCardDescription, TVInput } from '@/components/trainovations';

interface BookingSettingsProps {
  slug: string;
  initialEnabled: boolean;
  initialTitle: string | null;
  initialDuration: number;
}

const DURATION_OPTIONS = [15, 30, 45, 60];

export function BookingSettings({
  slug,
  initialEnabled,
  initialTitle,
  initialDuration,
}: BookingSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [title, setTitle] = useState(initialTitle ?? '');
  const [duration, setDuration] = useState(initialDuration);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const bookingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/book/${slug}`
    : `/book/${slug}`;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/workspace/rep-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingEnabled: enabled,
          bookingTitle: title || null,
          bookingDuration: duration,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Booking settings saved');
    } catch {
      toast.error('Could not save settings');
    } finally {
      setSaving(false);
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(bookingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <TVCard className="space-y-5">
      <div>
        <TVCardTitle>Booking page</TVCardTitle>
        <TVCardDescription>
          Let leads schedule time with you directly. Share your booking URL on LinkedIn, emails,
          or your landing page.
        </TVCardDescription>
      </div>

      {/* Enable toggle */}
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border bg-surface-muted/50 p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Enable booking page</p>
          <p className="text-xs text-muted-foreground">
            When on, leads can visit your booking URL and request a meeting.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            enabled ? 'bg-primary' : 'bg-border'
          }`}
          onClick={() => setEnabled((v) => !v)}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </label>

      {enabled && (
        <>
          {/* Booking URL */}
          <div className="space-y-1">
            <p className="text-label text-foreground">Your booking URL</p>
            <div className="flex items-center gap-2 rounded-xl border bg-surface-muted/60 px-3 py-2">
              <p className="flex-1 truncate font-mono text-sm text-foreground">{bookingUrl}</p>
              <button
                className="shrink-0 rounded-lg border bg-white p-1.5 hover:bg-surface-muted transition-colors"
                onClick={copyUrl}
                title="Copy URL"
              >
                {copied ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} className="text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Booking title */}
          <div className="space-y-1">
            <label className="text-label text-foreground" htmlFor="booking-title">
              Booking page title
            </label>
            <TVInput
              id="booking-title"
              placeholder={`Book a ${duration}-min call with me`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <p className="text-label text-foreground">Meeting duration</p>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
                    duration === d
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-white text-foreground hover:border-primary/40'
                  }`}
                  onClick={() => setDuration(d)}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <TVButton disabled={saving} onClick={save}>
        {saving ? 'Saving…' : 'Save booking settings'}
      </TVButton>
    </TVCard>
  );
}
