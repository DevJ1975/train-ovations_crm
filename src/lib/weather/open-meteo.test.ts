import { describe, expect, it } from 'vitest';

import { getWeatherLabel } from './open-meteo';

describe('open meteo helpers', () => {
  it('maps known weather codes', () => {
    expect(getWeatherLabel(0)).toBe('Clear sky');
    expect(getWeatherLabel(63)).toBe('Rain');
  });

  it('falls back for unknown weather codes', () => {
    expect(getWeatherLabel(999)).toBe('Conditions unavailable');
  });
});
