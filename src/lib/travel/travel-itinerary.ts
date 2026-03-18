export interface TravelCalendarCandidate {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  sourceUrl: string | null;
}

export interface TravelItineraryDraft {
  tripLabel: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  flightItineraryNumber: string;
  hotelName: string;
  hotelConfirmation: string;
  groundTransport: string;
  notes: string;
}

export interface TravelSuggestion extends TravelItineraryDraft {
  id: string;
  sourceTitle: string;
}

export interface TravelTimelineEntry {
  id: string;
  title: string;
  dateLabel: string;
  detail: string;
  tone: 'primary' | 'accent' | 'success' | 'default';
}

export interface TravelChecklistItem {
  id: string;
  label: string;
  complete: boolean;
}

const travelKeywordPattern =
  /\b(flight|airline|airport|hotel|lodging|check-in|check out|trip|travel|marriott|hilton|hyatt|westin|delta|united|southwest|american airlines|jetblue|alaska airlines)\b/i;

const hotelBrandPattern =
  /\b([A-Z][A-Za-z&.\- ]+(?:Hotel|Resort|Suites|Inn|Marriott|Hilton|Hyatt|Westin|Sheraton|DoubleTree|Hampton Inn|Holiday Inn))\b/i;

function formatDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDateLabel(value: string) {
  if (!value) {
    return '';
  }

  const parsed = new Date(`${value}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function extractToken(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return '';
}

function extractDestination(title: string) {
  const explicitMatch = title.match(
    /\b(?:to|in|for)\s+([A-Z][A-Za-z.\- ]+(?:,\s?[A-Z][A-Za-z.\- ]+)?)$/,
  );

  if (explicitMatch?.[1]) {
    return explicitMatch[1].trim();
  }

  return '';
}

export function buildEmptyTravelDraft(): TravelItineraryDraft {
  return {
    tripLabel: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    flightItineraryNumber: '',
    hotelName: '',
    hotelConfirmation: '',
    groundTransport: '',
    notes: '',
  };
}

export function buildTravelSuggestion(
  candidate: TravelCalendarCandidate,
): TravelSuggestion | null {
  const description = candidate.description ?? '';
  const combined = `${candidate.title}\n${description}`;

  if (!travelKeywordPattern.test(combined)) {
    return null;
  }

  const flightItineraryNumber = extractToken(combined, [
    /(?:flight(?: itinerary)?|record locator|airline confirmation|air confirmation|pnr|itinerary)(?: number| no\.?| #|:)?\s*([A-Z0-9-]{4,})/i,
  ]);
  const hotelConfirmation = extractToken(combined, [
    /(?:hotel confirmation|hotel conf(?:irmation)?|lodging confirmation)(?: number| no\.?| #|:)?\s*([A-Z0-9-]{4,})/i,
    /(?:hotel|lodging).{0,24}?(?:confirmation|conf(?:irmation)?)(?: number| no\.?| #|:)?\s*([A-Z0-9-]{4,})/i,
  ]);
  const hotelName =
    extractToken(combined, [
      /(?:hotel|lodging|stay at)(?: name)?[:\s-]+([A-Za-z0-9&\- ]{3,60})/i,
    ]) || combined.match(hotelBrandPattern)?.[1]?.trim() || '';
  const groundTransport = extractToken(combined, [
    /(?:rental car|car service|ground transport|uber reservation|lyft reservation)(?:[:\s-]+)([A-Za-z0-9&.\- ]{3,60})/i,
  ]);

  return {
    id: candidate.id,
    sourceTitle: candidate.title,
    tripLabel: candidate.title,
    destination: extractDestination(candidate.title),
    departureDate: formatDateInputValue(candidate.startAt),
    returnDate: formatDateInputValue(candidate.endAt),
    flightItineraryNumber,
    hotelName,
    hotelConfirmation,
    groundTransport,
    notes: description,
  };
}

export function buildTravelTimeline(draft: TravelItineraryDraft): TravelTimelineEntry[] {
  const entries: TravelTimelineEntry[] = [];

  if (draft.departureDate) {
    entries.push({
      id: 'departure',
      title: 'Departure day',
      dateLabel: formatDateLabel(draft.departureDate),
      detail: draft.flightItineraryNumber
        ? `Flight ${draft.flightItineraryNumber}${draft.destination ? ` to ${draft.destination}` : ''}`
        : draft.destination
          ? `Travel day to ${draft.destination}`
          : 'Departure details still being finalized.',
      tone: 'primary',
    });
  }

  if (draft.hotelName || draft.hotelConfirmation) {
    entries.push({
      id: 'hotel',
      title: 'Hotel stay',
      dateLabel: draft.destination ? `${draft.destination}` : 'Lodging',
      detail: [
        draft.hotelName,
        draft.hotelConfirmation ? `Confirmation ${draft.hotelConfirmation}` : '',
      ]
        .filter(Boolean)
        .join(' • ') || 'Hotel details still being finalized.',
      tone: 'accent',
    });
  }

  if (draft.groundTransport) {
    entries.push({
      id: 'ground',
      title: 'Ground transport',
      dateLabel: draft.destination ? `${draft.destination}` : 'On the ground',
      detail: draft.groundTransport,
      tone: 'default',
    });
  }

  if (draft.returnDate) {
    entries.push({
      id: 'return',
      title: 'Return day',
      dateLabel: formatDateLabel(draft.returnDate),
      detail: draft.destination
        ? `Return travel from ${draft.destination}`
        : 'Return travel is on the calendar.',
      tone: 'success',
    });
  }

  return entries;
}

export function buildTravelChecklist(draft: TravelItineraryDraft): TravelChecklistItem[] {
  return [
    {
      id: 'dates',
      label: 'Travel dates locked',
      complete: Boolean(draft.departureDate && draft.returnDate),
    },
    {
      id: 'flight',
      label: 'Flight confirmation added',
      complete: Boolean(draft.flightItineraryNumber),
    },
    {
      id: 'hotel',
      label: 'Hotel details captured',
      complete: Boolean(draft.hotelName || draft.hotelConfirmation),
    },
    {
      id: 'ground',
      label: 'Ground plan ready',
      complete: Boolean(draft.groundTransport),
    },
    {
      id: 'notes',
      label: 'Road notes prepared',
      complete: Boolean(draft.notes.trim()),
    },
  ];
}

export function getTravelReadinessScore(draft: TravelItineraryDraft) {
  const checklist = buildTravelChecklist(draft);
  const completed = checklist.filter((item) => item.complete).length;

  return checklist.length ? Math.round((completed / checklist.length) * 100) : 0;
}
