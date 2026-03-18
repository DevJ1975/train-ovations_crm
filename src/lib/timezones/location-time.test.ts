import { describe, expect, it } from 'vitest';

import {
  formatTimeForZone,
  getTimeDifferenceLabel,
  resolveLocationTimeZone,
} from './location-time';

describe('location time utilities', () => {
  it('resolves supported location strings into time zones', () => {
    expect(resolveLocationTimeZone('Phoenix, Arizona')?.timeZone).toBe('America/Phoenix');
    expect(resolveLocationTimeZone('Dallas, Texas')?.timeZone).toBe('America/Chicago');
    expect(resolveLocationTimeZone('Unknown')?.timeZone).toBeUndefined();
  });

  it('formats time and compares offsets between rep and lead', () => {
    const date = new Date('2026-03-14T16:00:00.000Z');

    expect(formatTimeForZone(date, 'America/Phoenix').zone).toMatch(/MST|GMT-7/);
    expect(
      getTimeDifferenceLabel('America/Phoenix', 'America/New_York', date),
    ).toMatch(/ahead/);
  });
});
