import { describe, expect, it } from 'vitest';

import {
  buildEmptyTravelDraft,
  buildTravelChecklist,
  buildTravelSuggestion,
  buildTravelTimeline,
  getTravelReadinessScore,
} from './travel-itinerary';

describe('travel itinerary helpers', () => {
  it('builds an empty draft', () => {
    expect(buildEmptyTravelDraft()).toEqual({
      tripLabel: '',
      destination: '',
      departureDate: '',
      returnDate: '',
      flightItineraryNumber: '',
      hotelName: '',
      hotelConfirmation: '',
      groundTransport: '',
      notes: '',
    });
  });

  it('extracts travel details from a calendar candidate', () => {
    const suggestion = buildTravelSuggestion({
      id: 'cal_1',
      title: 'Phoenix travel to Chicago',
      description:
        'Flight itinerary: AZ12345. Hotel: Hilton Chicago. Hotel confirmation: H98765. Rental car: Avis midsize.',
      startAt: new Date('2026-04-09T17:00:00.000Z'),
      endAt: new Date('2026-04-11T20:00:00.000Z'),
      sourceUrl: 'https://calendar.google.com',
    });

    expect(suggestion).toEqual(
      expect.objectContaining({
        tripLabel: 'Phoenix travel to Chicago',
        destination: 'Chicago',
        departureDate: '2026-04-09',
        returnDate: '2026-04-11',
        flightItineraryNumber: 'AZ12345',
        hotelName: 'Hilton Chicago',
        hotelConfirmation: 'H98765',
        groundTransport: 'Avis midsize.',
      }),
    );
  });

  it('returns null for non-travel events', () => {
    expect(
      buildTravelSuggestion({
        id: 'cal_2',
        title: 'Weekly pipeline review',
        description: 'Review forecast and new logo pipeline.',
        startAt: new Date('2026-04-09T17:00:00.000Z'),
        endAt: new Date('2026-04-09T18:00:00.000Z'),
        sourceUrl: null,
      }),
    ).toBeNull();
  });

  it('builds a timeline and readiness score from a completed draft', () => {
    const draft = {
      tripLabel: 'Chicago travel hold',
      destination: 'Chicago, Illinois',
      departureDate: '2026-04-09',
      returnDate: '2026-04-11',
      flightItineraryNumber: 'AA4455',
      hotelName: 'Hilton Chicago',
      hotelConfirmation: 'HC7788',
      groundTransport: 'Rental car',
      notes: 'Badge pickup at the north entrance.',
    };

    expect(buildTravelTimeline(draft).map((entry) => entry.id)).toEqual([
      'departure',
      'hotel',
      'ground',
      'return',
    ]);
    expect(buildTravelChecklist(draft).every((item) => item.complete)).toBe(true);
    expect(getTravelReadinessScore(draft)).toBe(100);
  });
});
