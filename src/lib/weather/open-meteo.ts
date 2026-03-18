export interface WeatherLookupResult {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  localTime: string;
  temperatureCelsius: number;
  apparentTemperatureCelsius: number;
  windSpeedKph: number;
  humidityPercent: number;
  precipitationChancePercent: number;
  weatherLabel: string;
  weatherCode: number;
  isDay: boolean;
  highCelsius: number | null;
  lowCelsius: number | null;
  sunrise: string | null;
  sunset: string | null;
}

interface GeocodingResponse {
  results?: Array<{
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
  }>;
}

interface ForecastResponse {
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
    is_day: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    sunrise?: string[];
    sunset?: string[];
  };
}

const weatherCodeLabels: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Heavy thunderstorm with hail',
};

export function getWeatherLabel(code: number) {
  return weatherCodeLabels[code] ?? 'Conditions unavailable';
}

export async function lookupCityWeather(city: string): Promise<WeatherLookupResult | null> {
  const geocodingUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
  geocodingUrl.searchParams.set('name', city);
  geocodingUrl.searchParams.set('count', '1');
  geocodingUrl.searchParams.set('language', 'en');
  geocodingUrl.searchParams.set('format', 'json');

  const geocodingResponse = await fetch(geocodingUrl.toString(), {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!geocodingResponse.ok) {
    throw new Error('Failed to geocode city');
  }

  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;
  const match = geocodingData.results?.[0];

  if (!match) {
    return null;
  }

  const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
  forecastUrl.searchParams.set('latitude', String(match.latitude));
  forecastUrl.searchParams.set('longitude', String(match.longitude));
  forecastUrl.searchParams.set(
    'current',
    [
      'temperature_2m',
      'apparent_temperature',
      'weather_code',
      'wind_speed_10m',
      'relative_humidity_2m',
      'is_day',
    ].join(','),
  );
  forecastUrl.searchParams.set(
    'daily',
    [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
    ].join(','),
  );
  forecastUrl.searchParams.set('forecast_days', '1');
  forecastUrl.searchParams.set('timezone', match.timezone || 'auto');

  const forecastResponse = await fetch(forecastUrl.toString(), {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!forecastResponse.ok) {
    throw new Error('Failed to fetch forecast');
  }

  const forecastData = (await forecastResponse.json()) as ForecastResponse;

  if (!forecastData.current) {
    return null;
  }

  return {
    city: match.name,
    country: match.country,
    latitude: match.latitude,
    longitude: match.longitude,
    timezone: match.timezone,
    localTime: forecastData.current.time,
    temperatureCelsius: forecastData.current.temperature_2m,
    apparentTemperatureCelsius: forecastData.current.apparent_temperature,
    windSpeedKph: forecastData.current.wind_speed_10m,
    humidityPercent: forecastData.current.relative_humidity_2m,
    precipitationChancePercent: forecastData.daily?.precipitation_probability_max?.[0] ?? 0,
    weatherLabel: getWeatherLabel(forecastData.current.weather_code),
    weatherCode: forecastData.current.weather_code,
    isDay: forecastData.current.is_day === 1,
    highCelsius: forecastData.daily?.temperature_2m_max?.[0] ?? null,
    lowCelsius: forecastData.daily?.temperature_2m_min?.[0] ?? null,
    sunrise: forecastData.daily?.sunrise?.[0] ?? null,
    sunset: forecastData.daily?.sunset?.[0] ?? null,
  };
}
