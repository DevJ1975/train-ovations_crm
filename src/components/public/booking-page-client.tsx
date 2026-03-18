'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { TVButton, TVCard, TVInput, TVTextarea } from '@/components/trainovations';

interface BookingPageClientProps {
  slug: string;
  repName: string;
  repTitle: string;
  bookingTitle: string;
  bookingDuration: number;
  photoUrl: string | null;
}

const DAYS_AHEAD = 14;
const HOUR_START = 9;
const HOUR_END = 17;

function getDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= DAYS_AHEAD; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0 && d.getDay() !== 6) dates.push(d); // skip weekends
  }
  return dates;
}

function getSlots(date: Date, durationMins: number): Date[] {
  const slots: Date[] = [];
  for (let h = HOUR_START; h < HOUR_END; h += durationMins / 60) {
    const d = new Date(date);
    d.setHours(Math.floor(h), (h % 1) * 60, 0, 0);
    slots.push(d);
  }
  return slots;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function BookingPageClient({
  slug,
  repName,
  repTitle,
  bookingTitle,
  bookingDuration,
  photoUrl,
}: BookingPageClientProps) {
  const dates = getDates();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBook() {
    if (!selectedSlot || !name || !email) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/book/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: name,
          guestEmail: email,
          guestPhone: phone || undefined,
          guestNotes: notes || undefined,
          requestedAt: selectedSlot.toISOString(),
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'Something went wrong');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white px-6">
        <TVCard className="w-full max-w-md space-y-4 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <p className="text-xl font-semibold text-foreground">Booking request sent!</p>
          <p className="text-sm text-muted-foreground">
            {repName} will confirm your{' '}
            {fmtTime(selectedSlot!)} slot on {fmtDate(selectedDate!)}. Check your email at{' '}
            <span className="font-medium text-foreground">{email}</span>.
          </p>
        </TVCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 py-12">
      <div className="mx-auto max-w-xl space-y-8">
        {/* Rep header */}
        <div className="flex items-center gap-4">
          {photoUrl ? (
            <img alt={repName} className="h-16 w-16 rounded-full object-cover" src={photoUrl} />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {repName[0]}
            </div>
          )}
          <div>
            <p className="text-xl font-semibold text-foreground">{repName}</p>
            <p className="text-sm text-muted-foreground">{repTitle}</p>
          </div>
        </div>

        <TVCard className="space-y-1">
          <p className="text-lg font-semibold text-foreground">{bookingTitle}</p>
          <p className="text-sm text-muted-foreground">{bookingDuration} minutes · Video or phone call</p>
        </TVCard>

        {/* Date picker */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Select a date</p>
          <div className="flex flex-wrap gap-2">
            {dates.map((d) => (
              <button
                key={d.toISOString()}
                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                  selectedDate?.toDateString() === d.toDateString()
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-white text-foreground hover:border-primary/40'
                }`}
                onClick={() => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                }}
              >
                {fmtDate(d)}
              </button>
            ))}
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Select a time</p>
            <div className="grid grid-cols-3 gap-2">
              {getSlots(selectedDate, bookingDuration).map((slot) => (
                <button
                  key={slot.toISOString()}
                  className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                    selectedSlot?.toISOString() === slot.toISOString()
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-white text-foreground hover:border-primary/40'
                  }`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {fmtTime(slot)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contact form */}
        {selectedSlot && (
          <TVCard className="space-y-4">
            <p className="text-sm font-medium text-foreground">
              Your details — {fmtDate(selectedDate!)} at {fmtTime(selectedSlot)}
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-label text-foreground" htmlFor="book-name">Full name *</label>
                <TVInput id="book-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div className="space-y-1">
                <label className="text-label text-foreground" htmlFor="book-email">Email *</label>
                <TVInput id="book-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
              </div>
              <div className="space-y-1">
                <label className="text-label text-foreground" htmlFor="book-phone">Phone (optional)</label>
                <TVInput id="book-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-label text-foreground" htmlFor="book-notes">Notes (optional)</label>
                <TVTextarea id="book-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything you'd like to discuss?" />
              </div>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <TVButton
              className="w-full"
              disabled={submitting || !name || !email}
              onClick={handleBook}
            >
              {submitting ? 'Booking…' : 'Request booking'}
            </TVButton>
          </TVCard>
        )}
      </div>
    </div>
  );
}
