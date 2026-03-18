import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LeadTimeContext } from './lead-time-context';

describe('LeadTimeContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T16:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders lead and rep local time comparison when both locations resolve', () => {
    render(
      <LeadTimeContext leadLocation="Dallas, Texas" repLocation="Phoenix, Arizona" />,
    );

    expect(screen.getByLabelText(/lead time comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/dallas, texas/i)).toBeInTheDocument();
    expect(screen.getByText(/phoenix, arizona/i)).toBeInTheDocument();
    expect(screen.getByText(/lead is/i)).toBeInTheDocument();
  });

  it('shows a fallback when lead location is missing', () => {
    render(<LeadTimeContext leadLocation={null} repLocation="Phoenix, Arizona" />);

    expect(screen.getByLabelText(/lead time comparison unavailable/i)).toBeInTheDocument();
  });
});
