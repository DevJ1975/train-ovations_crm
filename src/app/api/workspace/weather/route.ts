import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import { lookupCityWeather } from '@/lib/weather/open-meteo';

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser('/workspace');

  if (user.role !== 'sales_rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city')?.trim();

  if (!city) {
    return NextResponse.json({ error: 'City is required' }, { status: 400 });
  }

  try {
    const result = await lookupCityWeather(city);

    if (!result) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    return NextResponse.json({ weather: result });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load weather right now' },
      { status: 502 },
    );
  }
}
