'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Plane, Route, Hotel } from 'lucide-react';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVInput,
  TVTextarea,
} from '@/components/trainovations';
import {
  buildEmptyTravelDraft,
  buildTravelChecklist,
  buildTravelSuggestion,
  buildTravelTimeline,
  getTravelReadinessScore,
  type TravelCalendarCandidate,
  type TravelItineraryDraft,
} from '@/lib/travel/travel-itinerary';

const TRAVEL_ITINERARY_STORAGE_KEY = 'trainovations-travel-itinerary-draft';

function TravelField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  id: keyof TravelItineraryDraft;
  label: string;
  value: string;
  onChange: (field: keyof TravelItineraryDraft, value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <TVInput
        aria-label={label}
        onChange={(event) => onChange(id, event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

export function TravelItineraryWidget({
  travelCalendarCandidates,
}: {
  travelCalendarCandidates: TravelCalendarCandidate[];
}) {
  const [draft, setDraft] = useState<TravelItineraryDraft>(buildEmptyTravelDraft);

  useEffect(() => {
    const stored = window.localStorage.getItem(TRAVEL_ITINERARY_STORAGE_KEY);

    if (!stored) {
      return;
    }

    const parsed = JSON.parse(stored) as TravelItineraryDraft | null;

    if (parsed && typeof parsed === 'object') {
      setDraft({
        ...buildEmptyTravelDraft(),
        ...parsed,
      });
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TRAVEL_ITINERARY_STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const suggestions = useMemo(
    () =>
      travelCalendarCandidates
        .map((candidate) => buildTravelSuggestion(candidate))
        .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null),
    [travelCalendarCandidates],
  );
  const timeline = useMemo(() => buildTravelTimeline(draft), [draft]);
  const checklist = useMemo(() => buildTravelChecklist(draft), [draft]);
  const readinessScore = useMemo(() => getTravelReadinessScore(draft), [draft]);
  const tripLengthLabel = useMemo(() => {
    if (!draft.departureDate || !draft.returnDate) {
      return 'Dates not set';
    }

    const departure = new Date(`${draft.departureDate}T12:00:00`);
    const returning = new Date(`${draft.returnDate}T12:00:00`);
    const diff = Math.round((returning.getTime() - departure.getTime()) / (1000 * 60 * 60 * 24));

    if (Number.isNaN(diff) || diff < 0) {
      return 'Dates need review';
    }

    return `${diff + 1} day${diff === 0 ? '' : 's'}`;
  }, [draft.departureDate, draft.returnDate]);

  function updateField(field: keyof TravelItineraryDraft, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function applySuggestion(suggestionId: string) {
    const suggestion = suggestions.find((item) => item.id === suggestionId);

    if (!suggestion) {
      return;
    }

    setDraft({
      tripLabel: suggestion.tripLabel,
      destination: suggestion.destination,
      departureDate: suggestion.departureDate,
      returnDate: suggestion.returnDate,
      flightItineraryNumber: suggestion.flightItineraryNumber,
      hotelName: suggestion.hotelName,
      hotelConfirmation: suggestion.hotelConfirmation,
      groundTransport: suggestion.groundTransport,
      notes: suggestion.notes,
    });
  }

  function clearDraft() {
    setDraft(buildEmptyTravelDraft());
  }

  return (
    <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <TVCardTitle>Travel itinerary</TVCardTitle>
          <TVCardDescription>
            Track flight, hotel, and ground details in one place, then use calendar travel events to autofill what is already on the schedule.
          </TVCardDescription>
        </div>
        <TVBadge className="bg-primary/10 text-primary" variant="default">
          {suggestions.length} calendar suggestion{suggestions.length === 1 ? '' : 's'}
        </TVBadge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] border bg-[linear-gradient(180deg,_rgba(37,99,235,0.08),_rgba(255,255,255,0.96))] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Trip readiness</p>
            <Plane className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">{readinessScore}%</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Based on dates, flight, hotel, ground plan, and travel notes.
          </p>
        </div>

        <div className="rounded-[1.5rem] border bg-surface-muted/45 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Destination</p>
            <Route className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-3 text-lg font-semibold text-foreground">
            {draft.destination || 'Waiting on destination'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {draft.tripLabel || 'Add a trip label so the board reads clearly.'}
          </p>
        </div>

        <div className="rounded-[1.5rem] border bg-surface-muted/45 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Trip length</p>
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-3 text-lg font-semibold text-foreground">{tripLengthLabel}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {draft.departureDate && draft.returnDate
              ? `${draft.departureDate} to ${draft.returnDate}`
              : 'Set departure and return dates to build the travel arc.'}
          </p>
        </div>

        <div className="rounded-[1.5rem] border bg-surface-muted/45 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Confirmations</p>
            <Hotel className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-3 text-lg font-semibold text-foreground">
            {draft.flightItineraryNumber || draft.hotelConfirmation || 'Not captured yet'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {draft.hotelName || 'Flight and hotel confirmation details stay visible here.'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 rounded-[1.5rem] border bg-surface-muted/45 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <TravelField
              id="tripLabel"
              label="Trip label"
              onChange={updateField}
              placeholder="Rail summit travel"
              value={draft.tripLabel}
            />
            <TravelField
              id="destination"
              label="Destination"
              onChange={updateField}
              placeholder="Chicago, Illinois"
              value={draft.destination}
            />
            <TravelField
              id="departureDate"
              label="Departure date"
              onChange={updateField}
              type="date"
              value={draft.departureDate}
            />
            <TravelField
              id="returnDate"
              label="Return date"
              onChange={updateField}
              type="date"
              value={draft.returnDate}
            />
            <TravelField
              id="flightItineraryNumber"
              label="Flight itinerary"
              onChange={updateField}
              placeholder="Record locator or itinerary"
              value={draft.flightItineraryNumber}
            />
            <TravelField
              id="hotelConfirmation"
              label="Hotel confirmation"
              onChange={updateField}
              placeholder="Hotel confirmation code"
              value={draft.hotelConfirmation}
            />
            <TravelField
              id="hotelName"
              label="Hotel name"
              onChange={updateField}
              placeholder="Hilton Chicago"
              value={draft.hotelName}
            />
            <TravelField
              id="groundTransport"
              label="Ground transport"
              onChange={updateField}
              placeholder="Rental car or car service"
              value={draft.groundTransport}
            />
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Travel notes</span>
            <TVTextarea
              aria-label="Travel notes"
              onChange={(event) => updateField('notes', event.target.value)}
              placeholder="Gate details, baggage notes, on-site contact, parking, or anything that will help on the road."
              value={draft.notes}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <TVButton onClick={clearDraft} size="sm" type="button" variant="ghost">
              Clear itinerary
            </TVButton>
            <TVBadge variant="success">Saved locally</TVBadge>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border bg-[linear-gradient(180deg,_rgba(16,185,129,0.06),_rgba(255,255,255,0.96))] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Travel timeline</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  A cleaner day-by-day travel board for departure, stay, ground movement, and return.
                </p>
              </div>
              <TVBadge variant="success">{timeline.length} stages</TVBadge>
            </div>

            <div className="mt-4 space-y-3">
              {timeline.length ? (
                timeline.map((entry, index) => (
                  <div key={entry.id} className="relative rounded-2xl border bg-white/85 p-4">
                    {index < timeline.length - 1 ? (
                      <div className="absolute left-[1.15rem] top-[3.25rem] h-8 w-px bg-border" />
                    ) : null}
                    <div className="flex gap-3">
                      <div
                        className={
                          entry.tone === 'primary'
                            ? 'mt-1 h-3 w-3 rounded-full bg-primary'
                            : entry.tone === 'accent'
                              ? 'mt-1 h-3 w-3 rounded-full bg-accent'
                              : entry.tone === 'success'
                                ? 'mt-1 h-3 w-3 rounded-full bg-success'
                                : 'mt-1 h-3 w-3 rounded-full bg-slate-400'
                        }
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{entry.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {entry.dateLabel}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">{entry.detail}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed bg-white/70 p-4 text-sm text-muted-foreground">
                  Add dates, lodging, or transport details and the trip timeline will build itself here.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border bg-surface-muted/45 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Travel day checklist</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Useful CRM-style prep items so the rep can see what is still missing before the trip.
                </p>
              </div>
              <TVBadge className="bg-primary/10 text-primary" variant="default">
                {checklist.filter((item) => item.complete).length}/{checklist.length}
              </TVBadge>
            </div>

            <div className="mt-4 grid gap-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border bg-white/80 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      className={item.complete ? 'h-4 w-4 text-success' : 'h-4 w-4 text-muted-foreground'}
                    />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <TVBadge variant={item.complete ? 'success' : 'default'}>
                    {item.complete ? 'Ready' : 'Missing'}
                  </TVBadge>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border bg-surface-muted/45 p-5">
            <p className="text-sm font-medium text-foreground">Calendar travel suggestions</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We scan upcoming calendar entries for travel language like flights, hotels, confirmations, and trip holds.
            </p>

            <div className="mt-4 space-y-3">
              {suggestions.length ? (
                suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="rounded-2xl border bg-white/80 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{suggestion.sourceTitle}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {suggestion.departureDate}
                          {suggestion.destination ? ` • ${suggestion.destination}` : ''}
                        </p>
                      </div>
                      <TVButton onClick={() => applySuggestion(suggestion.id)} size="sm" type="button">
                        Use calendar details
                      </TVButton>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                      <p>{suggestion.flightItineraryNumber ? `Flight: ${suggestion.flightItineraryNumber}` : 'Flight details partial'}</p>
                      <p>{suggestion.hotelConfirmation ? `Hotel: ${suggestion.hotelConfirmation}` : 'Hotel details partial'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed bg-white/70 p-4 text-sm text-muted-foreground">
                  No travel-flavored calendar events were found yet. Manual entry still works, and calendar suggestions will improve when event descriptions include confirmation details.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border bg-[linear-gradient(180deg,_rgba(245,158,11,0.08),_rgba(255,255,255,0.96))] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Helpful extras</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              <li>Keep the destination filled in so weather and local-time widgets can support the trip.</li>
              <li>Use travel notes for badge pickup, baggage details, site contact names, and parking instructions.</li>
              <li>Ground transport is worth tracking because it is usually the detail people forget until they land.</li>
              <li>If you are traveling for meetings, line up the travel board with your calendar and follow-up tasks before departure.</li>
            </ul>
          </div>
        </div>
      </div>
    </TVCard>
  );
}
