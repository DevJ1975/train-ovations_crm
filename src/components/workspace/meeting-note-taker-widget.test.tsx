import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MeetingNoteTakerWidget } from './meeting-note-taker-widget';

describe('MeetingNoteTakerWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('tracks elapsed time and moves through note sections', () => {
    render(<MeetingNoteTakerWidget />);

    expect(screen.getByText(/meeting note timer/i)).toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getAllByText(/introductions/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('00:03')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next note section/i }));
    expect(screen.getAllByText(/discovery/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });
});
