import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalogClockWidget } from './analog-clock-widget';

describe('AnalogClockWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T16:00:00.000Z'));
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('renders the analog clock and lets the user change time zones', () => {
    render(<AnalogClockWidget />);

    expect(screen.getByText(/analog clock/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/clock time zone/i)).toHaveValue('America/New_York');

    fireEvent.change(screen.getByLabelText(/clock time zone/i), {
      target: { value: 'America/Phoenix' },
    });

    expect(screen.getByLabelText(/clock time zone/i)).toHaveValue('America/Phoenix');
    expect(window.localStorage.getItem('trainovations-analog-clock-timezone')).toBe(
      'America/Phoenix',
    );
  });
});
