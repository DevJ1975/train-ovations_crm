'use client';

import { useEffect, useState } from 'react';

import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVInput,
} from '@/components/trainovations';
import type { WeatherLookupResult } from '@/lib/weather/open-meteo';

const WEATHER_CITY_STORAGE_KEY = 'trainovations-weather-city';

function formatLocalTime(value: string, timeZone: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  }).format(date);
}

function formatTemperature(value: number | null) {
  if (value === null) {
    return 'N/A';
  }

  return `${Math.round(value)}°C`;
}

function WeatherStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white/80 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function WeatherWidget() {
  const [city, setCity] = useState('London');
  const [submittedCity, setSubmittedCity] = useState('');
  const [weather, setWeather] = useState<WeatherLookupResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedCity = window.localStorage.getItem(WEATHER_CITY_STORAGE_KEY);

    if (!storedCity) {
      return;
    }

    setCity(storedCity);
    setSubmittedCity(storedCity);
  }, []);

  useEffect(() => {
    if (!submittedCity) {
      return;
    }

    let isCancelled = false;

    async function loadWeather() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/workspace/weather?city=${encodeURIComponent(submittedCity)}`,
        );
        const payload = (await response.json()) as {
          weather?: WeatherLookupResult;
          error?: string;
        };

        if (!response.ok || !payload.weather) {
          throw new Error(payload.error ?? 'Unable to load weather');
        }

        if (!isCancelled) {
          setWeather(payload.weather);
          window.localStorage.setItem(WEATHER_CITY_STORAGE_KEY, submittedCity);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setWeather(null);
          setError(
            loadError instanceof Error ? loadError.message : 'Unable to load weather',
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadWeather();

    return () => {
      isCancelled = true;
    };
  }, [submittedCity]);

  return (
    <TVCard className="space-y-4 rounded-[2rem] border-white/60 bg-white/90">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <TVCardTitle>Global weather</TVCardTitle>
          <TVCardDescription>
            Search any city worldwide to get current conditions, local time, and same-day travel context.
          </TVCardDescription>
        </div>
        <TVBadge className="bg-primary/10 text-primary" variant="default">
          Worldwide city lookup
        </TVBadge>
      </div>

      <form
        className="flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmittedCity(city.trim());
        }}
      >
        <TVInput
          aria-label="Weather city"
          className="max-w-md"
          onChange={(event) => setCity(event.target.value)}
          placeholder="Search any city, like Tokyo or Sao Paulo"
          value={city}
        />
        <TVButton disabled={!city.trim() || isLoading} type="submit">
          {isLoading ? 'Loading weather...' : 'Get weather'}
        </TVButton>
      </form>

      {error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {weather ? (
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border bg-[linear-gradient(180deg,_rgba(37,99,235,0.08),_rgba(255,255,255,0.96))] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {weather.city}, {weather.country}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {weather.weatherLabel} • {formatLocalTime(weather.localTime, weather.timezone)}
                </p>
              </div>
              <TVBadge variant={weather.isDay ? 'success' : 'default'}>
                {weather.isDay ? 'Daylight' : 'Night'}
              </TVBadge>
            </div>

            <div className="mt-5 flex flex-wrap items-end gap-4">
              <p className="text-5xl font-semibold leading-none text-foreground">
                {formatTemperature(weather.temperatureCelsius)}
              </p>
              <p className="text-sm text-muted-foreground">
                Feels like {formatTemperature(weather.apparentTemperatureCelsius)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <WeatherStat
              label="Today high / low"
              value={`${formatTemperature(weather.highCelsius)} / ${formatTemperature(weather.lowCelsius)}`}
            />
            <WeatherStat
              label="Humidity"
              value={`${weather.humidityPercent}%`}
            />
            <WeatherStat
              label="Wind"
              value={`${Math.round(weather.windSpeedKph)} km/h`}
            />
            <WeatherStat
              label="Rain chance"
              value={`${weather.precipitationChancePercent}%`}
            />
            <WeatherStat
              label="Sunrise"
              value={
                weather.sunrise
                  ? formatLocalTime(weather.sunrise, weather.timezone)
                  : 'Unavailable'
              }
            />
            <WeatherStat
              label="Sunset"
              value={
                weather.sunset
                  ? formatLocalTime(weather.sunset, weather.timezone)
                  : 'Unavailable'
              }
            />
          </div>
        </div>
      ) : null}
    </TVCard>
  );
}
