import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TravelItineraryWidget } from './travel-itinerary-widget';

describe('TravelItineraryWidget', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('lets reps fill itinerary details from calendar suggestions', () => {
    render(
      <TravelItineraryWidget
        travelCalendarCandidates={[
          {
            id: 'cal_1',
            title: 'Chicago travel hold',
            description:
              'Flight itinerary: AA4455. Hotel: Hilton Chicago. Hotel confirmation: HC7788.',
            startAt: new Date('2026-04-09T17:00:00.000Z'),
            endAt: new Date('2026-04-11T20:00:00.000Z'),
            sourceUrl: 'https://calendar.google.com',
          },
        ]}
      />,
    );

    expect(screen.getByText(/travel itinerary/i)).toBeInTheDocument();
    expect(screen.getByText(/travel timeline/i)).toBeInTheDocument();
    expect(screen.getByText(/travel day checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/calendar travel suggestions/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /use calendar details/i }));

    expect(screen.getByLabelText(/trip label/i)).toHaveValue('Chicago travel hold');
    expect(screen.getByLabelText(/flight itinerary/i)).toHaveValue('AA4455');
    expect(screen.getByLabelText(/hotel confirmation/i)).toHaveValue('HC7788');
    expect(screen.getByLabelText(/hotel name/i)).toHaveValue('Hilton Chicago');
    expect(screen.getByText(/departure day/i)).toBeInTheDocument();
    expect(screen.getByText(/hotel stay/i)).toBeInTheDocument();
  });

  it('supports manual entry and local draft persistence', () => {
    render(<TravelItineraryWidget travelCalendarCandidates={[]} />);

    fireEvent.change(screen.getByLabelText(/trip label/i), {
      target: { value: 'Dallas site visit' },
    });
    fireEvent.change(screen.getByLabelText(/hotel confirmation/i), {
      target: { value: 'DL9981' },
    });

    expect(
      window.localStorage.getItem('trainovations-travel-itinerary-draft'),
    ).toContain('Dallas site visit');
    expect(screen.getByLabelText(/hotel confirmation/i)).toHaveValue('DL9981');
  });
});
