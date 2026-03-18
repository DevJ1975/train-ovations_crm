import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WeatherWidget } from './weather-widget';

describe('WeatherWidget', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          weather: {
            city: 'Tokyo',
            country: 'Japan',
            latitude: 35.68,
            longitude: 139.76,
            timezone: 'Asia/Tokyo',
            localTime: '2026-03-15T09:00',
            temperatureCelsius: 18,
            apparentTemperatureCelsius: 16,
            windSpeedKph: 12,
            humidityPercent: 62,
            precipitationChancePercent: 20,
            weatherLabel: 'Partly cloudy',
            weatherCode: 2,
            isDay: true,
            highCelsius: 20,
            lowCelsius: 11,
            sunrise: '2026-03-15T06:02',
            sunset: '2026-03-15T17:54',
          },
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('loads weather for a searched city', async () => {
    render(<WeatherWidget />);

    fireEvent.change(screen.getByLabelText(/weather city/i), {
      target: { value: 'Tokyo' },
    });
    fireEvent.click(screen.getByRole('button', { name: /get weather/i }));

    await waitFor(() => {
      expect(screen.getByText(/tokyo, japan/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/partly cloudy/i)).toBeInTheDocument();
    expect(screen.getByText(/feels like 16°c/i)).toBeInTheDocument();
    expect(window.localStorage.getItem('trainovations-weather-city')).toBe('Tokyo');
  });
});
